"""Tests for the one-time welcome email on user creation.

The users row is created server-side in exactly two live places: the create
branch of get_or_create_user_by_auth (first authed backend touch for web2 /
Google signups, plus the Shopify OAuth callback) and the create branch of the
Privy sync bridge. Both call emails.send_welcome_email, which:

  * fires on the CREATE branch only — returning logins send nothing;
  * atomically claims users.welcome_email_sent_at (migration 020, NULL -> now)
    BEFORE sending, so a concurrent double-create sends at most once — and
    releases the claim on a failed send, so the flag only ever means "sent";
  * skips the Privy bridge's synthetic {wallet}@selora.io placeholders,
    with a log line and WITHOUT claiming (a future real-email link may still
    welcome them);
  * never raises and never logs the address — signup completes identically
    whether or not the send happens.

Hermetic: supabase_admin is a users-table fake that honors the is-null claim
filter, and emails.send_email is stubbed. No network.
"""
import types

import pytest

import database
import emails as emails_mod

USER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
EMAIL = "seller@example.com"
WALLET = "BuyRk2mVpL9wQe5tZxC7nD4fG8hJ3aS6uMyEbNcPdWo"


# ── fakes ─────────────────────────────────────────────────────────────────────

class _FakeQuery:
    def __init__(self, db, table):
        self._db, self._table = db, table
        self._op = "select"
        self._payload = None
        self._filters = []       # equality (col, val)
        self._null_filters = []  # cols that must be NULL to match

    def select(self, *a, **kw):
        self._op = "select"
        return self

    def insert(self, payload):
        self._op = "insert"
        self._payload = payload
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def eq(self, col, val):
        self._filters.append((col, val))
        return self

    def is_(self, col, val):
        assert val == "null"     # the only form the claim uses
        self._null_filters.append(col)
        return self

    def execute(self):
        rows = self._db.rows.setdefault(self._table, [])
        if self._op == "insert":
            row = dict(self._payload)
            rows.append(row)
            return types.SimpleNamespace(data=[dict(row)])
        matched = [
            r for r in rows
            if all(r.get(c) == v for c, v in self._filters)
            and all(r.get(c) is None for c in self._null_filters)
        ]
        if self._op == "update":
            for r in matched:
                r.update(self._payload)
            return types.SimpleNamespace(data=[dict(r) for r in matched])
        return types.SimpleNamespace(data=[dict(r) for r in matched])


class _FakeDb:
    def __init__(self, users=None):
        self.rows = {"users": [dict(r) for r in (users or [])]}

    def table(self, name):
        return _FakeQuery(self, name)


@pytest.fixture
def sent(monkeypatch):
    """Captures send_email calls; returns the list of {to, subject, ref, sender}."""
    calls = []

    def _fake_send(to, subject, html, ref="", sender=""):
        calls.append({"to": to, "subject": subject, "html": html, "ref": ref,
                      "sender": sender})
        return True

    monkeypatch.setattr("emails.send_email", _fake_send)
    return calls


def _wire(monkeypatch, users=None):
    db = _FakeDb(users)
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    return db


def _user_row(email=EMAIL, welcome=None):
    return {"id": USER_ID, "email": email, "welcome_email_sent_at": welcome}


# ── new user: exactly one send ────────────────────────────────────────────────

def test_new_user_gets_exactly_one_welcome(monkeypatch, sent):
    db = _wire(monkeypatch)                      # no users yet -> create branch
    user = database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert user["id"] == USER_ID and user["email"] == EMAIL
    assert len(sent) == 1
    assert sent[0]["to"] == EMAIL
    assert sent[0]["subject"] == "Welcome to Selora"
    # Logged by user-id prefix, never by address.
    assert USER_ID[:8] in sent[0]["ref"] and EMAIL not in sent[0]["ref"]
    # The claim landed on the row.
    assert db.rows["users"][0]["welcome_email_sent_at"] is not None


# ── returning login: zero sends ───────────────────────────────────────────────

def test_returning_login_sends_nothing(monkeypatch, sent):
    db = _wire(monkeypatch, users=[_user_row()])
    user = database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert user["id"] == USER_ID
    assert sent == []
    # Pre-existing (pre-migration) rows keep NULL: the claim only ever runs on
    # the create branch, so old users are never welcomed retroactively.
    assert db.rows["users"][0]["welcome_email_sent_at"] is None


def test_returning_login_with_changed_email_sends_nothing(monkeypatch, sent):
    _wire(monkeypatch, users=[_user_row(email="old@example.com")])
    user = database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert user["email"] == EMAIL              # email sync still happens
    assert sent == []


# ── synthetic / absent addresses: skipped, logged, unclaimed ──────────────────

@pytest.mark.parametrize("email", [
    f"{WALLET}@selora.io".lower(),   # Privy wallet-only placeholder
    "",                              # absent
    None,
])
def test_synthetic_or_absent_email_skipped_and_logged(monkeypatch, sent, capsys, email):
    db = _wire(monkeypatch, users=[_user_row(email=email)])
    assert emails_mod.send_welcome_email(db.rows["users"][0]) is False
    assert sent == []
    out = capsys.readouterr().out
    assert "Welcome email skipped" in out and USER_ID[:8] in out
    assert "@selora.io" not in out             # address never logged
    # Not claimed: a future real-email link could still be welcomed.
    assert db.rows["users"][0]["welcome_email_sent_at"] is None


# ── send failure never breaks signup ──────────────────────────────────────────

def test_send_failure_does_not_break_signup(monkeypatch):
    db = _wire(monkeypatch)
    monkeypatch.setattr("emails.send_email", lambda *a, **kw: False)
    user = database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert user and user["id"] == USER_ID
    # The claim is released on a failed send: the flag means "a send was
    # accepted by Resend", never "a send was attempted". Otherwise a rejected
    # send would permanently mark the user as welcomed.
    assert db.rows["users"][0]["welcome_email_sent_at"] is None


def test_failed_send_can_be_retried_later(monkeypatch, sent):
    # After a failed send released the claim, a later attempt (e.g. the row
    # being re-created in a clean re-test, or a future retry path) can still
    # claim and send.
    db = _wire(monkeypatch, users=[_user_row()])
    row = db.rows["users"][0]

    monkeypatch.setattr("emails.send_email", lambda *a, **kw: False)
    assert emails_mod.send_welcome_email(dict(row)) is False
    assert db.rows["users"][0]["welcome_email_sent_at"] is None

    def _ok(to, subject, html, ref="", sender=""):
        sent.append({"to": to, "subject": subject, "ref": ref, "sender": sender})
        return True

    monkeypatch.setattr("emails.send_email", _ok)
    assert emails_mod.send_welcome_email(dict(db.rows["users"][0])) is True
    assert db.rows["users"][0]["welcome_email_sent_at"] is not None
    assert len(sent) == 1

def test_send_exception_does_not_break_signup(monkeypatch):
    # send_email swallows its own failures, but belt-and-braces: even a raising
    # transport must not surface through the create path.
    _wire(monkeypatch)

    def _boom(*a, **kw):
        raise RuntimeError("resend exploded")

    monkeypatch.setattr("emails.send_email", _boom)
    user = database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert user and user["id"] == USER_ID


def test_claim_failure_does_not_break_signup(monkeypatch, sent):
    # Even the DB claim blowing up (e.g. pre-migration column missing) must
    # not break user creation — and must not send.
    db = _wire(monkeypatch)

    real_table = db.table

    def _table(name):
        q = real_table(name)
        real_update = q.update

        def _update(payload):
            if "welcome_email_sent_at" in payload:
                raise RuntimeError("column does not exist")
            return real_update(payload)

        q.update = _update
        return q

    db.table = _table
    user = database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert user and user["id"] == USER_ID
    assert sent == []


# ── concurrent double-fire: the atomic claim admits one send ──────────────────

def test_concurrent_double_fire_sends_once(monkeypatch, sent):
    # Models Postgres serializing the two claim UPDATEs on the row lock: the
    # second re-evaluates its is-null filter after the first commits and
    # matches zero rows (same argument as claim_and_fulfill_order).
    db = _wire(monkeypatch, users=[_user_row()])
    row = db.rows["users"][0]
    assert emails_mod.send_welcome_email(dict(row)) is True
    assert emails_mod.send_welcome_email(dict(row)) is False
    assert len(sent) == 1


# ── per-template sender ───────────────────────────────────────────────────────

def test_welcome_sends_from_welcome_sender_default(monkeypatch, sent):
    # No EMAIL_FROM_WELCOME set: the hello@ default, NOT the receipts sender.
    monkeypatch.delenv("EMAIL_FROM_WELCOME", raising=False)
    monkeypatch.setenv("EMAIL_FROM", "Selora <orders@selora.fashion>")
    _wire(monkeypatch)
    database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert len(sent) == 1
    assert sent[0]["sender"] == "Selora <hello@selora.fashion>"


def test_welcome_sender_is_env_overridable(monkeypatch, sent):
    monkeypatch.setenv("EMAIL_FROM_WELCOME", "Selora Team <team@selora.fashion>")
    _wire(monkeypatch)
    database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert len(sent) == 1
    assert sent[0]["sender"] == "Selora Team <team@selora.fashion>"


def test_send_email_resolves_welcome_sender_in_payload(monkeypatch):
    # End to end through send_email itself: the sender argument reaches the
    # Resend payload's "from", beating EMAIL_FROM.
    import types

    captured = {}
    monkeypatch.setattr("httpx.post", lambda url, headers=None, json=None, timeout=None: (
        captured.update(json=json), types.SimpleNamespace(status_code=200, text="{}"))[1])
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    monkeypatch.setenv("EMAIL_FROM", "Selora <orders@selora.fashion>")
    monkeypatch.delenv("EMAIL_FROM_WELCOME", raising=False)

    _wire(monkeypatch)
    database.get_or_create_user_by_auth(USER_ID, EMAIL)
    assert captured["json"]["from"] == "Selora <hello@selora.fashion>"


# ── the template ──────────────────────────────────────────────────────────────

def test_welcome_renders_dashboard_link_and_escapes_name(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://selora.fashion/")
    subject, html = emails_mod.render_welcome("<b>Ava</b>")
    assert subject == "Welcome to Selora"
    assert "https://selora.fashion/dashboard" in html
    assert "<b>Ava</b>" not in html and "&lt;b&gt;Ava&lt;/b&gt;" in html


def test_welcome_renders_without_name(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    subject, html = emails_mod.render_welcome(None)
    assert subject == "Welcome to Selora"
    assert "http://localhost:5173/dashboard" in html
