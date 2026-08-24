"""Tests for the atomic, idempotent checkout confirm (migration 017).

verify_solana_checkout used to mark paid + decrement inventory (non-atomic
read-then-write) + insert purchase events as one unguarded block, so two
concurrent polls for the same reference could double-decrement and double-insert.
Now the confirm calls one SQL function, claim_and_fulfill_order, that in a single
transaction claims the order pending->paid (only one winner), and only the winner
decrements (single statement, floored at zero) and inserts one event per item.

These tests fake the function with an in-memory store whose rpc() reproduces its
semantics behind a threading.Lock — the same modelling approach as
test_rate_limit / test_order_wallet_auth. httpx is faked so the on-chain check
confirms. No network.
"""
import threading
import types
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

import main

MERCHANT = "MerchQx7hFyBzk3vN2mWpRt5uJdA8cE4gK6sYbTnUvXi"
MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
REF = "RefKey11111111111111111111111111111111111111"
STORE = "store-1"
PROD = "prod-1"


# ── fake Supabase: order/product store + atomic claim_and_fulfill_order rpc ────

class _FakeQuery:
    def __init__(self, db, table):
        self._db, self._table, self._op = db, table, "select"

    def select(self, *a, **kw): self._op = "select"; return self
    def eq(self, *a, **kw): return self
    def execute(self):
        rows = self._db.rows.get(self._table, [])
        # Orders are returned as SNAPSHOTS (copies) so a concurrent caller can
        # still observe 'pending' at fetch time, exactly like a DB snapshot —
        # the atomic claim in rpc() is what actually serializes them.
        if self._table == "selora_orders":
            return types.SimpleNamespace(data=[dict(r) for r in rows])
        return types.SimpleNamespace(data=rows)


class _FakeDb:
    def __init__(self, order, products):
        self.rows = {
            "selora_orders": [order],
            "selora_stores": [{"id": STORE, "user_id": "u1", "payout_wallet_address": MERCHANT}],
        }
        self.products = products          # {product_id: {"inventory": int}}
        self.events = []                  # purchase events inserted by rpc
        self.claims = []                  # order ids successfully claimed
        self.lock = threading.Lock()

    def table(self, name):
        return _FakeQuery(self, name)

    def rpc(self, fn, params):
        assert fn == "claim_and_fulfill_order"
        oid, sig = params["p_order_id"], params["p_signature"]

        def execute():
            with self.lock:  # models the single-transaction / row-lock atomicity
                order = next((o for o in self.rows["selora_orders"] if o["id"] == oid), None)
                if order is None or order["status"] != "pending":
                    return types.SimpleNamespace(data=[{"claimed": False, "oversold": []}])
                order["status"] = "paid"
                order["signature"] = sig
                # Migration 018: claim winner writes the fee payer as
                # buyer_wallet (COALESCE keeps the old value when null).
                if params.get("p_buyer_wallet"):
                    order["buyer_wallet"] = params["p_buyer_wallet"]
                self.claims.append(oid)
                oversold = []
                for item in order.get("items", []):
                    pid, qty = item["product_id"], item.get("quantity", 1)
                    prod = self.products.get(pid)
                    if prod is None:
                        continue
                    before = prod["inventory"]
                    prod["inventory"] = max(before - qty, 0)   # floored decrement
                    if before < qty:
                        oversold.append({"product_id": pid, "requested": qty, "available": before})
                    self.events.append({"store_id": order["store_id"], "product_id": pid,
                                        "event_type": "purchase"})
                if oversold:
                    order["oversold_items"] = oversold
                return types.SimpleNamespace(data=[{"claimed": True, "oversold": oversold}])

        return types.SimpleNamespace(execute=execute)


def _tx(post):
    """A getTransaction result crediting the merchant `post` USDC (pre 0)."""
    return {
        "transaction": {"message": {"accountKeys": ["buyer", MERCHANT, MINT, REF]}},
        "meta": {
            "err": None,
            "preTokenBalances": [{"accountIndex": 3, "mint": MINT, "owner": MERCHANT,
                                  "uiTokenAmount": {"uiAmount": 0.0}}],
            "postTokenBalances": [{"accountIndex": 3, "mint": MINT, "owner": MERCHANT,
                                   "uiTokenAmount": {"uiAmount": post}}],
        },
    }


class _FakeHttpx:
    def __init__(self, tx_result): self._tx = tx_result
    def post(self, url, json=None, headers=None):
        if json.get("method") == "getSignaturesForAddress":
            body = {"jsonrpc": "2.0", "result": [{"signature": "sig-1"}]}
        else:
            body = {"jsonrpc": "2.0", "result": self._tx}
        return types.SimpleNamespace(status_code=200, json=lambda: body)


def _order(status="pending", items=None, total=25.0):
    return {"id": "order-1", "store_id": STORE, "reference": REF, "status": status,
            "total_usd": total, "buyer_wallet": "buyer", "items": items if items is not None else []}


def _wire(monkeypatch, order, products, post=25.0):
    db = _FakeDb(order, products)
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    monkeypatch.setattr("httpx.Client", lambda **kw: _FakeHttpx(_tx(post)))
    monkeypatch.setenv("USDC_MINT", MINT)
    monkeypatch.setenv("SOLANA_RPC_URL", "http://rpc.test")
    monkeypatch.delenv("SOLANA_ALLOW_SELF_TRANSFER_CONFIRM", raising=False)
    return db


@pytest.fixture
def client():
    return TestClient(main.app)


# ── happy path: one claim, one decrement, one event set ───────────────────────

def test_valid_verify_confirms_and_fulfills_once(client, monkeypatch):
    db = _wire(monkeypatch, _order(items=[{"product_id": PROD, "quantity": 2}]),
               {PROD: {"inventory": 10}})
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200
    assert r.json()["status"] == "confirmed"
    assert r.json()["signature"] == "sig-1"
    assert db.claims == ["order-1"]
    assert db.products[PROD]["inventory"] == 8          # decremented exactly once
    assert len(db.events) == 1


# ── concurrency: exactly one claim / decrement / event set ────────────────────

def test_two_concurrent_verifies_claim_once(client, monkeypatch):
    db = _wire(monkeypatch, _order(items=[{"product_id": PROD, "quantity": 1}]),
               {PROD: {"inventory": 5}})
    with ThreadPoolExecutor(max_workers=5) as ex:
        results = list(ex.map(lambda _: client.get(f"/api/checkout/solana/verify/{REF}"), range(5)))
    assert all(r.status_code == 200 and r.json()["status"] == "confirmed" for r in results)
    assert len(db.claims) == 1              # only one caller transitioned pending->paid
    assert db.products[PROD]["inventory"] == 4   # decremented once, not five times
    assert len(db.events) == 1              # one purchase event, not five


# ── inventory floors at zero, oversell recorded ───────────────────────────────

def test_inventory_floors_at_zero_and_records_oversell(client, monkeypatch):
    order = _order(items=[{"product_id": PROD, "quantity": 5}])
    db = _wire(monkeypatch, order, {PROD: {"inventory": 2}})
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200 and r.json()["status"] == "confirmed"
    assert db.products[PROD]["inventory"] == 0          # floored, not -3
    # Oversell surfaced on the order for the seller.
    stored = db.rows["selora_orders"][0]
    assert stored["oversold_items"] == [{"product_id": PROD, "requested": 5, "available": 2}]


# ── idempotency: an already-paid order re-runs no work ────────────────────────

def test_already_paid_returns_confirmed_without_rerunning(client, monkeypatch):
    db = _wire(monkeypatch, _order(status="paid", items=[{"product_id": PROD, "quantity": 2}]),
               {PROD: {"inventory": 7}})
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200
    assert r.json()["status"] == "confirmed"
    assert db.claims == []                  # no claim
    assert db.products[PROD]["inventory"] == 7   # untouched
    assert db.events == []                   # no duplicate events
