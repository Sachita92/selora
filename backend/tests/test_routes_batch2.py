"""Batch-2 route authorization tests.

Verifies that require_store_owner correctly gates the four leaking GET store
routes it was wired into:

  GET /api/stores/{store_id}/products
  GET /api/stores/{store_id}/logs
  GET /api/stores/{store_id}/reports
  GET /api/stores/{store_id}/settings

Deliberately NOT gated in this batch (the landing-page guest demo chat calls
them unauthenticated via ChatWidget -> loadHistory/loadSessions):

  GET /api/chat/{store_id}/history
  GET /api/chat/{store_id}/sessions

Per route: no token -> 401, valid token + another user's store -> 404, valid
token + own store -> handler reached. All downstream work is mocked; the point
is the authorization gate, not that the underlying operation succeeds.

Seams mocked:
  * main._get_user_id_from_token   -> simulate a verified (or absent) caller
  * database.get_store_by_id       -> simulate store ownership
  * the handler's own DB call      -> no-op so nothing real runs
"""
import time

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


# ── GET /api/stores/{store_id}/products ───────────────────────────────────────

def _cache_products(monkeypatch, data):
    monkeypatch.setitem(main._products_cache, "store-1", {"timestamp": time.time(), "data": data})


def test_products_no_token_is_401(client, monkeypatch):
    _cache_products(monkeypatch, {"products": [{"id": "p1"}]})
    r = client.get("/api/stores/store-1/products")
    assert r.status_code == 401


def test_products_other_users_store_is_404_even_when_cached(client, monkeypatch):
    # The cache used to be served before any store lookup; the gate must now
    # run first, so a warm cache still 404s for a non-owner.
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    _cache_products(monkeypatch, {"products": [{"id": "p1"}]})
    r = client.get("/api/stores/store-1/products", headers=AUTH)
    assert r.status_code == 404


def test_products_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    _cache_products(monkeypatch, {"products": [{"id": "p1", "title": "Widget"}]})
    r = client.get("/api/stores/store-1/products", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"products": [{"id": "p1", "title": "Widget"}]}


# ── GET /api/stores/{store_id}/logs ───────────────────────────────────────────

def test_logs_no_token_is_401(client):
    r = client.get("/api/stores/store-1/logs")
    assert r.status_code == 401


def test_logs_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    r = client.get("/api/stores/store-1/logs", headers=AUTH)
    assert r.status_code == 404


def test_logs_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    monkeypatch.setattr("database.get_recent_logs", lambda sid, limit=20: [{"action": "reprice"}])
    r = client.get("/api/stores/store-1/logs", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"logs": [{"action": "reprice"}]}


# ── GET /api/stores/{store_id}/reports ────────────────────────────────────────

def test_reports_no_token_is_401(client):
    r = client.get("/api/stores/store-1/reports")
    assert r.status_code == 401


def test_reports_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    r = client.get("/api/stores/store-1/reports", headers=AUTH)
    assert r.status_code == 404


def test_reports_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    monkeypatch.setattr("database.get_recent_reports", lambda sid, limit=7: [{"summary": "grew 5%"}])
    r = client.get("/api/stores/store-1/reports", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"reports": [{"summary": "grew 5%"}]}


# ── GET /api/stores/{store_id}/settings ───────────────────────────────────────

def test_settings_get_no_token_is_401(client):
    r = client.get("/api/stores/store-1/settings")
    assert r.status_code == 401


def test_settings_get_other_users_store_is_404(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OTHER))
    r = client.get("/api/stores/store-1/settings", headers=AUTH)
    assert r.status_code == 404


def test_settings_get_own_store_reaches_handler(client, monkeypatch):
    _as_user(monkeypatch, OWNER)
    _store_is(monkeypatch, _store(owner=OWNER))
    monkeypatch.setattr("database.get_store_settings", lambda sid: {"auto_reprice": True})
    r = client.get("/api/stores/store-1/settings", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"settings": {"auto_reprice": True}}
