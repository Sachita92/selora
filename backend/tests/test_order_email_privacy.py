"""buyer_email must not leak from buyer-facing order routes (migration 019).

buyer_email is PII the buyer hands to ONE order. The rule:

  * GET /api/stores/{id}/orders/by-wallet/{wallet}  — buyer-facing, must NOT
    expose it. Anyone holding a wallet proof for the paying wallet reaches this;
    on a shared/rotated wallet that is not necessarily the person who typed the
    address. It builds an explicit field allowlist, so the column is excluded
    by construction.
  * GET /api/checkout/solana/verify/{reference}     — public (reference only),
    must NOT expose it. Returns a fixed status/order_id/signature dict.
  * GET /api/stores/{id}/orders                     — the seller's own orders,
    behind the ownership check. The seller MAY see it: they need it to serve
    the buyer.

These tests pin all three so a future ``select("*")`` passthrough on a
buyer-facing route fails loudly.
"""
import types

import pytest
from fastapi.testclient import TestClient

import main

OWNER = "owner-1"
STORE = "store-1"
WALLET = "BuyRk2mVpL9wQe5tZxC7nD4fG8hJ3aS6uMyEbNcPdWo"
REF = "RefKey11111111111111111111111111111111111111"
SECRET_EMAIL = "buyer-private@example.com"


class _FakeQuery:
    def __init__(self, db, table):
        self._db, self._table = db, table
        self._filters = []

    def select(self, *a, **kw): return self
    def order(self, *a, **kw): return self
    def limit(self, *a, **kw): return self
    def gte(self, *a, **kw): return self
    def in_(self, *a, **kw): return self

    def eq(self, col, val):
        self._filters.append((col, val))
        return self

    def execute(self):
        rows = list(self._db.rows.get(self._table, []))
        for col, val in self._filters:
            rows = [r for r in rows if r.get(col) == val]
        return types.SimpleNamespace(data=[dict(r) for r in rows])


class _FakeDb:
    def __init__(self):
        self.rows = {
            "selora_orders": [{
                "id": "order-1", "store_id": STORE, "reference": REF, "status": "paid",
                "total_usd": 25.0, "buyer_wallet": WALLET, "buyer_email": SECRET_EMAIL,
                "signature": "sig-1", "created_at": "2026-08-24T10:00:00+00:00",
                "items": [{"product_id": "p1", "quantity": 1, "price": 25.0}],
            }],
            "selora_stores": [{"id": STORE, "user_id": OWNER, "name": "Woven Cloth",
                               "handle": "wovencloth"}],
            "selora_products": [{"id": "p1", "title": "Linen Scarf", "images": []}],
        }

    def table(self, name):
        return _FakeQuery(self, name)

    def rpc(self, fn, params):
        return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=1))


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.fixture
def db(monkeypatch):
    fake = _FakeDb()
    monkeypatch.setattr("database.supabase_admin", lambda: fake)
    return fake


# ── buyer-facing: must not leak ───────────────────────────────────────────────

def test_by_wallet_lookup_omits_buyer_email(client, db, monkeypatch):
    monkeypatch.setattr(main, "_verify_wallet_proof", lambda token, wallet: True)
    r = client.get(f"/api/stores/{STORE}/orders/by-wallet/{WALLET}",
                   headers={"X-Wallet-Proof": "valid"})
    assert r.status_code == 200
    orders = r.json()["orders"]
    assert len(orders) == 1
    assert "buyer_email" not in orders[0]
    assert SECRET_EMAIL not in r.text


def test_verify_response_omits_buyer_email(client, db, monkeypatch):
    # Already-paid short circuit: returns status + order_id only.
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200
    assert r.json() == {"status": "confirmed", "order_id": "order-1"}
    assert SECRET_EMAIL not in r.text


def test_public_store_payload_has_no_orders(client, db):
    # The storefront's public read returns store + products; orders (and so
    # buyer_email) are not part of it at all.
    db.rows["selora_stores"][0]["is_public"] = True
    r = client.get("/selora-stores/public/wovencloth")
    assert r.status_code == 200
    assert "orders" not in r.json()
    assert SECRET_EMAIL not in r.text


# ── seller-facing: allowed ────────────────────────────────────────────────────

def test_owner_orders_list_includes_buyer_email(client, db, monkeypatch):
    # The seller needs the buyer's email to serve the order; this route is
    # behind the ownership check.
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: (OWNER, "o@example.com"))
    monkeypatch.setattr("database.get_store_by_id", lambda sid: {"id": STORE, "user_id": OWNER})
    r = client.get(f"/api/stores/{STORE}/orders")
    assert r.status_code == 200
    assert r.json()["orders"][0]["buyer_email"] == SECRET_EMAIL


def test_non_owner_gets_no_orders_and_no_email(client, db, monkeypatch):
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: ("intruder", "i@evil.test"))
    monkeypatch.setattr("database.get_store_by_id", lambda sid: {"id": STORE, "user_id": OWNER})
    r = client.get(f"/api/stores/{STORE}/orders")
    assert r.status_code == 200
    assert r.json() == {"orders": []}
    assert SECRET_EMAIL not in r.text
