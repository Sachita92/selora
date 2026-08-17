"""Batch-2c: guest gate tests for POST /api/chat/{store_id}.

Verifies the fixed demo-store guard: the old guard raised inside a try whose
bare ``except Exception: pass`` swallowed the HTTPException, and a separate
fallback fabricated a store dict for guests when store resolution failed or
returned None. Both paths let a guest chat against any store_id. Now:

  * guest + demo store            -> 200 (handler runs, no token required)
  * guest + another user's store  -> 404 — matches require_store_owner's
    "existence is never leaked" contract (was an unreachable 503)
  * guest + unresolvable store id -> 404 — the fabricated-store fallback is
    gone; resolution failure rejects like any missing store
  * authed owner + own store      -> 200 (unchanged)
  * authed user + foreign store   -> 403 (unchanged pre-existing behavior of
    this handler's inline ownership check)

The demo lookup goes through database.get_demo_store_ids(), which returns []
when the lookup itself fails — a Supabase outage now fails CLOSED (guest chat
blocked) instead of open.

Hermetic: Groq is replaced with a stub that returns one plain text completion,
supabase_admin with a chainable stub returning empty results, and chat
persistence with a no-op. No network, no real tokens.
"""
import types

import pytest
from fastapi.testclient import TestClient

import main

OWNER = "user-A"
OTHER = "user-B"
AUTH = {"Authorization": "Bearer good-token"}


class _FakeSupabase:
    """Chainable stand-in for the supabase client: any method in a query chain
    returns the same object; execute() yields an empty result."""

    def __getattr__(self, name):
        if name == "execute":
            return lambda *a, **kw: types.SimpleNamespace(data=[], count=0)
        return lambda *a, **kw: self


class _FakeGroq:
    """Groq client stub: one text completion, no tool calls."""

    def __init__(self, api_key=None):
        message = types.SimpleNamespace(tool_calls=None, content="Hello!")
        response = types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])
        self.chat = types.SimpleNamespace(
            completions=types.SimpleNamespace(create=lambda **kw: response)
        )


@pytest.fixture
def hermetic(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setattr("groq.Groq", _FakeGroq)
    monkeypatch.setattr("database.supabase_admin", lambda: _FakeSupabase())
    monkeypatch.setattr("database.save_chat_message", lambda **kw: None)
    # Fresh in-memory guest limits so runs don't bleed into each other
    monkeypatch.setattr(main, "_guest_chat_ip_limits", {})
    monkeypatch.setattr(main, "_guest_session_counts", {})


@pytest.fixture
def client():
    return TestClient(main.app)


def _store(store_id="store-1", owner=OWNER):
    return {"id": store_id, "user_id": owner, "shop_name": "Test Store", "platform": "selora"}


def _as_user(monkeypatch, user_id=OWNER):
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: (user_id, "a@example.com"))


def _store_is(monkeypatch, store):
    monkeypatch.setattr("database.get_store_by_id", lambda sid: store)


def _demo_ids(monkeypatch, ids):
    monkeypatch.setattr("database.get_demo_store_ids", lambda: ids)


def _guest_body(session_id):
    return {"message": "hi there", "session_id": session_id, "is_guest": True}


def test_guest_demo_store_is_200(client, monkeypatch, hermetic):
    _store_is(monkeypatch, _store(store_id="demo-1", owner=OTHER))
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.post("/api/chat/demo-1", json=_guest_body("guest-sess-allowed"))
    assert r.status_code == 200
    assert r.json()["response"] == "Hello!"
    assert r.json()["actions"] == []


def test_guest_non_demo_store_is_404(client, monkeypatch, hermetic):
    # The exact exploit: is_guest=true with a real victim store id.
    _store_is(monkeypatch, _store(store_id="store-1", owner=OTHER))
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.post("/api/chat/store-1", json=_guest_body("guest-sess-victim"))
    assert r.status_code == 404


def test_guest_unresolvable_store_is_404(client, monkeypatch, hermetic):
    # The fabricated-store fallback is gone: an id that doesn't resolve is a
    # plain 404 for guests, same as for everyone else.
    _store_is(monkeypatch, None)
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.post("/api/chat/ghost", json=_guest_body("guest-sess-ghost"))
    assert r.status_code == 404


def test_authed_owner_is_200(client, monkeypatch, hermetic):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.post(
        "/api/chat/store-1",
        json={"message": "hi", "session_id": "owner-sess", "is_guest": False},
        headers=AUTH,
    )
    assert r.status_code == 200
    assert r.json()["response"] == "Hello!"


def test_authed_non_owner_is_403(client, monkeypatch, hermetic):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    _demo_ids(monkeypatch, ["demo-1"])
    r = client.post(
        "/api/chat/store-1",
        json={"message": "hi", "session_id": "intruder-sess", "is_guest": False},
        headers=AUTH,
    )
    assert r.status_code == 403
