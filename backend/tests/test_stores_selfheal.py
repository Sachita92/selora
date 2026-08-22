"""Tests for GET /api/stores' self-healing Stripe re-sync.

Background: the heal branch re-read the healed row with `get_or_create_user(email)`,
but that name isn't imported in get_stores (the JWT-auth commit renamed the
import to get_or_create_user_by_auth and missed this second call). It raised
NameError, which the surrounding `except Exception` swallowed — so the DB heal
committed but the RESPONSE stayed one request stale, and the bug was invisible.

The fix captures the row update_user_subscription already returns
(`user = update_user_subscription(...) or user`) and narrows the except to
(stripe.StripeError, postgrest APIError, httpx.HTTPError) so a NameError-class
bug can't hide there again.

These cover:
  * heal branch: DB out of sync with Stripe -> response reflects the HEALED
    plan/status (the case that was silently failing)
  * non-heal path: DB already in sync -> expected shape, no heal write
  * update returns {} (no row matched) -> falls back to the existing row
  * the narrowed except still swallows a real Stripe API error (200, no crash)

Hermetic: main.stripe and the database seams are replaced with fakes. No network.
"""
import types

import pytest
from fastapi.testclient import TestClient

import main

USER_ID = "user-1"
EMAIL = "owner@example.com"
CUSTOMER = "cus_test1"
GROWTH_PRICE = main.PLAN_PRICE_MAP["growth_monthly"]


def _full_user_row(plan, status, period_end=None):
    """A complete users row, as select('*') / an UPDATE representation returns."""
    return {
        "id": USER_ID,
        "email": EMAIL,
        "stripe_customer_id": CUSTOMER,
        "subscription_plan": plan,
        "subscription_status": status,
        "subscription_current_period_end": period_end,
    }


class _FakeStripeSub:
    def __init__(self, d):
        self._d = d

    def to_dict(self):
        return self._d


def _active_growth_sub():
    return _FakeStripeSub({
        "id": "sub_test1",
        "status": "active",
        "items": {"data": [{
            "price": {"id": GROWTH_PRICE},
            "current_period_end": 1_800_000_000,
        }]},
    })


def _fake_stripe(subs_data):
    return types.SimpleNamespace(
        StripeError=main.stripe.StripeError,  # real base class for the except
        Subscription=types.SimpleNamespace(
            list=lambda **kw: types.SimpleNamespace(data=subs_data)
        ),
    )


class _EmptyTable:
    """selora_stores native-store lookup — always empty."""
    def select(self, *a, **kw): return self
    def eq(self, *a, **kw): return self
    def execute(self): return types.SimpleNamespace(data=[])


def _wire(monkeypatch, *, initial_user, subs_data, update_returns, capture):
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (USER_ID, EMAIL))
    monkeypatch.setattr("database.get_or_create_user_by_auth", lambda uid, em: initial_user)
    monkeypatch.setattr("database.get_stores_for_user", lambda uid: [])
    monkeypatch.setattr("database.supabase_admin",
                        lambda: types.SimpleNamespace(table=lambda name: _EmptyTable()))
    monkeypatch.setattr(main, "stripe", _fake_stripe(subs_data))

    def fake_update(**kwargs):
        capture["update_calls"].append(kwargs)
        if isinstance(update_returns, Exception):
            raise update_returns
        return update_returns

    monkeypatch.setattr("database.update_user_subscription", fake_update)


@pytest.fixture
def client():
    return TestClient(main.app)


# ── the case that was silently failing ────────────────────────────────────────

def test_heal_branch_response_reflects_healed_values(client, monkeypatch):
    capture = {"update_calls": []}
    # DB says free/inactive; Stripe says active growth -> out of sync -> heal.
    _wire(
        monkeypatch,
        initial_user=_full_user_row("free", "inactive"),
        subs_data=[_active_growth_sub()],
        update_returns=_full_user_row("growth", "active", period_end="2027-01-15T00:00:00+00:00"),
        capture=capture,
    )
    r = client.get("/api/stores", headers={"Authorization": "Bearer t"})
    assert r.status_code == 200
    body = r.json()
    # The heal write happened...
    assert len(capture["update_calls"]) == 1
    assert capture["update_calls"][0]["plan"] == "growth"
    assert capture["update_calls"][0]["status"] == "active"
    # ...AND the response reflects the freshly written row, not the pre-heal one.
    assert body["user"]["subscription_plan"] == "growth"
    assert body["user"]["subscription_status"] == "active"
    assert body["user"]["subscription_current_period_end"] == "2027-01-15T00:00:00+00:00"
    assert body["user"]["id"] == USER_ID
    assert body["user"]["email"] == EMAIL


# ── normal path: already in sync, no heal write ───────────────────────────────

def test_no_heal_when_already_in_sync(client, monkeypatch):
    capture = {"update_calls": []}
    _wire(
        monkeypatch,
        initial_user=_full_user_row("growth", "active"),
        subs_data=[_active_growth_sub()],
        update_returns=_full_user_row("growth", "active"),
        capture=capture,
    )
    r = client.get("/api/stores", headers={"Authorization": "Bearer t"})
    assert r.status_code == 200
    body = r.json()
    assert capture["update_calls"] == []  # heal branch not entered
    assert body["user"] == {
        "id": USER_ID,
        "email": EMAIL,
        "subscription_plan": "growth",
        "subscription_status": "active",
        "subscription_current_period_end": None,
    }
    assert body["stores"] == []


def test_no_customer_skips_heal_block(client, monkeypatch):
    capture = {"update_calls": []}
    row = _full_user_row("free", "inactive")
    row["stripe_customer_id"] = None
    _wire(
        monkeypatch,
        initial_user=row,
        subs_data=[_active_growth_sub()],
        update_returns=row,
        capture=capture,
    )
    r = client.get("/api/stores", headers={"Authorization": "Bearer t"})
    assert r.status_code == 200
    assert capture["update_calls"] == []
    assert r.json()["user"]["subscription_plan"] == "free"


# ── the {} fallback guard ─────────────────────────────────────────────────────

def test_empty_update_result_falls_back_to_existing_row(client, monkeypatch):
    capture = {"update_calls": []}
    _wire(
        monkeypatch,
        initial_user=_full_user_row("free", "inactive"),
        subs_data=[_active_growth_sub()],
        update_returns={},  # no row matched -> update_user_subscription returns {}
        capture=capture,
    )
    r = client.get("/api/stores", headers={"Authorization": "Bearer t"})
    assert r.status_code == 200  # `or user` guard prevents a KeyError on user["id"]
    body = r.json()
    assert len(capture["update_calls"]) == 1
    # Falls back to the pre-heal row rather than an empty dict.
    assert body["user"]["id"] == USER_ID
    assert body["user"]["email"] == EMAIL
    assert body["user"]["subscription_plan"] == "free"


# ── narrowed except still swallows legitimate Stripe/DB failures ──────────────

def test_stripe_api_error_is_swallowed(client, monkeypatch):
    capture = {"update_calls": []}
    _wire(
        monkeypatch,
        initial_user=_full_user_row("growth", "active"),
        subs_data=[],
        update_returns={},
        capture=capture,
    )
    # Make the Stripe list call raise a real StripeError.
    def boom(**kw):
        raise main.stripe.StripeError("stripe is down")
    monkeypatch.setattr(main.stripe.Subscription, "list", boom)

    r = client.get("/api/stores", headers={"Authorization": "Bearer t"})
    assert r.status_code == 200  # best-effort heal: Stripe failure is non-fatal
    assert r.json()["user"]["subscription_plan"] == "growth"


def test_db_write_error_is_swallowed(client, monkeypatch):
    import httpx
    capture = {"update_calls": []}
    _wire(
        monkeypatch,
        initial_user=_full_user_row("free", "inactive"),
        subs_data=[_active_growth_sub()],
        update_returns=httpx.ConnectError("supabase TLS timeout"),  # DB write blows up
        capture=capture,
    )
    r = client.get("/api/stores", headers={"Authorization": "Bearer t"})
    assert r.status_code == 200  # swallowed; response falls through with pre-heal row
    assert len(capture["update_calls"]) == 1
    assert r.json()["user"]["subscription_plan"] == "free"


# ── the narrowing itself: a bug-class error is NOT swallowed ──────────────────

def test_programming_error_surfaces_as_500(monkeypatch):
    # A KeyError (the same class as the original NameError) raised inside the
    # heal block must NOT be caught by the narrowed except — it should surface
    # as a 500 rather than hide. This is exactly what regressed before.
    capture = {"update_calls": []}
    _wire(
        monkeypatch,
        initial_user=_full_user_row("free", "inactive"),
        subs_data=[_active_growth_sub()],
        update_returns=KeyError("bug"),  # stand-in for a NameError-class bug
        capture=capture,
    )
    client = TestClient(main.app, raise_server_exceptions=False)
    r = client.get("/api/stores", headers={"Authorization": "Bearer t"})
    assert r.status_code == 500  # not swallowed by (StripeError, APIError, HTTPError)
