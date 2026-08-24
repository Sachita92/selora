"""Tests for the server-side pending-order reconciliation sweep.

Verification used to run only while a buyer's browser polled the verify
endpoint, so a pending order whose buyer closed the tab stayed pending forever
even with the payment confirmed on-chain. GET /api/stores/{store_id}/orders
(the seller dashboard's ~10s poll) now schedules _sweep_pending_orders as a
FastAPI background task: throttled per store through the rate_limit_counters
table (sweep: key prefix, migration 015), bounded to the 10 most recent
pendings of the last 48h, and re-verifying each through the same
_verify_and_confirm_order core the browser path uses.

TestClient runs background tasks inside the request cycle, so sweep effects
are observable right after the call returns — while the response body itself
was built BEFORE the sweep ran (the next poll shows the confirmations).

Hermetic: auth + store resolution stubbed (test_selora_store_authz pattern);
supabase_admin is a table-routing fake with real eq/gte/order/limit filtering
whose rpc() reproduces both rate_limit_hit (migration 015) and
claim_and_fulfill_order (migrations 017/018); httpx serves canned
per-reference RPC responses. No network.
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


# ── fakes ─────────────────────────────────────────────────────────────────────

class _FakeQuery:
    """Table query with real eq/gte/order/limit semantics, so the sweep's
    bounded listing (status filter, 48h cutoff, cap) is actually exercised."""

    def __init__(self, db, table):
        self._db, self._table = db, table
        self._filters = []
        self._order_col, self._desc = None, False
        self._limit = None

    def select(self, *a, **kw):
        return self

    def eq(self, col, val):
        self._filters.append(("eq", col, val))
        return self

    def gte(self, col, val):
        self._filters.append(("gte", col, val))
        return self

    def order(self, col, desc=False):
        self._order_col, self._desc = col, desc
        return self

    def limit(self, n):
        self._limit = n
        return self

    def execute(self):
        rows = list(self._db.rows.get(self._table, []))
        for op, col, val in self._filters:
            if op == "eq":
                rows = [r for r in rows if r.get(col) == val]
            else:  # gte — created_at ISO strings from the same clock, so
                   # lexicographic comparison is chronological
                rows = [r for r in rows if r.get(col) is not None and r.get(col) >= val]
        if self._order_col:
            rows = sorted(rows, key=lambda r: r.get(self._order_col) or "", reverse=self._desc)
        if self._limit is not None:
            rows = rows[: self._limit]
        # Snapshots, like a real DB read: the claim rpc mutates canonical rows.
        return types.SimpleNamespace(data=[dict(r) for r in rows])


class _FakeDb:
    def __init__(self, orders):
        self.rows = {
            "selora_orders": orders,
            "selora_stores": [{"id": STORE, "user_id": OWNER,
                               "payout_wallet_address": MERCHANT}],
        }
        self.counters = {}   # rate_limit_hit: key -> count
        self.claims = []     # order ids claimed, in sweep order

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
    """httpx.Client stand-in. paid_refs maps reference -> fee payer wallet:
    those references have a confirmed full-amount USDC transfer on chain
    (signature "sig-{reference}"); every other reference has no transaction."""

    def __init__(self, paid_refs, amount=25.0):
        self._paid = paid_refs
        self._amount = amount

    def post(self, url, json=None, headers=None):
        if json.get("method") == "getSignaturesForAddress":
            ref = json["params"][0]
            sigs = [{"signature": f"sig-{ref}"}] if ref in self._paid else []
            body = {"jsonrpc": "2.0", "result": sigs}
        else:  # getTransaction — recover the reference from the signature
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


def _mk_order(n, hours_ago, status="pending", buyer_wallet=None, total=25.0):
    created = (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()
    return {"id": f"order-{n}", "store_id": STORE, "reference": f"Ref{n}",
            "status": status, "total_usd": total, "buyer_wallet": buyer_wallet,
            "items": [], "created_at": created, "signature": None}


def _wire(monkeypatch, orders, paid_refs):
    db = _FakeDb(orders)
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: (OWNER, "o@example.com"))
    monkeypatch.setattr("database.get_store_by_id", lambda sid: {"id": STORE, "user_id": OWNER})
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    monkeypatch.setattr("httpx.Client", lambda **kw: _FakeChain(paid_refs))
    monkeypatch.setenv("USDC_MINT", MINT)
    monkeypatch.setenv("SOLANA_RPC_URL", "http://rpc.test")
    monkeypatch.delenv("SOLANA_ALLOW_SELF_TRANSFER_CONFIRM", raising=False)
    return db


@pytest.fixture
def client():
    return TestClient(main.app)


def _poll(client):
    return client.get(f"/api/stores/{STORE}/orders")


# ── the point of the sweep: confirmation with no browser polling ──────────────

def test_orders_poll_confirms_pending_order_without_client(client, monkeypatch):
    order = _mk_order(1, hours_ago=1)
    db = _wire(monkeypatch, [order], {order["reference"]: PAYER})
    r = _poll(client)
    assert r.status_code == 200
    # The response was built before the background sweep ran: this poll still
    # shows pending; the confirmation lands for the dashboard's next poll.
    assert r.json()["orders"][0]["status"] == "pending"
    row = db.rows["selora_orders"][0]
    assert row["status"] == "paid"
    assert row["signature"] == f"sig-{order['reference']}"
    assert db.claims == [order["id"]]


def test_sweep_writes_fee_payer_for_qr_order(client, monkeypatch):
    # QR-created order: buyer_wallet null at create, phone wallet paid. After
    # the sweep the order carries the actual paying wallet, exact base58.
    order = _mk_order(1, hours_ago=1, buyer_wallet=None)
    db = _wire(monkeypatch, [order], {order["reference"]: PAYER})
    _poll(client)
    assert db.rows["selora_orders"][0]["buyer_wallet"] == PAYER


def test_unpaid_pending_order_stays_pending(client, monkeypatch):
    order = _mk_order(1, hours_ago=1)
    db = _wire(monkeypatch, [order], {})   # nothing on chain
    r = _poll(client)
    assert r.status_code == 200
    assert db.rows["selora_orders"][0]["status"] == "pending"
    assert db.claims == []


# ── throttle: at most one sweep per store per window ──────────────────────────

def test_sweep_respects_per_store_throttle(client, monkeypatch):
    order = _mk_order(1, hours_ago=1)
    db = _wire(monkeypatch, [order], {order["reference"]: PAYER})

    _poll(client)
    assert db.claims == [order["id"]]
    # Keys follow the rate_limit_counters convention under the sweep: prefix.
    assert db.counters and all(k.startswith(f"sweep:{STORE}:") for k in db.counters)

    # Re-arm the order; a second poll in the same window must NOT sweep.
    db.rows["selora_orders"][0].update({"status": "pending", "signature": None})
    _poll(client)
    assert db.claims == [order["id"]]
    assert db.rows["selora_orders"][0]["status"] == "pending"

    # Window expiry (counter row gone) lets the next poll sweep again.
    db.counters.clear()
    _poll(client)
    assert db.claims == [order["id"], order["id"]]
    assert db.rows["selora_orders"][0]["status"] == "paid"


# ── bounds: cap per sweep, 48h age window ─────────────────────────────────────

def test_sweep_caps_orders_and_skips_old_pendings(client, monkeypatch):
    # 12 recent pendings (hours_ago 1..12) plus one 3-day-old pending, all
    # with confirmed payments on chain. Cap is 10, cutoff is 48h.
    recent = [_mk_order(i, hours_ago=i + 1) for i in range(12)]
    old = _mk_order(99, hours_ago=72)
    paid = {o["reference"]: PAYER for o in recent + [old]}
    db = _wire(monkeypatch, recent + [old], paid)

    _poll(client)
    # The 10 most recent pendings were verified; the 2 oldest recents wait for
    # a later sweep, the 3-day-old one is the expiry task's problem.
    assert len(db.claims) == 10
    assert set(db.claims) == {o["id"] for o in recent[:10]}
    by_id = {o["id"]: o for o in db.rows["selora_orders"]}
    assert by_id[recent[10]["id"]]["status"] == "pending"
    assert by_id[recent[11]["id"]]["status"] == "pending"
    assert by_id[old["id"]]["status"] == "pending"


# ── failure isolation ─────────────────────────────────────────────────────────

def test_bad_order_does_not_break_sweep_or_response(client, monkeypatch):
    # The middle order is malformed (total_usd None -> float(None) raises
    # before verification even reaches the chain). The endpoint and the other
    # orders in the sweep must be unaffected.
    good_new = _mk_order(1, hours_ago=1)
    bad = _mk_order(2, hours_ago=2, total=None)
    good_old = _mk_order(3, hours_ago=3)
    db = _wire(monkeypatch, [good_new, bad, good_old],
               {good_new["reference"]: PAYER, good_old["reference"]: PAYER})

    r = _poll(client)
    assert r.status_code == 200
    assert len(r.json()["orders"]) == 3
    assert set(db.claims) == {good_new["id"], good_old["id"]}
    by_id = {o["id"]: o for o in db.rows["selora_orders"]}
    assert by_id[bad["id"]]["status"] == "pending"
    assert by_id[good_new["id"]]["status"] == "paid"
    assert by_id[good_old["id"]]["status"] == "paid"


# ── placement: only owner-serving requests schedule a sweep ───────────────────

def test_non_owner_poll_does_not_sweep(client, monkeypatch):
    order = _mk_order(1, hours_ago=1)
    db = _wire(monkeypatch, [order], {order["reference"]: PAYER})
    monkeypatch.setattr("main._get_user_id_from_token", lambda request: ("intruder", "i@evil.test"))
    r = _poll(client)
    assert r.status_code == 200
    assert r.json() == {"orders": []}
    assert db.claims == []
    assert db.counters == {}
