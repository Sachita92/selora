"""Tests for pending-order expiry and checkout create dedup.

Two lifecycle gaps closed together (docs/checkout-audit.md §4): abandoned
pending orders lived forever, and a buyer who left checkout and returned got a
new order for the same cart while the old pending one never resolved.

Expiry lives in the reconciliation sweep (the seller dashboard's orders poll):
pendings older than PENDING_ORDER_TTL_MINUTES get ONE final verification
first — a payment that landed confirms through the atomic claim — and only a
verification that completed and found no qualifying payment (result carries
"unpaid") may flip the row to 'expired', through an UPDATE guarded with
status='pending' so a concurrent confirm can never be overwritten.

Dedup lives in POST /api/checkout/solana/create: the page presents the
reference of its earlier order (sessionStorage); the server reuses that order
only if it is the same store, still pending, within the TTL, and the exact
same cart at the exact same prices. Reuse is keyed on the presented reference
alone — never on cart shape — so distinct anonymous buyers with identical
carts always get distinct orders.

Hermetic, following the test_order_sweep pattern: supabase_admin is a
table-routing fake with real eq/gte/lt/in_/order/limit filtering plus
update/insert, rpc() serves rate_limit_hit and claim_and_fulfill_order, and
httpx serves canned per-reference chain responses. No network.
"""
import types
from datetime import datetime, timezone, timedelta

import pytest
from fastapi.testclient import TestClient

import main

OWNER = "owner-1"
STORE = "store-1"
MERCHANT = "MerchQx7hFyBzk3vN2mWpRt5uJdA8cE4gK6sYbTnUvXi"
PAYER = "PhonePayerWk2mVpL9wQe5tZxC7nD4fG8hJ3aS6uMyEb"
MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
REF = "RefPrior111111111111111111111111111111111111"
ORDER_ID = "11111111-2222-3333-4444-555555555555"


# ── fakes ─────────────────────────────────────────────────────────────────────

class _FakeQuery:
    def __init__(self, db, table):
        self._db, self._table = db, table
        self._filters = []
        self._order_col, self._desc = None, False
        self._limit = None
        self._op, self._payload = "select", None

    def select(self, *a, **kw):
        return self

    def update(self, payload):
        self._op, self._payload = "update", payload
        return self

    def insert(self, payload):
        self._op, self._payload = "insert", payload
        return self

    def eq(self, col, val):
        self._filters.append(("eq", col, val))
        return self

    def gte(self, col, val):
        self._filters.append(("gte", col, val))
        return self

    def lt(self, col, val):
        self._filters.append(("lt", col, val))
        return self

    def in_(self, col, vals):
        self._filters.append(("in", col, list(vals)))
        return self

    def order(self, col, desc=False):
        self._order_col, self._desc = col, desc
        return self

    def limit(self, n):
        self._limit = n
        return self

    def execute(self):
        if self._op == "insert":
            row = dict(self._payload)
            row.setdefault("id", f"order-new-{len(self._db.rows[self._table]) + 1}")
            row.setdefault("created_at", datetime.now(timezone.utc).isoformat())
            self._db.rows[self._table].append(row)
            return types.SimpleNamespace(data=[dict(row)])
        rows = list(self._db.rows.get(self._table, []))
        for op, col, val in self._filters:
            if op == "eq":
                rows = [r for r in rows if r.get(col) == val]
            elif op == "gte":
                rows = [r for r in rows if r.get(col) is not None and r.get(col) >= val]
            elif op == "lt":
                rows = [r for r in rows if r.get(col) is not None and r.get(col) < val]
            else:  # in
                rows = [r for r in rows if r.get(col) in val]
        if self._order_col:
            rows = sorted(rows, key=lambda r: r.get(self._order_col) or "", reverse=self._desc)
        if self._limit is not None:
            rows = rows[: self._limit]
        if self._op == "update":
            for r in rows:   # references into db.rows — mutates canonical rows
                r.update(self._payload)
        return types.SimpleNamespace(data=[dict(r) for r in rows])


class _FakeDb:
    def __init__(self, orders, products=None):
        self.rows = {
            "selora_orders": orders,
            "selora_stores": [{"id": STORE, "user_id": OWNER, "name": "Woven Cloth",
                               "payout_wallet_address": MERCHANT}],
            "selora_products": products or [],
        }
        self.counters = {}   # rate_limit_hit: key -> count
        self.claims = []     # order ids claimed, in order

    def table(self, name):
        return _FakeQuery(self, name)

    def rpc(self, fn, params):
        db = self

        def execute():
            if fn == "rate_limit_hit":
                key = params["p_key"]
                db.counters[key] = db.counters.get(key, 0) + 1
                return types.SimpleNamespace(data=db.counters[key])
            assert fn == "claim_and_fulfill_order"
            oid = params["p_order_id"]
            order = next((o for o in db.rows["selora_orders"] if o["id"] == oid), None)
            if order is None or order["status"] != "pending":
                return types.SimpleNamespace(data=[{"claimed": False, "oversold": []}])
            order["status"] = "paid"
            order["signature"] = params["p_signature"]
            if params.get("p_buyer_wallet"):
                order["buyer_wallet"] = params["p_buyer_wallet"]
            db.claims.append(oid)
            return types.SimpleNamespace(data=[{"claimed": True, "oversold": []}])

        return types.SimpleNamespace(execute=execute)


class _FakeChain:
    """httpx.Client stand-in: references in paid_refs have a confirmed
    full-amount USDC transfer; every other reference has no transaction."""

    def __init__(self, paid_refs, amount=42.5):
        self._paid = paid_refs
        self._amount = amount

    def post(self, url, json=None, headers=None):
        if json.get("method") == "getSignaturesForAddress":
            ref = json["params"][0]
            sigs = [{"signature": f"sig-{ref}"}] if ref in self._paid else []
            body = {"jsonrpc": "2.0", "result": sigs}
        else:  # getTransaction
            ref = json["params"][0][len("sig-"):]
            fee_payer = self._paid[ref]
            body = {"jsonrpc": "2.0", "result": {
                "transaction": {"message": {"accountKeys": [fee_payer, MERCHANT, MINT, ref]}},
                "meta": {
                    "err": None,
                    "preTokenBalances": [{"accountIndex": 3, "mint": MINT, "owner": MERCHANT,
                                          "uiTokenAmount": {"uiAmount": 0.0}}],
                    "postTokenBalances": [{"accountIndex": 3, "mint": MINT, "owner": MERCHANT,
                                           "uiTokenAmount": {"uiAmount": self._amount}}],
                },
            }}
        return types.SimpleNamespace(status_code=200, json=lambda: body)


class _DownChain:
    """Chain RPC that always fails — verification can never complete."""

    def post(self, url, json=None, headers=None):
        return types.SimpleNamespace(status_code=500, json=lambda: {})


PRODUCT = {"id": "p1", "title": "Linen Scarf", "price": 21.25}


def _mk_order(minutes_ago, status="pending", reference=REF, order_id=ORDER_ID,
              items=None, total=42.5):
    created = (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).isoformat()
    if items is None:
        items = [{"product_id": "p1", "title": "Linen Scarf", "price": 21.25, "quantity": 2}]
    return {"id": order_id, "store_id": STORE, "reference": reference,
            "status": status, "total_usd": total, "buyer_wallet": None,
            "items": items, "created_at": created, "signature": None}


def _wire(monkeypatch, orders, paid_refs=None, chain=None):
    db = _FakeDb(orders, products=[dict(PRODUCT)])
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: (OWNER, "o@example.com"))
    monkeypatch.setattr("database.get_store_by_id", lambda sid: {"id": STORE, "user_id": OWNER})
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    monkeypatch.setattr("httpx.Client", lambda **kw: chain or _FakeChain(paid_refs or {}))
    monkeypatch.setenv("USDC_MINT", MINT)
    monkeypatch.setenv("SOLANA_RPC_URL", "http://rpc.test")
    monkeypatch.delenv("SOLANA_ALLOW_SELF_TRANSFER_CONFIRM", raising=False)
    return db


@pytest.fixture
def client():
    return TestClient(main.app)


def _poll(client):
    """Seller dashboard orders poll — schedules the sweep as a background task,
    which TestClient runs before returning."""
    return client.get(f"/api/stores/{STORE}/orders")


def _create(client, prior_reference=None, cart=None):
    return client.post("/api/checkout/solana/create", json={
        "store_id": STORE,
        "buyer_wallet": None,
        "cart": cart or [{"product_id": "p1", "quantity": 2}],
        "prior_reference": prior_reference,
    })


# ── expiry: stale unpaid pendings expire, paid ones confirm ───────────────────

def test_stale_unpaid_pending_expires(client, monkeypatch):
    order = _mk_order(minutes_ago=60)
    db = _wire(monkeypatch, [order], paid_refs={})   # nothing on chain
    r = _poll(client)
    assert r.status_code == 200
    assert db.rows["selora_orders"][0]["status"] == "expired"
    assert db.claims == []


def test_stale_pending_with_payment_confirms_never_expires(client, monkeypatch):
    # The buyer vanished but the QR payment landed on chain: the final
    # verification must claim the order paid; expiry must not touch it.
    order = _mk_order(minutes_ago=60)
    db = _wire(monkeypatch, [order], paid_refs={REF: PAYER})
    _poll(client)
    row = db.rows["selora_orders"][0]
    assert row["status"] == "paid"
    assert row["signature"] == f"sig-{REF}"
    assert db.claims == [ORDER_ID]


def test_fresh_unpaid_pending_is_not_expired(client, monkeypatch):
    order = _mk_order(minutes_ago=5)
    db = _wire(monkeypatch, [order], paid_refs={})
    _poll(client)
    assert db.rows["selora_orders"][0]["status"] == "pending"


def test_rpc_failure_never_expires(client, monkeypatch):
    # The verification did not COMPLETE (chain RPC down), so the stale pending
    # must survive to be re-checked by a later sweep — a paid order behind a
    # flaky RPC must never be expired on a failed check.
    order = _mk_order(minutes_ago=60)
    db = _wire(monkeypatch, [order], chain=_DownChain())
    _poll(client)
    assert db.rows["selora_orders"][0]["status"] == "pending"


# ── verify on an expired reference: terminal, page shows EXPIRED ──────────────

def test_verify_on_expired_reference_returns_expired(client, monkeypatch):
    order = _mk_order(minutes_ago=60, status="expired")
    _wire(monkeypatch, [order], paid_refs={})
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200
    assert r.json() == {"status": "expired", "order_id": ORDER_ID}


# ── dedup: create resumes the presented pending order ─────────────────────────

def test_duplicate_create_within_ttl_returns_same_order(client, monkeypatch):
    order = _mk_order(minutes_ago=5)
    db = _wire(monkeypatch, [order])
    r = _create(client, prior_reference=REF)
    assert r.status_code == 200
    data = r.json()
    assert data["reused"] is True
    assert data["order_id"] == ORDER_ID
    assert data["reference"] == REF
    assert data["recipient"] == MERCHANT
    assert data["amount_usdc"] == 42.5
    assert data["spl_token_mint"] == MINT
    assert data["memo"] == f"Order {ORDER_ID[:8]} on Woven Cloth"
    # No new row: the page resumes the existing order.
    assert len(db.rows["selora_orders"]) == 1


def test_reused_and_fresh_responses_share_a_shape(client, monkeypatch):
    order = _mk_order(minutes_ago=5)
    _wire(monkeypatch, [order])
    reused = _create(client, prior_reference=REF).json()
    fresh = _create(client).json()
    assert reused["reused"] is True and fresh["reused"] is False
    assert set(reused.keys()) == set(fresh.keys())


def test_create_after_expiry_makes_new_order(client, monkeypatch):
    order = _mk_order(minutes_ago=60, status="expired")
    db = _wire(monkeypatch, [order])
    r = _create(client, prior_reference=REF)
    data = r.json()
    assert data["reused"] is False
    assert data["reference"] != REF
    assert len(db.rows["selora_orders"]) == 2
    assert db.rows["selora_orders"][1]["status"] == "pending"


def test_over_ttl_pending_is_not_reused_even_before_the_sweep(client, monkeypatch):
    # The sweep hasn't expired it yet, but its TTL has elapsed: resuming it
    # would hand the buyer an order about to expire under them.
    order = _mk_order(minutes_ago=20)
    db = _wire(monkeypatch, [order])
    data = _create(client, prior_reference=REF).json()
    assert data["reused"] is False
    assert len(db.rows["selora_orders"]) == 2


def test_no_prior_reference_never_reuses(client, monkeypatch):
    # Cross-buyer safety: an identical cart alone must NOT match someone
    # else's pending order — without the reference, a fresh order is minted.
    order = _mk_order(minutes_ago=5)
    db = _wire(monkeypatch, [order])
    data = _create(client).json()
    assert data["reused"] is False
    assert data["reference"] != REF
    assert len(db.rows["selora_orders"]) == 2


def test_cart_mismatch_blocks_reuse(client, monkeypatch):
    order = _mk_order(minutes_ago=5)   # quantity 2 on the pending order
    db = _wire(monkeypatch, [order])
    data = _create(client, prior_reference=REF,
                   cart=[{"product_id": "p1", "quantity": 3}]).json()
    assert data["reused"] is False
    assert len(db.rows["selora_orders"]) == 2


def test_price_change_blocks_reuse(client, monkeypatch):
    # Price is part of cart identity: a repriced product forces a fresh order
    # at the current price instead of resuming the stale-priced one.
    order = _mk_order(minutes_ago=5)
    db = _wire(monkeypatch, [order])
    db.rows["selora_products"][0]["price"] = 25.00
    data = _create(client, prior_reference=REF).json()
    assert data["reused"] is False
    assert data["amount_usdc"] == 50.0
    assert len(db.rows["selora_orders"]) == 2
