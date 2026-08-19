"""Tests for GET /api/checkout/solana/verify/{reference} — the free-order fix.

The old confirm condition was ``received_usdc >= expected OR is_self_transfer``
where is_self_transfer compared the order's client-supplied buyer_wallet to the
merchant payout wallet, case-insensitively. Since buyer_wallet comes from the
unauthenticated checkout-create body and the payout address is public, anyone
could flip an order to paid with a 0-USDC transaction that merely referenced
the payment reference key. Now:

  * confirmation depends only on on-chain facts: correct mint, balance owner
    == merchant wallet, delta >= expected amount, tx found via reference key
  * buyer_wallet never influences confirmation, whatever it is set to
  * the merchant self-payment allowance survives ONLY behind
    SOLANA_ALLOW_SELF_TRANSFER_CONFIRM (default OFF), and even then requires
    the on-chain fee payer to BE the merchant wallet — not buyer_wallet
  * base58 addresses compare case-sensitively (no .lower())

Hermetic: supabase_admin is replaced with a table-routing stub that records
mutations, httpx.Client with a canned two-call RPC (getSignaturesForAddress,
getTransaction). No network.
"""
import types

import pytest
from fastapi.testclient import TestClient

import main

MERCHANT = "MerchQx7hFyBzk3vN2mWpRt5uJdA8cE4gK6sYbTnUvXi"
BUYER = "BuyRk2mVpL9wQe5tZxC7nD4fG8hJ3aS6uMyEbNcPdWo"
MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
WRONG_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
REF = "RefKey11111111111111111111111111111111111111"
PENDING_MSG = "Transaction found but merchant did not receive expected USDC amount"


# ── fakes ─────────────────────────────────────────────────────────────────────

class _FakeQuery:
    def __init__(self, db, table):
        self._db = db
        self._table = table
        self._op = "select"
        self._payload = None

    def select(self, *a, **kw):
        self._op = "select"
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def insert(self, payload):
        self._op = "insert"
        self._payload = payload
        return self

    def eq(self, *a, **kw):
        return self

    def in_(self, *a, **kw):
        return self

    def execute(self):
        if self._op == "update":
            self._db.updates.append((self._table, self._payload))
            return types.SimpleNamespace(data=[self._payload])
        if self._op == "insert":
            self._db.inserts.append((self._table, self._payload))
            return types.SimpleNamespace(data=[self._payload])
        return types.SimpleNamespace(data=self._db.rows.get(self._table, []))


class _FakeDb:
    """Routes table() calls to canned rows; records updates/inserts."""

    def __init__(self, rows):
        self.rows = rows
        self.updates = []
        self.inserts = []

    def table(self, name):
        return _FakeQuery(self, name)


class _FakeRpc:
    """Stands in for httpx.Client. Serves one signature for the reference and
    one canned getTransaction result."""

    def __init__(self, tx_result):
        self._tx_result = tx_result

    def post(self, url, json=None, headers=None):
        if json.get("method") == "getSignaturesForAddress":
            body = {"jsonrpc": "2.0", "result": [{"signature": "sig-1"}]}
        else:
            body = {"jsonrpc": "2.0", "result": self._tx_result}
        return types.SimpleNamespace(status_code=200, json=lambda: body)


def _tx(pre, post, mint=MINT, owner=MERCHANT, fee_payer=BUYER):
    """A getTransaction result whose merchant token account moves pre -> post."""
    return {
        "transaction": {"message": {"accountKeys": [fee_payer, MERCHANT, MINT, REF]}},
        "meta": {
            "err": None,
            "preTokenBalances": [
                {"accountIndex": 3, "mint": mint, "owner": owner,
                 "uiTokenAmount": {"uiAmount": pre}},
            ],
            "postTokenBalances": [
                {"accountIndex": 3, "mint": mint, "owner": owner,
                 "uiTokenAmount": {"uiAmount": post}},
            ],
        },
    }


def _no_transfer_tx(fee_payer=BUYER):
    """A confirmed transaction that references the key but moves no tokens."""
    return {
        "transaction": {"message": {"accountKeys": [fee_payer, REF]}},
        "meta": {"err": None, "preTokenBalances": [], "postTokenBalances": []},
    }


def _order(buyer_wallet=BUYER, total=25.0):
    return {
        "id": "order-1",
        "store_id": "store-1",
        "reference": REF,
        "status": "pending",
        "total_usd": total,
        "buyer_wallet": buyer_wallet,
        "items": [],
    }


def _wire(monkeypatch, order, tx_result):
    db = _FakeDb({
        "selora_orders": [order],
        "selora_stores": [{"id": "store-1", "user_id": "u1",
                           "payout_wallet_address": MERCHANT}],
    })
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    monkeypatch.setattr("httpx.Client", lambda **kw: _FakeRpc(tx_result))
    return db


def _paid(db):
    return [u for t, u in db.updates if t == "selora_orders" and u.get("status") == "paid"]


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("USDC_MINT", MINT)
    monkeypatch.setenv("SOLANA_RPC_URL", "http://rpc.test")
    monkeypatch.delenv("SOLANA_ALLOW_SELF_TRANSFER_CONFIRM", raising=False)
    return TestClient(main.app)


# ── on-chain facts confirm ────────────────────────────────────────────────────

def test_exact_amount_confirms(client, monkeypatch):
    db = _wire(monkeypatch, _order(total=25.0), _tx(pre=0.0, post=25.0))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200
    assert r.json()["status"] == "confirmed"
    assert r.json()["signature"] == "sig-1"
    assert len(_paid(db)) == 1


def test_underpayment_does_not_confirm(client, monkeypatch):
    db = _wire(monkeypatch, _order(total=25.0), _tx(pre=0.0, post=24.99))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200
    assert r.json()["status"] == "pending"
    assert r.json()["message"] == PENDING_MSG
    assert _paid(db) == []


def test_wrong_mint_does_not_confirm(client, monkeypatch):
    # Full amount, right owner — but a different token.
    db = _wire(monkeypatch, _order(total=25.0), _tx(pre=0.0, post=25.0, mint=WRONG_MINT))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "pending"
    assert r.json()["message"] == PENDING_MSG
    assert _paid(db) == []


# ── the exploit ───────────────────────────────────────────────────────────────

def test_zero_usdc_tx_with_reference_does_not_confirm(client, monkeypatch):
    # The free-order exploit: buyer_wallet set to the merchant's public payout
    # address, then any trivial transaction referencing the key. Old code
    # flipped this to paid; it must stay pending.
    db = _wire(monkeypatch, _order(buyer_wallet=MERCHANT), _no_transfer_tx())
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "pending"
    assert r.json()["message"] == PENDING_MSG
    assert _paid(db) == []


def test_buyer_wallet_equal_to_merchant_does_not_confirm(client, monkeypatch):
    # Zero-delta transfer shaped like a self-payment, buyer_wallet == merchant:
    # buyer_wallet must carry no authority.
    db = _wire(monkeypatch, _order(buyer_wallet=MERCHANT), _tx(pre=10.0, post=10.0))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "pending"
    assert _paid(db) == []


def test_case_mangled_merchant_address_does_not_confirm(client, monkeypatch):
    # The old .lower() made distinct base58 addresses compare equal.
    db = _wire(monkeypatch, _order(buyer_wallet=MERCHANT.swapcase()), _no_transfer_tx())
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "pending"
    assert _paid(db) == []


# ── the gated self-payment allowance ──────────────────────────────────────────

def test_merchant_self_payment_pending_by_default(client, monkeypatch):
    # A genuine merchant self-test (merchant signed, zero net delta) stays
    # pending unless the flag is explicitly enabled.
    db = _wire(monkeypatch, _order(buyer_wallet=MERCHANT),
               _tx(pre=10.0, post=10.0, fee_payer=MERCHANT))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "pending"
    assert _paid(db) == []


def test_flag_on_merchant_signed_self_payment_confirms(client, monkeypatch):
    monkeypatch.setenv("SOLANA_ALLOW_SELF_TRANSFER_CONFIRM", "true")
    db = _wire(monkeypatch, _order(buyer_wallet=None),
               _tx(pre=10.0, post=10.0, fee_payer=MERCHANT))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "confirmed"
    assert len(_paid(db)) == 1


def test_flag_on_attacker_tx_still_does_not_confirm(client, monkeypatch):
    # Even with the flag on, buyer_wallet == merchant means nothing: the fee
    # payer on chain is the attacker, not the merchant.
    monkeypatch.setenv("SOLANA_ALLOW_SELF_TRANSFER_CONFIRM", "true")
    db = _wire(monkeypatch, _order(buyer_wallet=MERCHANT), _no_transfer_tx(fee_payer=BUYER))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "pending"
    assert _paid(db) == []
