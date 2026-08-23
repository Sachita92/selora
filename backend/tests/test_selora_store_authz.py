"""Authorization tests for the 10 routes converted from inline ownership checks
to `Depends(require_store_owner)` (audit #2 §4).

Each of these routes previously hand-rolled `select('id,user_id')` on
selora_stores and returned **403** for a foreign store — leaking existence.
require_store_owner returns **404** for both missing and foreign stores, so the
existence leak is closed. Per route this asserts:

  * no token          -> 401 (get_current_user rejects before the handler)
  * another user's store -> 404 (NOT 403 — the leak this conversion fixes)
  * the owner            -> the handler runs (past the auth gate)

Hermetic: main._get_user_id_from_token and database.supabase_admin are stubbed;
get_store_by_id resolves through the fake. No network.
"""
import base64
import types

import pytest
from fastapi.testclient import TestClient

import main

STORE = "store-1"
OWNER = "owner-1"
OTHER = "intruder-9"

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
PNG_B64 = base64.b64encode(PNG).decode()

# (method, path, json body or None) — one row per converted route.
ROUTES = [
    ("GET",    f"/api/stores/{STORE}/health", None),
    ("PUT",    f"/selora-stores/{STORE}", {"name": "New Name"}),
    ("POST",   f"/selora-stores/{STORE}/products", {"title": "P", "price": 1.0, "inventory": 1}),
    ("GET",    f"/selora-stores/{STORE}/products", None),
    ("PUT",    f"/selora-stores/{STORE}/products/prod-1", {"title": "P2"}),
    ("DELETE", f"/selora-stores/{STORE}/products/prod-1", None),
    ("POST",   f"/selora-stores/{STORE}/upload-image", {"file_data": PNG_B64}),
    ("POST",   f"/selora-stores/{STORE}/upload-hero-image/main", {"file_data": PNG_B64}),
    ("POST",   f"/selora-stores/{STORE}/upload-product-image/prod-1", {"file_data": PNG_B64}),
    ("POST",   f"/selora-stores/{STORE}/upload-category-image/cat-1", {"file_data": PNG_B64}),
]
IDS = [f"{m} {p.split(STORE)[-1] or '/'}" for m, p, _ in ROUTES]


# ── fakes ─────────────────────────────────────────────────────────────────────

class _FakeQuery:
    def __init__(self, db, table):
        self._db = db
        self._table = table
        self._op = "select"
        self._payload = None

    def select(self, *a, **kw): self._op = "select"; return self
    def insert(self, payload): self._op = "insert"; self._payload = payload; return self
    def update(self, payload): self._op = "update"; self._payload = payload; return self
    def delete(self): self._op = "delete"; return self
    def eq(self, *a, **kw): return self
    def order(self, *a, **kw): return self

    def execute(self):
        if self._op in ("insert", "update"):
            row = self._payload if isinstance(self._payload, dict) else {}
            return types.SimpleNamespace(data=[row])
        if self._op == "delete":
            return types.SimpleNamespace(data=[])
        return types.SimpleNamespace(data=self._db.rows.get(self._table, []))


class _FakeBucket:
    def upload(self, *a, **kw): pass
    def remove(self, *a, **kw): pass


class _FakeDb:
    def __init__(self, rows):
        self.rows = rows
        self.storage = types.SimpleNamespace(from_=lambda bucket: _FakeBucket())

    def table(self, name): return _FakeQuery(self, name)

    def rpc(self, fn, params):
        # rate_limit_hit — always under the limit so the limiter allows.
        return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=1))


def _store_row(owner):
    # A full-ish selora_stores row, as get_store_by_id's normalization expects.
    return {"id": STORE, "user_id": owner, "handle": "myshop", "name": "My Shop",
            "is_public": True, "created_at": None}


def _fake_db_owned_by(owner):
    return _FakeDb({"selora_stores": [_store_row(owner)], "selora_products": []})


def _call(client, method, path, body):
    fn = getattr(client, method.lower())
    return fn(path) if body is None else fn(path, json=body)


# ── no token -> 401 ───────────────────────────────────────────────────────────

@pytest.mark.parametrize("method,path,body", ROUTES, ids=IDS)
def test_no_token_is_401(method, path, body):
    # Real _get_user_id_from_token, no Authorization header -> get_current_user 401,
    # before the handler body or any store lookup.
    client = TestClient(main.app)
    r = _call(client, method, path, body)
    assert r.status_code == 401


# ── another user's store -> 404, NOT 403 (the leak this closes) ───────────────

@pytest.mark.parametrize("method,path,body", ROUTES, ids=IDS)
def test_foreign_store_is_404_not_403(method, path, body, monkeypatch):
    # Caller is OTHER; the store belongs to OWNER -> require_store_owner 404.
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (OTHER, "i@evil.test"))
    monkeypatch.setattr("database.supabase_admin", lambda: _fake_db_owned_by(OWNER))
    client = TestClient(main.app)
    r = _call(client, method, path, body)
    assert r.status_code == 404
    assert r.status_code != 403  # existence is no longer leaked


# ── the owner -> handler runs (past the auth gate) ────────────────────────────

@pytest.mark.parametrize("method,path,body", ROUTES, ids=IDS)
def test_owner_reaches_handler(method, path, body, monkeypatch):
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (OWNER, "owner@example.com"))
    monkeypatch.setattr("database.supabase_admin", lambda: _fake_db_owned_by(OWNER))
    monkeypatch.setenv("SUPABASE_URL", "http://supa.test")
    client = TestClient(main.app)
    r = _call(client, method, path, body)
    # The auth gate opened: no 401/403/404. (Downstream success/validation is
    # the handler's own concern, covered by other suites.)
    assert r.status_code not in (401, 403, 404), f"{method} {path} -> {r.status_code}: {r.text[:200]}"


# ── a couple of clean 200s to prove the handler actually executes ─────────────

def test_owner_get_products_returns_200(monkeypatch):
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (OWNER, "o@example.com"))
    monkeypatch.setattr("database.supabase_admin", lambda: _fake_db_owned_by(OWNER))
    client = TestClient(main.app)
    r = client.get(f"/selora-stores/{STORE}/products")
    assert r.status_code == 200
    assert r.json() == {"products": []}


def test_owner_delete_product_returns_200(monkeypatch):
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (OWNER, "o@example.com"))
    monkeypatch.setattr("database.supabase_admin", lambda: _fake_db_owned_by(OWNER))
    client = TestClient(main.app)
    r = client.delete(f"/selora-stores/{STORE}/products/prod-1")
    assert r.status_code == 200
    assert r.json() == {"success": True}


def test_owner_upload_image_returns_200_with_url(monkeypatch):
    # Proves the rate limiter still gets a valid identity (store["user_id"])
    # and the upload handler runs end-to-end for the owner.
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (OWNER, "o@example.com"))
    monkeypatch.setattr("database.supabase_admin", lambda: _fake_db_owned_by(OWNER))
    monkeypatch.setenv("SUPABASE_URL", "http://supa.test")
    client = TestClient(main.app)
    r = client.post(f"/selora-stores/{STORE}/upload-image", json={"file_data": PNG_B64})
    assert r.status_code == 200
    assert r.json()["url"].startswith("http://supa.test/storage/v1/object/public/selora-products/")
