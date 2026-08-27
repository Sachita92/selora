"""Tests for POST /api/checkout/{reference}/email and the emails module.

The receipt page offers an optional email capture after payment confirms. The
endpoint is unauthenticated and sends mail, so it validates the address, only
accepts PAID orders, is rate limited per IP and per order reference, and stores
the address on the order row (migration 019) for future fulfilment notices.

Two invariants have teeth here:
  * A send failure is NOT an endpoint failure — the address is stored and the
    buyer keeps the on-screen receipt (success: true, sent: false).
  * buyer_email is buyer PII: it must never appear in the buyer-facing order
    routes (the by-wallet lookup, verify).

Hermetic: supabase_admin is a table-routing fake, emails.send_email is stubbed
(no Resend calls), and the rate limiter's rate_limit_hit RPC is served by the
same fake. No network.
"""
import types

import pytest
from fastapi.testclient import TestClient

import emails as emails_mod
import main

STORE = "store-1"
HANDLE = "wovencloth"
REF = "RefKey11111111111111111111111111111111111111"
ORDER_ID = "11111111-2222-3333-4444-555555555555"
BUYER_EMAIL = "buyer@example.com"


# ── fakes ─────────────────────────────────────────────────────────────────────

class _FakeQuery:
    def __init__(self, db, table):
        self._db, self._table, self._op = db, table, "select"
        self._payload = None
        self._filters = []

    def select(self, *a, **kw):
        self._op = "select"
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def eq(self, col, val):
        self._filters.append((col, val))
        return self

    def order(self, *a, **kw):
        return self

    def in_(self, *a, **kw):
        return self

    def execute(self):
        rows = list(self._db.rows.get(self._table, []))
        for col, val in self._filters:
            rows = [r for r in rows if r.get(col) == val]
        if self._op == "update":
            for r in rows:
                r.update(self._payload)
            self._db.updates.append((self._table, dict(self._payload)))
            return types.SimpleNamespace(data=[dict(r) for r in rows])
        return types.SimpleNamespace(data=[dict(r) for r in rows])


class _FakeDb:
    def __init__(self, orders):
        self.rows = {
            "selora_orders": orders if isinstance(orders, list) else [orders],
            "selora_stores": [{"id": STORE, "user_id": "u1", "name": "Woven Cloth",
                               "handle": HANDLE}],
        }
        self.updates = []
        self.counters = {}

    def table(self, name):
        return _FakeQuery(self, name)

    def rpc(self, fn, params):
        db = self

        def execute():
            assert fn == "rate_limit_hit"
            key = params["p_key"]
            db.counters[key] = db.counters.get(key, 0) + 1
            return types.SimpleNamespace(data=db.counters[key])

        return types.SimpleNamespace(execute=execute)


def _order(status="paid", buyer_email=None, reference=REF, order_id=ORDER_ID):
    return {
        "id": order_id, "store_id": STORE, "reference": reference, "status": status,
        "total_usd": 42.50, "buyer_wallet": "BuyRk2mVpL9wQe5tZxC7nD4fG8hJ3aS6uMyEbNcPdWo",
        "buyer_email": buyer_email, "signature": "sig-1",
        "items": [{"product_id": "p1", "title": "Linen Scarf", "quantity": 2, "price": 21.25}],
        "created_at": "2026-08-24T10:00:00+00:00",
    }


@pytest.fixture
def sent(monkeypatch):
    """Captures send_email calls; returns the list of (to, subject, ref, sender)."""
    calls = []

    def _fake_send(to, subject, html, ref="", sender=""):
        calls.append({"to": to, "subject": subject, "html": html, "ref": ref,
                      "sender": sender})
        return True

    monkeypatch.setattr("emails.send_email", _fake_send)
    return calls


@pytest.fixture
def client():
    return TestClient(main.app)


def _wire(monkeypatch, orders):
    db = _FakeDb(orders)
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    monkeypatch.setenv("FRONTEND_URL", "https://selora.fashion")
    return db


def _post(client, email=BUYER_EMAIL, reference=REF):
    return client.post(f"/api/checkout/{reference}/email", json={"email": email})


# ── happy path ────────────────────────────────────────────────────────────────

def test_paid_order_stores_email_and_sends_receipt(client, monkeypatch, sent):
    db = _wire(monkeypatch, _order())
    r = _post(client)
    assert r.status_code == 200
    assert r.json() == {"success": True, "sent": True}
    # Stored on the order row for future fulfilment notices.
    assert db.rows["selora_orders"][0]["buyer_email"] == BUYER_EMAIL
    assert db.updates == [("selora_orders", {"buyer_email": BUYER_EMAIL})]
    # Sent to the submitted address, and logged by order id — never by address.
    assert len(sent) == 1
    assert sent[0]["to"] == BUYER_EMAIL
    assert BUYER_EMAIL not in sent[0]["ref"]
    assert ORDER_ID[:8] in sent[0]["ref"]
    # No per-template sender: receipts resolve EMAIL_FROM inside send_email
    # (the welcome mail's EMAIL_FROM_WELCOME must not leak in here).
    assert sent[0]["sender"] == ""


def test_receipt_contains_items_total_and_durable_link(client, monkeypatch, sent):
    _wire(monkeypatch, _order())
    _post(client)
    html = sent[0]["html"]
    assert "Woven Cloth" in sent[0]["subject"] and ORDER_ID[:8] in sent[0]["subject"]
    assert "Linen Scarf" in html
    assert "42.50 USDC" in html                       # total paid
    assert f"https://selora.fashion/store/{HANDLE}/checkout/{REF}" in html


def test_email_is_trimmed_before_storing(client, monkeypatch, sent):
    db = _wire(monkeypatch, _order())
    r = _post(client, email=f"  {BUYER_EMAIL} ")
    assert r.status_code == 200
    assert db.rows["selora_orders"][0]["buyer_email"] == BUYER_EMAIL


# ── validation ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("bad", [
    "", "   ", "not-an-email", "no@domain", "@example.com", "two@@example.com",
    "spaces in@example.com", "trailing@example.com ex", "x@y.z@w.com",
])
def test_bad_email_formats_rejected(client, monkeypatch, sent, bad):
    db = _wire(monkeypatch, _order())
    r = _post(client, email=bad)
    assert r.status_code == 400
    assert db.updates == [] and sent == []


def test_overlong_email_rejected(client, monkeypatch, sent):
    db = _wire(monkeypatch, _order())
    r = _post(client, email="a" * 250 + "@example.com")
    assert r.status_code == 400
    assert db.updates == [] and sent == []


def test_unknown_reference_rejected(client, monkeypatch, sent):
    db = _wire(monkeypatch, _order())
    r = _post(client, reference="NoSuchReference1111111111111111111111111111")
    assert r.status_code == 404
    assert db.updates == [] and sent == []


@pytest.mark.parametrize("status", ["pending", "failed", "expired"])
def test_unpaid_order_rejected(client, monkeypatch, sent, status):
    db = _wire(monkeypatch, _order(status=status))
    r = _post(client)
    assert r.status_code == 400
    assert "not confirmed yet" in r.json()["detail"]
    assert db.updates == [] and sent == []


# ── rate limiting ─────────────────────────────────────────────────────────────

def test_per_ip_rate_limit_enforced(client, monkeypatch, sent):
    # 10 per hour per IP, counted across orders — one caller working through
    # many references (the per-reference limit alone would not stop that).
    refs = [f"Ref{i}Key1111111111111111111111111111111111" for i in range(11)]
    _wire(monkeypatch, [_order(reference=ref, order_id=f"order-{i}")
                        for i, ref in enumerate(refs)])
    for ref in refs[:10]:
        assert _post(client, reference=ref).status_code == 200
    assert _post(client, reference=refs[10]).status_code == 429
    assert len(sent) == 10


def test_per_reference_rate_limit_enforced(client, monkeypatch, sent):
    # 5 per hour for one order reference, so a single order cannot be used to
    # mail-bomb an address from rotating IPs. Vary the client IP per call.
    db = _wire(monkeypatch, _order())
    ip = {"n": 0}

    def _rotating_ip(request):
        ip["n"] += 1
        return f"10.0.0.{ip['n']}"

    monkeypatch.setattr(main, "_client_ip", _rotating_ip)
    for _ in range(5):
        assert _post(client).status_code == 200
    assert _post(client).status_code == 429
    assert len(sent) == 5
    assert any(k.startswith(f"checkout_email_order:{REF}:") for k in db.counters)


# ── send failure must not break the order or the endpoint ─────────────────────

def test_send_failure_still_stores_email_and_succeeds(client, monkeypatch):
    db = _wire(monkeypatch, _order())
    monkeypatch.setattr("emails.send_email", lambda *a, **kw: False)
    r = _post(client)
    assert r.status_code == 200
    assert r.json() == {"success": True, "sent": False}
    # Address stored; order state untouched.
    assert db.rows["selora_orders"][0]["buyer_email"] == BUYER_EMAIL
    assert db.rows["selora_orders"][0]["status"] == "paid"
    assert db.rows["selora_orders"][0]["signature"] == "sig-1"


def test_send_exception_does_not_reach_the_caller(client, monkeypatch):
    # send_email swallows its own failures, but belt-and-braces: even a raising
    # transport inside it must not turn into a 500 for the buyer.
    db = _wire(monkeypatch, _order())

    def _boom(*a, **kw):
        raise RuntimeError("resend exploded")

    monkeypatch.setattr("httpx.post", _boom)
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    r = _post(client)
    assert r.status_code == 200
    assert r.json() == {"success": True, "sent": False}
    assert db.rows["selora_orders"][0]["buyer_email"] == BUYER_EMAIL


# ── the emails module itself ──────────────────────────────────────────────────

def test_send_email_skips_cleanly_without_api_key(monkeypatch, capsys):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.setattr(emails_mod, "_missing_key_logged", False)

    def _should_not_be_called(*a, **kw):
        raise AssertionError("no HTTP call may happen without an API key")

    monkeypatch.setattr("httpx.post", _should_not_be_called)
    assert emails_mod.send_email("x@example.com", "s", "<p>h</p>", ref="order abc") is False
    # Logged once per process, not once per order.
    assert emails_mod.send_email("x@example.com", "s", "<p>h</p>") is False
    assert capsys.readouterr().out.count("RESEND_API_KEY is not set") == 1


def test_send_email_posts_resend_request_shape(monkeypatch):
    captured = {}

    def _fake_post(url, headers=None, json=None, timeout=None):
        captured.update(url=url, headers=headers, json=json, timeout=timeout)
        return types.SimpleNamespace(status_code=200, text='{"id":"abc"}')

    monkeypatch.setattr("httpx.post", _fake_post)
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    monkeypatch.delenv("EMAIL_FROM", raising=False)

    assert emails_mod.send_email(BUYER_EMAIL, "Subject", "<p>hi</p>", ref="order abc") is True
    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"]["Authorization"] == "Bearer re_test_key"
    assert captured["json"] == {
        "from": "Selora <onboarding@resend.dev>",   # Resend's test sender by default
        "to": [BUYER_EMAIL],                        # array form
        "subject": "Subject",
        "html": "<p>hi</p>",
    }


def test_email_from_is_env_overridable(monkeypatch):
    monkeypatch.setenv("EMAIL_FROM", "Selora <orders@selora.fashion>")
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    captured = {}
    monkeypatch.setattr("httpx.post", lambda url, headers=None, json=None, timeout=None: (
        captured.update(json=json), types.SimpleNamespace(status_code=200, text="{}"))[1])
    emails_mod.send_email(BUYER_EMAIL, "s", "<p>h</p>")
    assert captured["json"]["from"] == "Selora <orders@selora.fashion>"


def test_non_2xx_from_resend_returns_false(monkeypatch, capsys):
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    monkeypatch.setattr("httpx.post", lambda *a, **kw: types.SimpleNamespace(
        status_code=422, text='{"message":"invalid"}'))
    assert emails_mod.send_email(BUYER_EMAIL, "s", "<p>h</p>", ref="order abc") is False
    out = capsys.readouterr().out
    assert "422" in out
    assert BUYER_EMAIL not in out          # address never logged


def test_receipt_escapes_store_and_product_names():
    subject, html = emails_mod.render_order_receipt(
        store_name="Woven & Co",
        order_id=ORDER_ID,
        items=[{"title": '<script>alert(1)</script>', "quantity": 1, "price": 5.0}],
        total_usd=5.0,
        order_url="https://selora.fashion/store/x/checkout/y",
    )
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "Woven &amp; Co" in html


def test_receipt_renders_without_items():
    _, html = emails_mod.render_order_receipt(
        store_name="Woven Cloth", order_id=ORDER_ID, items=[], total_usd=10.0,
        order_url="https://selora.fashion/store/x/checkout/y",
    )
    assert "10.00 USDC" in html
