"""Tests for the x402 chat store pin.

POST /api/x402/chat used to pass the body-supplied store_id straight to the
chat handler, so whoever paid $0.001 could run the agent against any store.
The endpoint is a devnet showcase and is now pinned to the public demo store
(database.get_demo_store_ids — the same lookup as every other demo allowance):

  * store_id of another store -> 403, chat never invoked
  * the demo store's id       -> proxied to chat as-is
  * the "demo" alias (default, and what /api/x402/demo-run sends) -> resolved
    to the pinned demo store id
  * no demo store resolvable  -> 503 (fails closed)

The handler is called directly rather than through TestClient: the x402
payment middleware wraps the route at import time when X402_PAY_TO_ADDRESS is
set and would demand a facilitator-verified payment header. The pin lives
entirely in the handler, below the middleware.
"""
import pytest
from fastapi import HTTPException

import main
from main import X402ChatRequest

DEMO_ID = "11111111-2222-3333-4444-555555555555"


@pytest.fixture
def chat_calls(monkeypatch):
    calls = []

    def _fake_chat(store_id, body, request):
        calls.append(store_id)
        return {"response": "ok", "actions": []}

    monkeypatch.setattr(main, "chat_with_agent", _fake_chat)
    monkeypatch.setattr("database.get_demo_store_ids", lambda: [DEMO_ID])
    return calls


def _body(store_id):
    return X402ChatRequest(message="hi", session_id="x402-sess", store_id=store_id, is_guest=True)


def test_non_demo_store_is_403(chat_calls):
    with pytest.raises(HTTPException) as exc:
        main.x402_chat(_body("some-other-store-uuid"), request=None)
    assert exc.value.status_code == 403
    assert chat_calls == []


def test_demo_store_id_reaches_chat(chat_calls):
    result = main.x402_chat(_body(DEMO_ID), request=None)
    assert result == {"response": "ok", "actions": []}
    assert chat_calls == [DEMO_ID]


def test_demo_alias_resolves_to_pinned_store(chat_calls):
    result = main.x402_chat(_body("demo"), request=None)
    assert result == {"response": "ok", "actions": []}
    assert chat_calls == [DEMO_ID]


def test_no_resolvable_demo_store_is_503(chat_calls, monkeypatch):
    monkeypatch.setattr("database.get_demo_store_ids", lambda: [])
    with pytest.raises(HTTPException) as exc:
        main.x402_chat(_body("demo"), request=None)
    assert exc.value.status_code == 503
    assert chat_calls == []
