"""Batch-3 billing route authorization tests.

Verifies that the user-facing billing routes derive identity from the
verified token (get_current_user) instead of a client-supplied user_id/email:

  GET  /api/billing/subscriptions
  POST /api/billing/cancel-subscription
  GET  /api/billing/history

(POST /api/billing/portal was part of this batch originally but has since
been deleted: its frontend callers were removed in f4493c7 when the native
in-app subscription UI replaced the Stripe-hosted portal.)

Per route: no token -> 401, valid token acting on own resources -> allowed,
valid token acting on another user's customer/subscription -> rejected.
Cross-user rejection is 404 for cancel-subscription (existence is never
leaked, matching require_store_owner); for subscriptions/history the client
can no longer name a foreign resource at all, so the tests instead prove
that leftover email inputs are ignored. All Stripe and DB work is mocked;
the point is the authorization gate.

Seams mocked:
  * main._get_user_id_from_token          -> simulate a verified (or absent) caller
  * database.get_user_by_id               -> the caller's users row (stripe_customer_id link)
  * database.supabase_admin               -> billing_events query for history
  * main.stripe.*                         -> no real Stripe calls
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import main

OWNER = "user-A"
OWN_CUSTOMER = "cus_A"
OTHER_CUSTOMER = "cus_B"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture
def client():
    return TestClient(main.app)


def _as_user(monkeypatch, user_id=OWNER):
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: (user_id, "a@example.com"))


def _user_row_is(monkeypatch, row):
    monkeypatch.setattr("database.get_user_by_id", lambda uid: row)


def _own_row(customer_id=OWN_CUSTOMER):
    return {"id": OWNER, "email": "a@example.com", "stripe_customer_id": customer_id}


# ── GET /api/billing/subscriptions ────────────────────────────────────────────

def test_subscriptions_no_token_is_401(client):
    r = client.get("/api/billing/subscriptions?email=victim@example.com")
    assert r.status_code == 401


def test_subscriptions_no_customer_is_empty(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _user_row_is(monkeypatch, None)
    r = client.get("/api/billing/subscriptions", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"subscriptions": []}


def test_subscriptions_email_param_is_ignored(client, monkeypatch):
    # Stripe must be queried for the CALLER's customer even if a leftover
    # ?email= names someone else.
    _as_user(monkeypatch, OWNER)
    _user_row_is(monkeypatch, _own_row())
    listed = {}

    def fake_list(**kwargs):
        listed.update(kwargs)
        return SimpleNamespace(data=[])

    monkeypatch.setattr("main.stripe.Subscription.list", fake_list)
    r = client.get("/api/billing/subscriptions?email=victim@example.com", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"subscriptions": []}
    assert listed["customer"] == OWN_CUSTOMER


# ── POST /api/billing/cancel-subscription ─────────────────────────────────────

def test_cancel_no_token_is_401(client):
    r = client.post("/api/billing/cancel-subscription", json={"subscription_id": "sub_1"})
    assert r.status_code == 401


def test_cancel_own_subscription_succeeds(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _user_row_is(monkeypatch, _own_row())
    monkeypatch.setattr("main.stripe.Subscription.retrieve", lambda sid: {"id": sid, "customer": OWN_CUSTOMER})
    modified = {}

    def fake_modify(sid, **kwargs):
        modified["id"] = sid
        modified.update(kwargs)
        return {"id": sid, "cancel_at_period_end": True}

    monkeypatch.setattr("main.stripe.Subscription.modify", fake_modify)
    r = client.post("/api/billing/cancel-subscription", json={"subscription_id": "sub_1"}, headers=AUTH)
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert modified == {"id": "sub_1", "cancel_at_period_end": True}


def test_cancel_other_users_subscription_is_404(client, monkeypatch):
    # 404, not 403: a non-owner must not learn the subscription id exists.
    _as_user(monkeypatch, OWNER)
    _user_row_is(monkeypatch, _own_row())
    monkeypatch.setattr("main.stripe.Subscription.retrieve", lambda sid: {"id": sid, "customer": OTHER_CUSTOMER})

    def fail_modify(sid, **kwargs):
        raise AssertionError("modify must not be called for a foreign subscription")

    monkeypatch.setattr("main.stripe.Subscription.modify", fail_modify)
    r = client.post("/api/billing/cancel-subscription", json={"subscription_id": "sub_theirs"}, headers=AUTH)
    assert r.status_code == 404


def test_cancel_unknown_subscription_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _user_row_is(monkeypatch, _own_row())

    def fake_retrieve(sid):
        raise Exception("No such subscription")

    monkeypatch.setattr("main.stripe.Subscription.retrieve", fake_retrieve)
    r = client.post("/api/billing/cancel-subscription", json={"subscription_id": "sub_nope"}, headers=AUTH)
    assert r.status_code == 404


# ── GET /api/billing/history ──────────────────────────────────────────────────

class _FakeQuery:
    def __init__(self, rows, eq_calls):
        self._rows = rows
        self._eq_calls = eq_calls

    def select(self, *a, **k):
        return self

    def eq(self, col, val):
        self._eq_calls.append((col, val))
        return self

    def order(self, *a, **k):
        return self

    def execute(self):
        return SimpleNamespace(data=self._rows)


class _FakeClient:
    def __init__(self, rows, eq_calls):
        self._query = _FakeQuery(rows, eq_calls)

    def table(self, name):
        return self._query


def test_history_no_token_is_401(client):
    r = client.get("/api/billing/history?email=victim@example.com")
    assert r.status_code == 401


def test_history_is_keyed_to_token_identity(client, monkeypatch):
    # Rows come back filtered by the token's user_id; a leftover ?email=
    # naming someone else changes nothing.
    _as_user(monkeypatch, OWNER)
    eq_calls = []
    rows = [{"id": "evt-1", "user_id": OWNER, "event_type": "invoice_paid"}]
    monkeypatch.setattr("database.supabase_admin", lambda: _FakeClient(rows, eq_calls))
    r = client.get("/api/billing/history?email=victim@example.com", headers=AUTH)
    assert r.status_code == 200
    assert r.json()["history"] == rows
    assert eq_calls == [("user_id", OWNER)]
