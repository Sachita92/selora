"""Batch-2b route authorization tests: the demo-store allowance.

Verifies that require_store_owner_or_demo gates the two chat GET routes shared
with the landing-page guest demo chat:

  GET /api/chat/{store_id}/history
  GET /api/chat/{store_id}/sessions

Per route:
  * owner with valid token                -> 200 (handler reached)
  * other user's store with valid token   -> 404 (existence not leaked)
  * no token on a NON-demo store          -> 401 — a non-demo store falls
    through to the owner path, where token verification runs before store
    resolution, exactly like require_store_owner
  * no token on the demo store            -> 200 (guest allowance)

Seams mocked:
  * main._get_user_id_from_token   -> simulate a verified (or absent) caller
  * database.get_store_by_id       -> simulate store ownership
  * database.get_demo_store_ids    -> simulate the pinned demo store lookup
  * the handler's own DB call      -> no-op so nothing real runs
"""
import pytest
from fastapi.testclient import TestClient

import main

OWNER = "user-A"
OTHER = "user-B"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture
def client():
    return TestClient(main.app)


def _store(store_id="store-1", owner=OWNER):
    return {"id": store_id, "user_id": owner, "shop_name": "Test Store", "platform": "shopify"}


def _as_user(monkeypatch, user_id=OWNER):
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: (user_id, "a@example.com"))


def _store_is(monkeypatch, store):
    monkeypatch.setattr("database.get_store_by_id", lambda sid: store)


def _demo_ids(monkeypatch, ids):
    monkeypatch.setattr("database.get_demo_store_ids", lambda: ids)


# ── GET /api/chat/{store_id}/history ──────────────────────────────────────────

def test_history_owner_is_200(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    _demo_ids(monkeypatch, ["demo-1"])
    monkeypatch.setattr("database.get_chat_history", lambda sid, ssid: [{"role": "user", "content": "hi"}])
    r = client.get("/api/chat/store-1/history?session_id=sess-1", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"history": [{"role": "user", "content": "hi"}]}


def test_history_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.get("/api/chat/store-1/history?session_id=sess-1", headers=AUTH)
    assert r.status_code == 404


def test_history_no_token_non_demo_store_is_401(client, monkeypatch):
    # Non-demo store -> owner path -> token verified before store resolution.
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.get("/api/chat/store-1/history?session_id=sess-1")
    assert r.status_code == 401


def test_history_no_token_demo_store_is_200(client, monkeypatch):
    _store_is(monkeypatch, _store(store_id="demo-1", owner=OTHER))
    _demo_ids(monkeypatch, ["demo-1"])
    monkeypatch.setattr("database.get_chat_history", lambda sid, ssid: [])
    r = client.get("/api/chat/demo-1/history?session_id=guest-sess")
    assert r.status_code == 200
    assert r.json() == {"history": []}


# ── GET /api/chat/{store_id}/sessions ─────────────────────────────────────────

def test_sessions_owner_is_200(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    _demo_ids(monkeypatch, ["demo-1"])
    monkeypatch.setattr("database.get_chat_sessions", lambda sid: [{"session_id": "sess-1"}])
    r = client.get("/api/chat/store-1/sessions", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"sessions": [{"session_id": "sess-1"}]}


def test_sessions_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.get("/api/chat/store-1/sessions", headers=AUTH)
    assert r.status_code == 404


def test_sessions_no_token_non_demo_store_is_401(client, monkeypatch):
    # Non-demo store -> owner path -> token verified before store resolution.
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.get("/api/chat/store-1/sessions")
    assert r.status_code == 401


def test_sessions_no_token_demo_store_is_200(client, monkeypatch):
    _store_is(monkeypatch, _store(store_id="demo-1", owner=OTHER))
    _demo_ids(monkeypatch, ["demo-1"])
    monkeypatch.setattr("database.get_chat_sessions", lambda sid: [])
    r = client.get("/api/chat/demo-1/sessions")
    assert r.status_code == 200
    assert r.json() == {"sessions": []}
