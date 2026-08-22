"""Tests for the Shopify OAuth install flow — the verified-identity binding.

The old flow bound the store to whatever ?email= arrived on the
unauthenticated GET /install: a crafted install link could attach a victim's
shop to an attacker's Selora account, or the attacker's shop to a victim's
account. Now /install requires a verified Supabase JWT and records
{user_id, email, shop, issued_at} server-side, keyed by the random state
token; the callback binds the store to that user_id and nothing else. State
is single-use, expires after OAUTH_STATE_TTL_SECONDS, and must match the
shop it was issued for.

Hermetic: Shopify verification/exchange and the database layer are
monkeypatched, and _get_user_id_from_token is stubbed where a signed-in
caller is needed. No network.
"""
import time
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

import main

SHOP = "test-shop.myshopify.com"
USER_ID = "auth-uid-1"
EMAIL = "owner@example.com"


@pytest.fixture
def client():
    main._oauth_states.clear()
    yield TestClient(main.app)
    main._oauth_states.clear()


def _login(monkeypatch, user_id=USER_ID, email=EMAIL):
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (user_id, email))


def _wire_callback(monkeypatch, hmac_ok=True):
    """Make Shopify verification/exchange and the DB layer succeed, recording binds."""
    calls = {"save_store": [], "get_or_create": []}
    monkeypatch.setattr("auth.verify_hmac", lambda params, h: hmac_ok)
    monkeypatch.setattr("auth.exchange_code_for_token", lambda shop, code: "shpat-token")
    monkeypatch.setattr("auth.get_shop_info", lambda shop, tok: {"name": "Test Shop", "email": f"owner@{shop}"})

    def fake_get_or_create_user_by_auth(user_id, email):
        calls["get_or_create"].append((user_id, email))
        return {"id": user_id, "email": email}

    def fake_save_store(user_id, platform, shop_url, access_token, shop_name=None):
        calls["save_store"].append({"user_id": user_id, "shop_url": shop_url, "access_token": access_token})
        return {"id": "store-1"}

    monkeypatch.setattr("database.get_or_create_user_by_auth", fake_get_or_create_user_by_auth)
    monkeypatch.setattr("database.save_store", fake_save_store)
    return calls


def _install_state(client, monkeypatch, query=""):
    """Run /install as the signed-in test user; return the issued state token."""
    _login(monkeypatch)
    r = client.get(f"/install?shop={SHOP}{query}")
    assert r.status_code == 200
    url = r.json()["install_url"]
    assert url.startswith(f"https://{SHOP}/admin/oauth/authorize")
    return parse_qs(urlparse(url).query)["state"][0]


# ── install requires a verified identity ──────────────────────────────────────

def test_install_without_token_rejected(client):
    # Real _get_user_id_from_token, no Authorization header.
    r = client.get(f"/install?shop={SHOP}")
    assert r.status_code == 401
    assert main._oauth_states == {}


def test_install_binds_state_to_authenticated_user(client, monkeypatch):
    state = _install_state(client, monkeypatch)
    entry = main._oauth_states[state]
    assert entry["user_id"] == USER_ID
    assert entry["email"] == EMAIL
    assert entry["shop"] == SHOP


# ── the callback binds to the initiating user, never a supplied email ─────────

def test_full_flow_binds_store_to_initiating_user(client, monkeypatch):
    calls = _wire_callback(monkeypatch)
    # A crafted email param on /install is simply ignored — it no longer exists.
    state = _install_state(client, monkeypatch, query="&email=attacker%40evil.com")
    cb = client.get(
        f"/auth/callback?shop={SHOP}&code=abc&state={state}&hmac=sig",
        follow_redirects=False,
    )
    assert cb.status_code in (302, 307)
    assert calls["save_store"] == [
        {"user_id": USER_ID, "shop_url": SHOP, "access_token": "shpat-token"}
    ]
    assert calls["get_or_create"] == [(USER_ID, EMAIL)]
    assert state not in main._oauth_states  # single-use


def test_unknown_state_rejected(client, monkeypatch):
    calls = _wire_callback(monkeypatch)
    cb = client.get(
        f"/auth/callback?shop={SHOP}&code=abc&state=never-issued&hmac=sig",
        follow_redirects=False,
    )
    assert cb.status_code == 403
    assert calls["save_store"] == []


def test_replayed_state_rejected(client, monkeypatch):
    calls = _wire_callback(monkeypatch)
    state = _install_state(client, monkeypatch)
    url = f"/auth/callback?shop={SHOP}&code=abc&state={state}&hmac=sig"
    assert client.get(url, follow_redirects=False).status_code in (302, 307)
    assert client.get(url, follow_redirects=False).status_code == 403
    assert len(calls["save_store"]) == 1


def test_state_without_user_id_rejected(client, monkeypatch):
    # The old email-only state shape — a forged identity — must never bind.
    calls = _wire_callback(monkeypatch)
    main._oauth_states["legacy"] = {"shop": SHOP, "email": "attacker@evil.com"}
    cb = client.get(
        f"/auth/callback?shop={SHOP}&code=abc&state=legacy&hmac=sig",
        follow_redirects=False,
    )
    assert cb.status_code == 403
    assert calls["save_store"] == []


def test_expired_state_rejected(client, monkeypatch):
    calls = _wire_callback(monkeypatch)
    state = _install_state(client, monkeypatch)
    main._oauth_states[state]["issued_at"] = time.time() - main.OAUTH_STATE_TTL_SECONDS - 1
    cb = client.get(
        f"/auth/callback?shop={SHOP}&code=abc&state={state}&hmac=sig",
        follow_redirects=False,
    )
    assert cb.status_code == 403
    assert calls["save_store"] == []


def test_state_issued_for_other_shop_rejected(client, monkeypatch):
    calls = _wire_callback(monkeypatch)
    state = _install_state(client, monkeypatch)
    cb = client.get(
        f"/auth/callback?shop=other-shop.myshopify.com&code=abc&state={state}&hmac=sig",
        follow_redirects=False,
    )
    assert cb.status_code == 403
    assert calls["save_store"] == []


def test_failed_hmac_still_rejected(client, monkeypatch):
    calls = _wire_callback(monkeypatch, hmac_ok=False)
    state = _install_state(client, monkeypatch)
    cb = client.get(
        f"/auth/callback?shop={SHOP}&code=abc&state={state}&hmac=bad",
        follow_redirects=False,
    )
    assert cb.status_code == 403
    assert calls["save_store"] == []
