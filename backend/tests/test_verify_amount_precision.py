"""Regression: an exact-amount payment must confirm (float precision bug).

A real 10 USDC devnet payment (signature 2oDqeK96…fp7Dd, order reference
CJXWFzqC…fh2aHj) sat pending for 16+ minutes through full client polling AND
the reconciliation sweep. The merchant's USDC account moved 30.888 -> 40.888,
and the old confirm computed the delta in float:

    >>> 40.888 - 30.888
    9.999999999999996

which is < 10.0, so `received_usdc >= expected_usdc` was False and the payment
was never confirmed. Nothing about the transaction was wrong; the arithmetic
was. The delta is now summed in the RPC's own integer base units.

The fixtures here are the VERBATIM shape Helius devnet returns for
getTransaction with encoding "json" — including uiTokenAmount's `amount`
(a base-unit decimal string), `decimals`, `uiAmountString`, the
`{Ok: None}` status, `version: 0`, and a plain (unwrapped) `result` object.
The previous fixtures carried only `uiAmount`, which is exactly why this
survived: no test exercised a value whose float subtraction is inexact.
"""
import types

import pytest
from fastapi.testclient import TestClient

import main

# Real values from the stuck order / transaction.
MERCHANT = "AQxbe33aspjbxRRfykczJH81zqccVPka4An79PgzmEHB"
BUYER = "Gp7xvKSwCvVNNmBhziixLVgFHdMKvnTSX6gNqSYbiS1n"
MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
REF = "CJXWFzqCK3yDpqmtwu3fS9fBnP6JkVWeuZTaHofh2aHj"
SIG = ("2oDqeK96FN3myAaiNapvWTZmfDs3VmnRhHUNMWhp1jDSky6Y6Lxn"
       "WDMrbbFjBtQEgZZqBVrDzUiZWa7bDrQfp7Dd")
ORDER_ID = "b9c98448-8063-4a4d-9bc5-d183f015e9bc"


def _ui(amount_base_units: str, ui_amount: float, decimals: int = 6):
    """A uiTokenAmount exactly as the RPC sends it."""
    return {
        "amount": amount_base_units,
        "decimals": decimals,
        "uiAmount": ui_amount,
        "uiAmountString": str(ui_amount),
    }


def _real_tx(pre_ui, post_ui, owner=MERCHANT, mint=MINT, fee_payer=BUYER):
    """The real getTransaction result for the stuck payment, trimmed to the
    fields verify reads but keeping their exact shapes."""
    return {
        "blockTime": 1787551970,
        "meta": {
            "computeUnitsConsumed": 15255,
            "err": None,
            "fee": 80000,
            "innerInstructions": [],
            "loadedAddresses": {"readonly": [], "writable": []},
            "postTokenBalances": [
                {"accountIndex": 1, "mint": mint, "owner": fee_payer,
                 "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                 "uiTokenAmount": _ui("32110000", 32.11)},
                {"accountIndex": 2, "mint": mint, "owner": owner,
                 "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                 "uiTokenAmount": post_ui},
            ],
            "preTokenBalances": [
                {"accountIndex": 1, "mint": mint, "owner": fee_payer,
                 "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                 "uiTokenAmount": _ui("42110000", 42.11)},
                {"accountIndex": 2, "mint": mint, "owner": owner,
                 "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                 "uiTokenAmount": pre_ui},
            ],
            "rewards": [],
            "status": {"Ok": None},
        },
        "slot": 487284814,
        "transaction": {
            "message": {
                "accountKeys": [
                    fee_payer,
                    "GeMX3ERwkzMTsVNYvWMTQQQG5ey7mqGmijb1zd8ncVFx",
                    "AkkJGhNSdNFUJEtoeeBz8sMas1hvC6Qjv3nfzdD9nipx",
                    "ComputeBudget111111111111111111111111111111",
                    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
                    mint,
                    "11111111111111111111111111111111",
                    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    owner,
                    REF,
                ],
                "addressTableLookups": [],
                "header": {"numReadonlySignedAccounts": 0,
                           "numReadonlyUnsignedAccounts": 7,
                           "numRequiredSignatures": 1},
                "recentBlockhash": "EFrL65HQ96CqDGRNpcJTtX6gXnpmEJsjZw51B1mnMmj2",
            },
            "signatures": [SIG],
        },
        "transactionIndex": 66,
        "version": 0,
    }


class _FakeQuery:
    def __init__(self, db, table):
        self._db, self._table, self._op = db, table, "select"

    def select(self, *a, **kw): self._op = "select"; return self
    def eq(self, *a, **kw): return self

    def execute(self):
        return types.SimpleNamespace(data=[dict(r) for r in self._db.rows.get(self._table, [])])


class _FakeDb:
    def __init__(self, order):
        self.rows = {
            "selora_orders": [order],
            "selora_stores": [{"id": "store-1", "user_id": "u1",
                               "payout_wallet_address": MERCHANT}],
        }
        self.claims = []

    def table(self, name):
        return _FakeQuery(self, name)

    def rpc(self, fn, params):
        assert fn == "claim_and_fulfill_order"

        def execute():
            order = self.rows["selora_orders"][0]
            if order["status"] != "pending":
                return types.SimpleNamespace(data=[{"claimed": False, "oversold": []}])
            order["status"] = "paid"
            order["signature"] = params["p_signature"]
            if params.get("p_buyer_wallet"):
                order["buyer_wallet"] = params["p_buyer_wallet"]
            self.claims.append(params)
            return types.SimpleNamespace(data=[{"claimed": True, "oversold": []}])

        return types.SimpleNamespace(execute=execute)


class _FakeRpc:
    """Serves the real two-call sequence, with the real (unwrapped) shapes."""

    def __init__(self, tx_result):
        self._tx_result = tx_result

    def post(self, url, json=None, headers=None):
        if json.get("method") == "getSignaturesForAddress":
            body = {"jsonrpc": "2.0", "id": 1, "result": [{
                "blockTime": 1787551970, "confirmationStatus": "finalized",
                "err": None, "memo": None, "signature": SIG,
                "slot": 487284814, "transactionIndex": 66,
            }]}
        else:
            body = {"jsonrpc": "2.0", "id": 2, "result": self._tx_result}
        return types.SimpleNamespace(status_code=200, json=lambda: body)


def _order(total=10.0):
    return {"id": ORDER_ID, "store_id": "store-1", "reference": REF,
            "status": "pending", "total_usd": total, "buyer_wallet": BUYER,
            "items": []}


def _wire(monkeypatch, order, tx_result):
    db = _FakeDb(order)
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    monkeypatch.setattr("httpx.Client", lambda **kw: _FakeRpc(tx_result))
    return db


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("USDC_MINT", MINT)
    monkeypatch.setenv("SOLANA_RPC_URL", "http://rpc.test")
    monkeypatch.delenv("SOLANA_ALLOW_SELF_TRANSFER_CONFIRM", raising=False)
    return TestClient(main.app)


# ── the exact stuck payment ───────────────────────────────────────────────────

def test_stuck_order_confirms_float_inexact_delta(client, monkeypatch):
    # 30.888 -> 40.888 for a 10.00 order: float delta is 9.999999999999996.
    order = _order(total=10.0)
    db = _wire(monkeypatch, order,
               _real_tx(pre_ui=_ui("30888000", 30.888), post_ui=_ui("40888000", 40.888)))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.status_code == 200
    assert r.json()["status"] == "confirmed"
    assert r.json()["signature"] == SIG
    assert r.json()["order_id"] == ORDER_ID
    assert len(db.claims) == 1
    assert order["status"] == "paid"
    # Confirm-time buyer_wallet capture still holds on this real shape.
    assert order["buyer_wallet"] == BUYER


def test_float_arithmetic_would_have_missed_it():
    # Pins the premise: the old comparison really does fail for these values,
    # so this test would catch a regression back to float math.
    assert (40.888 - 30.888) < 10.0
    assert main._token_base_units(_ui("40888000", 40.888)) \
        - main._token_base_units(_ui("30888000", 30.888)) \
        == main._usd_to_base_units(10.0, 6)


# ── other inexact-in-float amounts confirm ────────────────────────────────────

@pytest.mark.parametrize("pre, post, pre_ui, post_ui, total", [
    ("30888000", "40888000", 30.888, 40.888, 10.0),     # the reported case
    ("1000000", "1290000", 1.0, 1.29, 0.29),            # 1.29 - 1.0 = 0.29000000000000004 (over)
    ("2030000", "2100000", 2.03, 2.10, 0.07),           # 2.1 - 2.03 = 0.06999999999999984 (under)
    ("8070000", "8300000", 8.07, 8.30, 0.23),           # 8.3 - 8.07 = 0.22999999999999954 (under)
    ("0", "19990000", 0.0, 19.99, 19.99),               # fresh account, cent amount
])
def test_exact_amounts_confirm_regardless_of_float_error(client, monkeypatch,
                                                         pre, post, pre_ui, post_ui, total):
    order = _order(total=total)
    db = _wire(monkeypatch, order,
               _real_tx(pre_ui=_ui(pre, pre_ui), post_ui=_ui(post, post_ui)))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "confirmed", f"{post_ui} - {pre_ui} should cover {total}"
    assert len(db.claims) == 1


# ── underpayment still rejected: the fix must not round in the buyer's favour ──

@pytest.mark.parametrize("pre, post, pre_ui, post_ui, total", [
    ("30888000", "40887999", 30.888, 40.887999, 10.0),   # one base unit short
    ("0", "9990000", 0.0, 9.99, 10.0),                   # a cent short
    ("0", "0", 0.0, 0.0, 10.0),                          # nothing moved
])
def test_underpayment_still_pending(client, monkeypatch, pre, post, pre_ui, post_ui, total):
    order = _order(total=total)
    db = _wire(monkeypatch, order,
               _real_tx(pre_ui=_ui(pre, pre_ui), post_ui=_ui(post, post_ui)))
    r = client.get(f"/api/checkout/solana/verify/{REF}")
    assert r.json()["status"] == "pending"
    assert db.claims == []
    assert order["status"] == "pending"


def test_overpayment_confirms(client, monkeypatch):
    order = _order(total=10.0)
    db = _wire(monkeypatch, order,
               _real_tx(pre_ui=_ui("30888000", 30.888), post_ui=_ui("45888000", 45.888)))
    assert client.get(f"/api/checkout/solana/verify/{REF}").json()["status"] == "confirmed"
    assert len(db.claims) == 1


# ── wrong mint / wrong owner unaffected by the base-unit change ───────────────

def test_wrong_mint_still_pending(client, monkeypatch):
    other_mint = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
    order = _order(total=10.0)
    db = _wire(monkeypatch, order,
               _real_tx(pre_ui=_ui("30888000", 30.888), post_ui=_ui("40888000", 40.888),
                        mint=other_mint))
    assert client.get(f"/api/checkout/solana/verify/{REF}").json()["status"] == "pending"
    assert db.claims == []


def test_wrong_owner_still_pending(client, monkeypatch):
    stranger = "StrangerWk2mVpL9wQe5tZxC7nD4fG8hJ3aS6uMyEbNc"
    order = _order(total=10.0)
    db = _wire(monkeypatch, order,
               _real_tx(pre_ui=_ui("30888000", 30.888), post_ui=_ui("40888000", 40.888),
                        owner=stranger))
    assert client.get(f"/api/checkout/solana/verify/{REF}").json()["status"] == "pending"
    assert db.claims == []


# ── the base-unit helpers ─────────────────────────────────────────────────────

def test_base_units_prefers_raw_amount():
    # 'amount' is authoritative; a contradictory uiAmount must not win.
    assert main._token_base_units(
        {"amount": "40888000", "decimals": 6, "uiAmount": 999.0}) == 40888000


def test_base_units_falls_back_to_ui_amount_exactly():
    # Older/leaner providers may omit 'amount'. The Decimal fallback stays exact.
    assert main._token_base_units({"decimals": 6, "uiAmount": 40.888}) == 40888000
    assert main._token_base_units({"uiAmount": 25.0}) == 25000000        # default 6 decimals
    assert main._token_base_units({}) == 0
    assert main._token_base_units(None) == 0


def test_base_units_handles_junk_without_raising():
    assert main._token_base_units({"amount": "not-a-number", "uiAmount": 1.5}) == 1500000
    assert main._token_base_units({"amount": None, "uiAmount": None}) == 0
    assert main._token_base_units({"amount": "", "decimals": "bogus", "uiAmount": 2.0}) == 2000000


def test_usd_to_base_units_is_exact_for_cents():
    assert main._usd_to_base_units(10.0, 6) == 10000000
    assert main._usd_to_base_units(0.29, 6) == 290000
    assert main._usd_to_base_units(19.99, 6) == 19990000
    assert main._usd_to_base_units("42.50", 6) == 42500000
    assert main._usd_to_base_units(None, 6) == 0


def test_non_usdc_decimals_respected():
    # A 9-decimal mint: the expected total must scale by the reported decimals.
    assert main._token_base_units({"amount": "1500000000", "decimals": 9}) == 1500000000
    assert main._usd_to_base_units(1.5, 9) == 1500000000
