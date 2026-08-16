"""Batch-1 route authorization tests.

Verifies that require_store_owner correctly gates the three (plus one sibling)
mutating store routes it was wired into:

  PUT    /api/stores/{store_id}/settings
  POST   /api/agent/run/{store_id}
  PUT    /api/chat/{store_id}/sessions/{session_id}
  DELETE /api/chat/{store_id}/sessions/{session_id}

Per route: no token -> 401, valid token + another user's store -> 404, valid
token + own store -> handler reached. All downstream work is mocked; the point
is the authorization gate, not that the underlying operation succeeds.

Seams mocked:
  * main._get_user_id_from_token   -> simulate a verified (or absent) caller
  * database.get_store_by_id       -> simulate store ownership
  * the handler's own DB/agent call -> no-op so nothing real runs
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


def _store(owner=OWNER, platform="selora"):
    return {"id": "store-1", "user_id": owner, "shop_name": "Test Store", "platform": platform}


def _as_user(monkeypatch, user_id=OWNER):
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: (user_id, "a@example.com"))


def _store_is(monkeypatch, store):
    monkeypatch.setattr("database.get_store_by_id", lambda sid: store)


# ── PUT /api/stores/{store_id}/settings ───────────────────────────────────────

def test_settings_no_token_is_401(client):
    r = client.put("/api/stores/store-1/settings", json={"auto_reprice": False})
    assert r.status_code == 401


def test_settings_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    r = client.put("/api/stores/store-1/settings", json={"auto_reprice": False}, headers=AUTH)
    assert r.status_code == 404


def test_settings_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    monkeypatch.setattr("database.save_store_settings", lambda sid, body: {"saved": True, **body})
    r = client.put("/api/stores/store-1/settings", json={"auto_reprice": False}, headers=AUTH)
    assert r.status_code == 200
    assert r.json()["settings"] == {"saved": True, "auto_reprice": False}


# ── POST /api/agent/run/{store_id} ────────────────────────────────────────────

def test_agent_run_no_token_is_401(client):
    r = client.post("/api/agent/run/store-1")
    assert r.status_code == 401


def test_agent_run_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    r = client.post("/api/agent/run/store-1", headers=AUTH)
    assert r.status_code == 404


def test_agent_run_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    # Default dry_run=True skips the billing branch; stub the background task.
    monkeypatch.setattr("main._run_agent_task", lambda store, dry_run: None)
    r = client.post("/api/agent/run/store-1", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["dry_run"] is True
    assert body["message"] == "Agent started for Test Store"


# ── PUT /api/chat/{store_id}/sessions/{session_id} ────────────────────────────

def test_chat_put_no_token_is_401(client):
    r = client.put("/api/chat/store-1/sessions/sess-1", json={"title": "Renamed"})
    assert r.status_code == 401


def test_chat_put_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    r = client.put("/api/chat/store-1/sessions/sess-1", json={"title": "Renamed"}, headers=AUTH)
    assert r.status_code == 404


def test_chat_put_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    monkeypatch.setattr("database.update_chat_session_metadata", lambda **kw: {"title": kw.get("title")})
    r = client.put("/api/chat/store-1/sessions/sess-1", json={"title": "Renamed"}, headers=AUTH)
    assert r.status_code == 200
    assert r.json()["success"] is True


# ── DELETE /api/chat/{store_id}/sessions/{session_id} ─────────────────────────

def test_chat_delete_no_token_is_401(client):
    r = client.delete("/api/chat/store-1/sessions/sess-1")
    assert r.status_code == 401


def test_chat_delete_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    r = client.delete("/api/chat/store-1/sessions/sess-1", headers=AUTH)
    assert r.status_code == 404


def test_chat_delete_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    monkeypatch.setattr("database.delete_chat_session", lambda sid, ssid: None)
    r = client.delete("/api/chat/store-1/sessions/sess-1", headers=AUTH)
    assert r.status_code == 200
    assert r.json()["success"] is True
