"""Tests for the signed-challenge auth on the by-wallet order lookup.

GET /api/stores/{id}/orders/by-wallet/{wallet} used to return a buyer's full
order history to anyone who typed a public wallet address, matched with a
case-insensitive .ilike(). Now:

  * a buyer requests a single-use challenge bound to their wallet
    (POST /api/orders/challenge)
  * signs it with that wallet's ed25519 key and exchanges the signature for a
    short-lived proof token (POST /api/orders/verify)
  * the lookup requires that token in the X-Wallet-Proof header, and matches
    buyer_wallet with an EXACT eq() (no .ilike())

Signing here uses real ed25519 (cryptography), and the "wallet address" is the
base58 of the public key — exactly what the server decodes with solders. The
Supabase challenge table + claim_order_challenge() RPC are faked with an
in-memory store that reproduces the atomic single-use / expiry semantics.

Hermetic. No network.
"""
import base64
import time
import types

import pytest
from fastapi.testclient import TestClient
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from solders.pubkey import Pubkey

import main

STORE = "store-1"


# ── a real Solana-style wallet: base58(pubkey) + ed25519 signing ──────────────

class Wallet:
    def __init__(self):
        self._sk = Ed25519PrivateKey.generate()
        self.pub_bytes = self._sk.public_key().public_bytes_raw()
        self.address = str(Pubkey.from_bytes(self.pub_bytes))  # base58, case-sensitive

    def sign_b64(self, message: str) -> str:
        return base64.b64encode(self._sk.sign(message.encode("utf-8"))).decode("ascii")


# ── fake Supabase: challenge table with atomic single-use claim ───────────────

class _FakeChallenges:
    def __init__(self):
        self.rows = {}          # nonce -> dict
        self.orders = []        # selora_orders rows

    # supabase_admin().table(name)...
    def table(self, name):
        return _FakeTable(self, name)

    # supabase_admin().rpc("claim_order_challenge", {...})
    def rpc(self, fn, params):
        assert fn == "claim_order_challenge"
        nonce = params["p_nonce"]
        row = self.rows.get(nonce)

        def execute():
            if not row or row["used_at"] is not None or row["expires_at"] <= time.time():
                return types.SimpleNamespace(data=[])
            row["used_at"] = time.time()  # atomic mark-used
            return types.SimpleNamespace(
                data=[{"wallet_address": row["wallet_address"], "challenge": row["challenge"]}]
            )

        return types.SimpleNamespace(execute=execute)


class _FakeTable:
    def __init__(self, db, name):
        self._db = db
        self._name = name
        self._op = "select"
        self._payload = None
        self._filters = {}

    def insert(self, payload):
        self._op = "insert"; self._payload = payload; return self

    def select(self, *a, **kw):
        self._op = "select"; return self

    def eq(self, col, val):
        self._filters[col] = val; return self

    def in_(self, col, vals):
        self._filters[col] = ("in", vals); return self

    def order(self, *a, **kw):
        return self

    def execute(self):
        if self._op == "insert" and self._name == "order_auth_challenges":
            p = self._payload
            # store expires_at as an epoch for the fake's simple comparison
            from datetime import datetime
            exp = datetime.fromisoformat(p["expires_at"]).timestamp()
            self._db.rows[p["nonce"]] = {
                "wallet_address": p["wallet_address"],
                "challenge": p["challenge"],
                "expires_at": exp,
                "used_at": None,
            }
            return types.SimpleNamespace(data=[p])
        if self._op == "select" and self._name == "selora_orders":
            rows = [
                o for o in self._db.orders
                if o["store_id"] == self._filters.get("store_id")
                and o["buyer_wallet"] == self._filters.get("buyer_wallet")  # EXACT match
            ]
            return types.SimpleNamespace(data=rows)
        if self._op == "select" and self._name == "selora_products":
            return types.SimpleNamespace(data=[])
        return types.SimpleNamespace(data=[])


@pytest.fixture
def db(monkeypatch):
    fake = _FakeChallenges()
    monkeypatch.setattr("database.supabase_admin", lambda: fake)
    monkeypatch.setenv("ORDER_PROOF_SECRET", "test-secret-stable")
    # Rate limiter: no rpc collision — order_challenge uses _rate_limit_exceeded
    # which calls supabase_admin().rpc("rate_limit_hit", ...); our fake asserts
    # the fn name, so stub the limiter to a no-op allow.
    monkeypatch.setattr(main, "_rate_limit_exceeded", lambda *a, **k: False)
    return fake


@pytest.fixture
def client():
    return TestClient(main.app)


def _challenge(client, wallet_address):
    r = client.post("/api/orders/challenge", json={"wallet_address": wallet_address})
    assert r.status_code == 200, r.text
    return r.json()


def _verify(client, wallet_address, nonce, signature_b64):
    return client.post("/api/orders/verify", json={
        "wallet_address": wallet_address, "nonce": nonce, "signature": signature_b64,
    })


def _seed_order(db, store_id, wallet, oid="o1"):
    db.orders.append({
        "id": oid, "store_id": store_id, "buyer_wallet": wallet,
        "total_usd": 25.0, "status": "paid", "created_at": "2026-01-01T00:00:00+00:00",
        "reference": "ref", "signature": "sig", "items": [],
    })


# ── happy path ────────────────────────────────────────────────────────────────

def test_valid_signature_over_fresh_nonce_returns_orders(client, db):
    w = Wallet()
    _seed_order(db, STORE, w.address)
    ch = _challenge(client, w.address)
    v = _verify(client, w.address, ch["nonce"], w.sign_b64(ch["challenge"]))
    assert v.status_code == 200, v.text
    token = v.json()["token"]

    r = client.get(f"/api/stores/{STORE}/orders/by-wallet/{w.address}",
                   headers={"X-Wallet-Proof": token})
    assert r.status_code == 200
    assert len(r.json()["orders"]) == 1


def test_token_grants_repeated_lookups_without_resigning(client, db):
    # A refresh reuses the same token — the "short session, not single lookup".
    w = Wallet()
    _seed_order(db, STORE, w.address)
    ch = _challenge(client, w.address)
    token = _verify(client, w.address, ch["nonce"], w.sign_b64(ch["challenge"])).json()["token"]
    for _ in range(3):
        r = client.get(f"/api/stores/{STORE}/orders/by-wallet/{w.address}",
                       headers={"X-Wallet-Proof": token})
        assert r.status_code == 200


# ── the lookup itself is gated ────────────────────────────────────────────────

def test_lookup_without_proof_is_401(client, db):
    w = Wallet()
    _seed_order(db, STORE, w.address)
    r = client.get(f"/api/stores/{STORE}/orders/by-wallet/{w.address}")
    assert r.status_code == 401


def test_proof_for_other_wallet_is_rejected(client, db):
    a, b = Wallet(), Wallet()
    _seed_order(db, STORE, a.address)
    ch = _challenge(client, b.address)
    token_b = _verify(client, b.address, ch["nonce"], b.sign_b64(ch["challenge"])).json()["token"]
    # b's valid token must not read a's orders.
    r = client.get(f"/api/stores/{STORE}/orders/by-wallet/{a.address}",
                   headers={"X-Wallet-Proof": token_b})
    assert r.status_code == 401


# ── signature / nonce failure modes ──────────────────────────────────────────

def test_wrong_signature_is_rejected(client, db):
    w = Wallet()
    ch = _challenge(client, w.address)
    bad = base64.b64encode(b"\x00" * 64).decode()
    v = _verify(client, w.address, ch["nonce"], bad)
    assert v.status_code == 401


def test_signature_over_someone_elses_nonce_is_rejected(client, db):
    a, b = Wallet(), Wallet()
    ch_a = _challenge(client, a.address)
    ch_b = _challenge(client, b.address)
    # b signs its OWN challenge but presents a's nonce.
    v = _verify(client, b.address, ch_a["nonce"], b.sign_b64(ch_b["challenge"]))
    assert v.status_code == 401  # nonce a is bound to wallet a, not b


def test_reused_nonce_is_rejected(client, db):
    w = Wallet()
    ch = _challenge(client, w.address)
    sig = w.sign_b64(ch["challenge"])
    assert _verify(client, w.address, ch["nonce"], sig).status_code == 200
    assert _verify(client, w.address, ch["nonce"], sig).status_code == 401  # single-use


def test_expired_nonce_is_rejected(client, db):
    w = Wallet()
    ch = _challenge(client, w.address)
    # Force expiry in the fake store.
    db.rows[ch["nonce"]]["expires_at"] = time.time() - 1
    v = _verify(client, w.address, ch["nonce"], w.sign_b64(ch["challenge"]))
    assert v.status_code == 401


# ── exact (case-sensitive) wallet matching ────────────────────────────────────

def test_case_mangled_wallet_no_longer_matches(client, db):
    # The order is stored under the real address; a case-swapped address is a
    # different base58 value and (a) fails pubkey→bytes for signing anyway, and
    # (b) the lookup's exact eq() would not match even with a valid proof.
    w = Wallet()
    _seed_order(db, STORE, w.address)
    swapped = w.address.swapcase()
    ch = _challenge(client, w.address)
    token = _verify(client, w.address, ch["nonce"], w.sign_b64(ch["challenge"])).json()["token"]
    # A proof for the real wallet does not authorize the swapped string...
    r = client.get(f"/api/stores/{STORE}/orders/by-wallet/{swapped}",
                   headers={"X-Wallet-Proof": token})
    assert r.status_code == 401


def test_exact_match_does_not_return_case_variant_orders(client, db):
    # Belt-and-suspenders on the eq() replacement: an order stored under a
    # case-variant is NOT returned for the exact address.
    w = Wallet()
    _seed_order(db, STORE, w.address.swapcase(), oid="variant")
    ch = _challenge(client, w.address)
    token = _verify(client, w.address, ch["nonce"], w.sign_b64(ch["challenge"])).json()["token"]
    r = client.get(f"/api/stores/{STORE}/orders/by-wallet/{w.address}",
                   headers={"X-Wallet-Proof": token})
    assert r.status_code == 200
    assert r.json()["orders"] == []


# ── input validation ─────────────────────────────────────────────────────────

def test_challenge_rejects_non_base58_wallet(client, db):
    r = client.post("/api/orders/challenge", json={"wallet_address": "not-a-wallet!!!"})
    assert r.status_code == 400
