"""Tests for the composable authz primitives in backend/authz.py.

Everything is exercised through a throwaway FastAPI app plus monkeypatching at
the two seams authz wraps:

  * ``main._get_user_id_from_token``  (token verification)
  * ``database.get_store_by_id``      (store resolution, both families)

No network, no real Supabase, no real tokens.
"""
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from authz import UserIdentity, get_current_user, require_store_owner


def make_app() -> FastAPI:
    app = FastAPI()

    @app.get("/me")
    def read_me(user: UserIdentity = Depends(get_current_user)):
        return {"user_id": user.user_id, "email": user.email}

    @app.get("/stores/{store_id}")
    def read_store(store: dict = Depends(require_store_owner)):
        return {
            "id": store["id"],
            "user_id": store["user_id"],
            "platform": store.get("platform"),
        }

    return app


@pytest.fixture
def app() -> FastAPI:
    return make_app()


@pytest.fixture
def client(app) -> TestClient:
    return TestClient(app)


# ── get_current_user ──────────────────────────────────────────────────────────

def test_valid_token_returns_identity(client, monkeypatch):
    monkeypatch.setattr(
        "main._get_user_id_from_token",
        lambda request: ("user-123", "owner@example.com"),
    )
    resp = client.get("/me", headers={"Authorization": "Bearer good-token"})
    assert resp.status_code == 200
    assert resp.json() == {"user_id": "user-123", "email": "owner@example.com"}


def test_missing_token_is_401(client):
    # No Authorization header — exercises the REAL verifier's no-network 401 path.
    resp = client.get("/me")
    assert resp.status_code == 401


def test_malformed_token_is_401(client, monkeypatch):
    # A present-but-invalid bearer token. Stub the anon client so the REAL
    # verifier runs its error-mapping path without touching the network.
    class AuthApiError(Exception):
        pass

    class _FakeAuth:
        def get_user(self, token):
            raise AuthApiError("invalid JWT")

    class _FakeClient:
        auth = _FakeAuth()

    monkeypatch.setattr("database.get_anon_client", lambda: _FakeClient())
    resp = client.get("/me", headers={"Authorization": "Bearer garbage"})
    assert resp.status_code == 401


# ── require_store_owner ───────────────────────────────────────────────────────

def _override_user(app, user_id="owner-A"):
    app.dependency_overrides[get_current_user] = lambda: UserIdentity(user_id, "a@example.com")


def test_owner_of_shopify_store_gets_row(app, client, monkeypatch):
    _override_user(app, "owner-A")
    monkeypatch.setattr(
        "database.get_store_by_id",
        lambda sid: {"id": sid, "user_id": "owner-A", "platform": "shopify"},
    )
    resp = client.get("/stores/store-shopify-1")
    assert resp.status_code == 200
    assert resp.json() == {
        "id": "store-shopify-1",
        "user_id": "owner-A",
        "platform": "shopify",
    }


def test_owner_of_selora_store_gets_row(app, client, monkeypatch):
    _override_user(app, "owner-A")
    monkeypatch.setattr(
        "database.get_store_by_id",
        lambda sid: {"id": sid, "user_id": "owner-A", "platform": "selora"},
    )
    resp = client.get("/stores/store-selora-1")
    assert resp.status_code == 200
    assert resp.json() == {
        "id": "store-selora-1",
        "user_id": "owner-A",
        "platform": "selora",
    }


def test_someone_elses_store_is_404_not_403(app, client, monkeypatch):
    _override_user(app, "owner-A")
    monkeypatch.setattr(
        "database.get_store_by_id",
        lambda sid: {"id": sid, "user_id": "owner-B", "platform": "selora"},
    )
    resp = client.get("/stores/not-mine")
    # 404, NOT 403 — the existence of another user's store must not be revealed.
    assert resp.status_code == 404


def test_nonexistent_store_is_404(app, client, monkeypatch):
    _override_user(app, "owner-A")
    monkeypatch.setattr("database.get_store_by_id", lambda sid: None)
    resp = client.get("/stores/ghost")
    assert resp.status_code == 404
