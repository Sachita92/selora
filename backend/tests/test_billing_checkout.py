"""Tests for POST /api/billing/create-checkout — the verified-caller binding.

The old handler took user_id and email straight from the request body with no
verification, then wrote update_user_subscription(user_id, status="inactive")
— so anyone could deactivate another user's subscription row by posting their
id. Now identity comes from the verified token via get_current_user; user_id
and email were REMOVED from the body model, so a posted user_id is ignored by
Pydantic and every Stripe object and DB write belongs to the caller.

Hermetic: main.stripe and the database layer are replaced with recording
fakes, and _get_user_id_from_token is stubbed where a signed-in caller is
needed. No network.
"""
import types

import pytest
from fastapi.testclient import TestClient

import main

CALLER = "caller-1"
CALLER_EMAIL = "caller@example.com"
VICTIM = "victim-9"


def _login(monkeypatch):
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (CALLER, CALLER_EMAIL))


def _wire(monkeypatch, user_row=None):
    """Fake Stripe + DB; record every identity that reaches them."""
    calls = {"customer_create": [], "sub_create": [], "sub_update": []}

    def customer_create(email=None, metadata=None):
        calls["customer_create"].append({"email": email, "metadata": metadata})
        return types.SimpleNamespace(id="cus_test1")

    def sub_list(customer=None, status=None, limit=None):
        return types.SimpleNamespace(data=[])

    def sub_create(**kw):
        calls["sub_create"].append(kw)
        invoice = types.SimpleNamespace(
            confirmation_secret=types.SimpleNamespace(client_secret="cs_secret_123"),
            payment_intent=None,
        )
        return types.SimpleNamespace(id="sub_test1", latest_invoice=invoice, pending_setup_intent=None)

    fake_stripe = types.SimpleNamespace(
        Customer=types.SimpleNamespace(create=customer_create),
        Subscription=types.SimpleNamespace(list=sub_list, create=sub_create),
    )
    monkeypatch.setattr(main, "stripe", fake_stripe)
    monkeypatch.setattr("database.get_user_by_id", lambda user_id: user_row)

    def fake_update_user_subscription(**kw):
        calls["sub_update"].append(kw)
        return kw

    monkeypatch.setattr("database.update_user_subscription", fake_update_user_subscription)
    return calls


@pytest.fixture
def client():
    return TestClient(main.app)


def _body(**extra):
    return {"plan": "growth", "billing_period": "monthly", **extra}


def test_no_token_rejected(client, monkeypatch):
    # Real _get_user_id_from_token, no Authorization header.
    calls = _wire(monkeypatch)
    r = client.post("/api/billing/create-checkout", json=_body())
    assert r.status_code == 401
    assert calls["customer_create"] == [] and calls["sub_update"] == []


def test_valid_token_creates_session_for_caller(client, monkeypatch):
    _login(monkeypatch)
    calls = _wire(monkeypatch, user_row={"id": CALLER})  # no stripe_customer_id yet
    r = client.post("/api/billing/create-checkout", json=_body())
    assert r.status_code == 200
    assert r.json() == {"clientSecret": "cs_secret_123", "subscriptionId": "sub_test1"}

    # The Stripe customer and subscription metadata carry the caller's identity.
    assert calls["customer_create"] == [
        {"email": CALLER_EMAIL, "metadata": {"user_id": CALLER}}
    ]
    assert calls["sub_create"][0]["metadata"]["user_id"] == CALLER
    assert calls["sub_create"][0]["items"] == [{"price": main.PLAN_PRICE_MAP["growth_monthly"]}]

    # Both DB writes (customer creation, pending-checkout marker) hit the caller's row.
    assert [u["user_id"] for u in calls["sub_update"]] == [CALLER, CALLER]
    assert calls["sub_update"][1]["status"] == "inactive"
    assert calls["sub_update"][1]["subscription_id"] == "sub_test1"


def test_body_user_id_is_ignored(client, monkeypatch):
    # The old attack: post someone else's user_id. The field no longer exists
    # on the model, so it must never reach Stripe or the DB.
    _login(monkeypatch)
    calls = _wire(monkeypatch, user_row={"id": CALLER})
    r = client.post(
        "/api/billing/create-checkout",
        json=_body(user_id=VICTIM, email="victim@example.com"),
    )
    assert r.status_code == 200
    everything = repr(calls)
    assert VICTIM not in everything and "victim@example.com" not in everything
    assert [u["user_id"] for u in calls["sub_update"]] == [CALLER, CALLER]


def test_existing_customer_is_reused(client, monkeypatch):
    _login(monkeypatch)
    calls = _wire(monkeypatch, user_row={"id": CALLER, "stripe_customer_id": "cus_existing"})
    r = client.post("/api/billing/create-checkout", json=_body())
    assert r.status_code == 200
    assert calls["customer_create"] == []  # no duplicate customer
    assert calls["sub_create"][0]["customer"] == "cus_existing"
    assert [u["user_id"] for u in calls["sub_update"]] == [CALLER]


def test_invalid_plan_rejected(client, monkeypatch):
    _login(monkeypatch)
    calls = _wire(monkeypatch, user_row={"id": CALLER})
    r = client.post("/api/billing/create-checkout", json=_body(plan="platinum"))
    assert r.status_code == 400
    assert calls["sub_update"] == []
