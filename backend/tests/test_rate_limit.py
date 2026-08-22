"""Tests for the Supabase-backed rate limiter (migration 015).

The two in-memory limiter dicts reset on every deploy and Render free-tier
spin-down, so limits were close to decorative. Counters now live in the
rate_limit_counters table, incremented through the atomic rate_limit_hit()
SQL function — a single INSERT ... ON CONFLICT DO UPDATE ... RETURNING, so
concurrent hits serialize on the row lock. The fake here models that
serialization with a threading.Lock; the helper's job is to turn each
post-increment count into exactly `limit` allowed passes.

DB errors fail OPEN by design (Supabase TLS timeouts are a known reality on
this project) — covered below.

Hermetic: database.supabase_admin is replaced with a recording fake. No
network.
"""
import threading
import time
import types
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

import main


class _FakeCounters:
    """Stands in for the service-role client's rpc('rate_limit_hit', ...).

    The lock models Postgres serializing concurrent upserts on the row lock:
    every caller sees a distinct post-increment count.
    """

    def __init__(self):
        self.counts = {}
        self.lock = threading.Lock()
        self.fail = False

    def rpc(self, fn, params):
        assert fn == "rate_limit_hit"
        key = params["p_key"]

        def execute():
            if self.fail:
                raise RuntimeError("TLS handshake timeout")
            with self.lock:
                self.counts[key] = self.counts.get(key, 0) + 1
                return types.SimpleNamespace(data=self.counts[key])

        return types.SimpleNamespace(execute=execute)


@pytest.fixture
def counters(monkeypatch):
    fake = _FakeCounters()
    monkeypatch.setattr("database.supabase_admin", lambda: fake)
    return fake


# ── helper semantics ──────────────────────────────────────────────────────────

def test_under_the_limit_allowed(counters):
    for _ in range(5):
        assert main._rate_limit_exceeded("t", "ip-1", 5, 3600) is False


def test_at_the_limit_rejected(counters):
    for _ in range(5):
        assert main._rate_limit_exceeded("t", "ip-1", 5, 3600) is False
    assert main._rate_limit_exceeded("t", "ip-1", 5, 3600) is True


def test_identities_do_not_share_buckets(counters):
    for _ in range(6):
        main._rate_limit_exceeded("t", "ip-1", 5, 3600)
    assert main._rate_limit_exceeded("t", "ip-2", 5, 3600) is False


def test_window_expiry_allows_again(counters, monkeypatch):
    t = [1_000_000.0]
    monkeypatch.setattr(time, "time", lambda: t[0])
    for _ in range(3):
        assert main._rate_limit_exceeded("w", "ip-1", 3, 60) is False
    assert main._rate_limit_exceeded("w", "ip-1", 3, 60) is True
    t[0] += 61  # next fixed window → fresh bucket key → fresh row
    assert main._rate_limit_exceeded("w", "ip-1", 3, 60) is False


def test_concurrent_requests_at_boundary(counters):
    # 20 threads race one bucket with limit 5: because each hit gets a
    # distinct serialized count, exactly 5 pass — never 6.
    with ThreadPoolExecutor(max_workers=20) as ex:
        results = list(ex.map(
            lambda _: main._rate_limit_exceeded("c", "ip-1", 5, 3600), range(20)
        ))
    assert results.count(False) == 5
    assert results.count(True) == 15


def test_db_error_fails_open(counters):
    counters.fail = True
    assert main._rate_limit_exceeded("t", "ip-1", 1, 3600) is False
    assert main._rate_limit_exceeded("t", "ip-1", 1, 3600) is False


def test_enforce_raises_429(counters):
    main._enforce_rate_limit("e", "ip-1", 1, 3600)
    with pytest.raises(Exception) as exc:
        main._enforce_rate_limit("e", "ip-1", 1, 3600)
    assert exc.value.status_code == 429


# ── through a real endpoint ───────────────────────────────────────────────────

TICKET = {"name": "A", "email": "a@x.test", "subject": "hi", "message": "help"}


@pytest.fixture
def client(counters, monkeypatch):
    monkeypatch.setattr("database.save_support_ticket", lambda d: {"id": "t1", **d})
    return TestClient(main.app)


def test_support_under_limit_allowed(client):
    for _ in range(5):
        r = client.post("/api/support", json=TICKET)
        assert r.status_code == 200


def test_support_over_limit_rejected_with_429(client):
    for _ in range(5):
        client.post("/api/support", json=TICKET)
    r = client.post("/api/support", json=TICKET)
    assert r.status_code == 429


def test_support_db_error_fails_open(client, counters):
    counters.fail = True
    for _ in range(8):
        assert client.post("/api/support", json=TICKET).status_code == 200


# ── guest chat keeps its 200 chat-message shape when limited ──────────────────

def test_guest_chat_limit_returns_friendly_message(counters, monkeypatch):
    store = {"id": "demo-1", "shop_name": "Demo", "user_id": "owner"}
    monkeypatch.setattr("database.get_store_by_id", lambda sid: store)
    monkeypatch.setattr("database.get_demo_store_ids", lambda: ["demo-1"])

    # The guest branch also counts session messages via supabase_admin();
    # extend the counters fake with the table interface it expects.
    def table(name):
        q = types.SimpleNamespace()
        q.select = lambda *a, **kw: q
        q.eq = lambda *a, **kw: q
        q.execute = lambda: types.SimpleNamespace(count=0, data=[])
        return q

    fake = counters
    fake.table = table

    client = TestClient(main.app)
    body = {"message": "hi", "session_id": "s-1", "is_guest": True}

    # Pre-fill this IP's bucket to the 15/hour threshold, as if 15 guest
    # requests had already landed in this window.
    with fake.lock:
        fake.counts[f"guest_chat:testclient:{int(time.time() // 3600)}"] = 15

    r = client.post("/api/chat/demo-1", json=body)
    assert r.status_code == 200
    assert r.json()["actions"] == []
    assert "try again in a bit" in r.json()["response"]
