"""Tests for POST /api/billing/webhook — signature is now mandatory.

The old handler verified the Stripe signature only when STRIPE_WEBHOOK_SECRET
was set; when unset it built the event straight from the raw body with
stripe.Event.construct_from, so anyone could POST a forged
checkout.session.completed and grant themselves a paid plan. Now:

  * forged/absent signature -> 400, and nothing is written (no billing_events
    row, no subscription update)
  * missing STRIPE_WEBHOOK_SECRET -> 500 server misconfiguration; the payload
    is never parsed, let alone trusted
  * correctly signed event -> processed (subscription updated, event logged)

Hermetic: the signature is computed in-test with the same scheme Stripe uses
(HMAC-SHA256 over "{timestamp}.{payload}"), and the database writers plus
stripe.Subscription.retrieve are replaced with recorders. No network.
"""
import hashlib
import hmac
import json
import time

import pytest
from fastapi.testclient import TestClient

import main

SECRET = "whsec_test_secret"


def _event_payload():
    return json.dumps({
        "id": "evt_test_1",
        "object": "event",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_1",
                "object": "checkout.session",
                "customer": "cus_test_1",
                "subscription": "sub_test_1",
                "metadata": {"user_id": "user-1", "plan": "growth", "billing_period": "monthly"},
            }
        },
    })


def _sign(payload: str, secret: str) -> str:
    ts = int(time.time())
    digest = hmac.new(secret.encode(), f"{ts}.{payload}".encode(), hashlib.sha256).hexdigest()
    return f"t={ts},v1={digest}"


@pytest.fixture
def recorders(monkeypatch):
    rec = {"subs": [], "subs_by_stripe_id": [], "events": []}
    monkeypatch.setattr(
        "database.update_user_subscription",
        lambda **kw: rec["subs"].append(kw),
    )
    monkeypatch.setattr(
        "database.update_user_subscription_by_stripe_id",
        lambda **kw: rec["subs_by_stripe_id"].append(kw) or {"id": "user-1"},
    )
    monkeypatch.setattr(
        "database.save_billing_event",
        lambda *a, **kw: rec["events"].append(a),
    )
    monkeypatch.setattr(
        "stripe.Subscription.retrieve",
        lambda sub_id: {"current_period_end": int(time.time()) + 30 * 86400},
    )
    return rec


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", SECRET)
    return TestClient(main.app)


def test_forged_body_without_valid_signature_is_400(client, recorders):
    # The exploit: a forged checkout.session.completed with a junk signature.
    payload = _event_payload()
    r = client.post(
        "/api/billing/webhook",
        content=payload,
        headers={"stripe-signature": "t=123,v1=deadbeef", "Content-Type": "application/json"},
    )
    assert r.status_code == 400
    assert recorders["subs"] == []
    assert recorders["events"] == []


def test_missing_signature_header_is_400(client, recorders):
    r = client.post(
        "/api/billing/webhook",
        content=_event_payload(),
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 400
    assert recorders["subs"] == []
    assert recorders["events"] == []


def test_missing_secret_is_500_and_nothing_processed(monkeypatch, recorders):
    # Missing secret is a server misconfiguration: refuse everything, never
    # fall back to trusting the body (the old construct_from path).
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    client = TestClient(main.app)
    payload = _event_payload()
    r = client.post(
        "/api/billing/webhook",
        content=payload,
        headers={"stripe-signature": _sign(payload, SECRET), "Content-Type": "application/json"},
    )
    assert r.status_code == 500
    assert recorders["subs"] == []
    assert recorders["events"] == []


def _subscription_updated_payload():
    # Wire-faithful subscription payload: *_decimal fields arrive as strings
    # and stripe-python hydrates them into decimal.Decimal while constructing
    # the event — the exact shape that 500ed in production.
    growth_price = main.PLAN_PRICE_MAP["growth_monthly"]
    return json.dumps({
        "id": "evt_test_2",
        "object": "event",
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_test_1",
                "object": "subscription",
                "customer": "cus_test_1",
                "status": "active",
                "current_period_end": int(time.time()) + 30 * 86400,
                "plan": {"id": growth_price, "object": "plan",
                         "amount": 2900, "amount_decimal": "2900"},
                "items": {"object": "list", "data": [{
                    "id": "si_test_1",
                    "object": "subscription_item",
                    "plan": {"id": growth_price, "object": "plan",
                             "amount_decimal": "2900"},
                    "price": {"id": growth_price, "object": "price",
                              "unit_amount": 2900, "unit_amount_decimal": "2900"},
                }]},
            }
        },
    })


def test_subscription_updated_with_decimals_is_processed(client, recorders):
    # Regression: "Object of type Decimal is not JSON serializable" on every
    # customer.subscription.updated delivery.
    payload = _subscription_updated_payload()
    r = client.post(
        "/api/billing/webhook",
        content=payload,
        headers={"stripe-signature": _sign(payload, SECRET), "Content-Type": "application/json"},
    )
    assert r.status_code == 200
    assert r.json() == {"status": "success"}

    assert len(recorders["subs_by_stripe_id"]) == 1
    update = recorders["subs_by_stripe_id"][0]
    assert update["stripe_sub_id"] == "sub_test_1"
    assert update["plan"] == "growth"
    assert update["status"] == "active"

    assert len(recorders["events"]) == 1
    user_id, event_label, stripe_event_id, details = recorders["events"][0]
    assert (user_id, event_label, stripe_event_id) == ("user-1", "subscription_active", "evt_test_2")
    # The persisted details must survive plain json.dumps (what the supabase
    # client does) and round-trip unchanged, with decimals back in wire form.
    round_tripped = json.loads(json.dumps(details))
    assert round_tripped == details
    assert details["plan"]["amount_decimal"] == "2900"
    assert details["items"]["data"][0]["price"]["unit_amount_decimal"] == "2900"
    assert details["items"]["data"][0]["plan"]["amount_decimal"] == "2900"


def test_correctly_signed_event_is_processed(client, recorders):
    payload = _event_payload()
    r = client.post(
        "/api/billing/webhook",
        content=payload,
        headers={"stripe-signature": _sign(payload, SECRET), "Content-Type": "application/json"},
    )
    assert r.status_code == 200
    assert r.json() == {"status": "success"}
    assert len(recorders["subs"]) == 1
    assert recorders["subs"][0]["user_id"] == "user-1"
    assert recorders["subs"][0]["plan"] == "growth"
    assert recorders["subs"][0]["status"] == "active"
    assert len(recorders["events"]) == 1
    assert recorders["events"][0][:3] == ("user-1", "checkout_session_completed", "evt_test_1")
