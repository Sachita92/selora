"""Tests for POST /api/rpc/solana — the method-allowlisted RPC proxy.

The proxy used to forward ANY JSON-RPC body to the keyed upstream endpoint
with no validation — an open relay anyone could use to burn the RPC quota.
It stays unauthenticated on purpose (it serves the public storefront checkout,
where buyers pay without accounts), so the lockdown is shape-based:

  * only the JSON-RPC methods the checkout flow in Storefront.jsx actually
    issues — directly or inside @solana/web3.js Connection internals — are
    forwarded; everything else is 403
  * a single JSON-RPC request object only; batch arrays are 400 so the
    allowlist cannot be bypassed inside a batch
  * bodies over 16 KB are 413 before the upstream is ever contacted

Hermetic: httpx.AsyncClient is replaced with a recording fake. No network.
"""
import types

import pytest
from fastapi.testclient import TestClient

import main

# Every method the checkout flow issues through the proxy (see the allowlist
# comments in main.py for which call site produces each).
CHECKOUT_METHODS = [
    "getAccountInfo",
    "getBalance",
    "getTokenAccountBalance",
    "getLatestBlockhash",
    "simulateTransaction",
    "getBlockHeight",
    "getSignatureStatuses",
]

UPSTREAM_RESULT = b'{"jsonrpc": "2.0", "id": 1, "result": "ok"}'


class _FakeAsyncClient:
    """Stands in for httpx.AsyncClient; records every forwarded post."""

    calls = []

    def __init__(self, **kw):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, json=None, headers=None):
        _FakeAsyncClient.calls.append({"url": url, "json": json})
        return types.SimpleNamespace(status_code=200, content=UPSTREAM_RESULT)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("SOLANA_RPC_URL", "http://rpc.test")
    monkeypatch.setattr("httpx.AsyncClient", _FakeAsyncClient)
    _FakeAsyncClient.calls = []
    return TestClient(main.app)


def _rpc(method, params=None):
    return {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or []}


# ── allowed methods forward ───────────────────────────────────────────────────

def test_allowed_method_is_forwarded(client):
    body = _rpc("getLatestBlockhash", [{"commitment": "confirmed"}])
    r = client.post("/api/rpc/solana", json=body)
    assert r.status_code == 200
    assert r.content == UPSTREAM_RESULT
    assert _FakeAsyncClient.calls == [{"url": "http://rpc.test", "json": body}]


@pytest.mark.parametrize("method", CHECKOUT_METHODS)
def test_every_checkout_method_is_forwarded(client, method):
    r = client.post("/api/rpc/solana", json=_rpc(method))
    assert r.status_code == 200
    assert len(_FakeAsyncClient.calls) == 1


# ── everything else is rejected before the upstream is contacted ──────────────

@pytest.mark.parametrize("method", [
    "getProgramAccounts",       # the classic quota-drain query
    "sendTransaction",          # wallets submit transactions themselves
    "getSignaturesForAddress",  # only the backend verifier uses this, server-side
    "getAsset",                 # Helius DAS API
])
def test_method_outside_allowlist_is_rejected(client, method):
    r = client.post("/api/rpc/solana", json=_rpc(method))
    assert r.status_code == 403
    assert _FakeAsyncClient.calls == []


def test_batch_request_is_rejected_even_with_allowed_methods(client):
    r = client.post("/api/rpc/solana", json=[_rpc("getBalance"), _rpc("getBlockHeight")])
    assert r.status_code == 400
    assert _FakeAsyncClient.calls == []


def test_missing_method_is_rejected(client):
    r = client.post("/api/rpc/solana", json={"jsonrpc": "2.0", "id": 1})
    assert r.status_code == 400
    assert _FakeAsyncClient.calls == []


def test_non_string_method_is_rejected(client):
    body = _rpc("getBalance")
    body["method"] = 42
    r = client.post("/api/rpc/solana", json=body)
    assert r.status_code == 400
    assert _FakeAsyncClient.calls == []


def test_malformed_json_is_rejected(client):
    r = client.post(
        "/api/rpc/solana",
        content=b"not json at all",
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 400
    assert _FakeAsyncClient.calls == []


# ── size cap ──────────────────────────────────────────────────────────────────

def test_oversized_body_is_rejected(client):
    # An allowed method carrying a padded payload well past the 16 KB cap.
    body = _rpc("simulateTransaction", ["A" * (2 * main.SOLANA_RPC_MAX_BODY_BYTES)])
    r = client.post("/api/rpc/solana", json=body)
    assert r.status_code == 413
    assert _FakeAsyncClient.calls == []


def test_body_just_under_cap_is_forwarded(client):
    padding = "A" * (main.SOLANA_RPC_MAX_BODY_BYTES - 200)
    r = client.post("/api/rpc/solana", json=_rpc("simulateTransaction", [padding]))
    assert r.status_code == 200
    assert len(_FakeAsyncClient.calls) == 1
