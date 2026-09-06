"""Transactional email through Resend's HTTP API.

Foundation module: send_email() is the single send path, and each message type
gets a render_* function returning (subject, html) plus its own from-address
(receipts: EMAIL_FROM / orders@; welcome: EMAIL_FROM_WELCOME / hello@). The
order receipt is the first; welcome/login/fulfilment mails reuse send_email.

Two rules hold everywhere in here:

  * A send NEVER breaks the calling flow. Every failure — missing API key,
    network error, non-2xx from Resend — is logged and returned as False. An
    email is a courtesy; the order confirms identically without it.
  * Recipient addresses are never logged. Callers pass an order id (or similar
    non-PII handle) as ``ref`` and that is what appears in the logs.

Plain httpx against https://api.resend.com/emails (POST, Bearer auth, JSON
{from, to, subject, html}) — no SDK dependency, matching how the rest of the
backend talks to third-party HTTP APIs.
"""
import html as _html
import os

RESEND_API_URL = "https://api.resend.com/emails"
DEFAULT_EMAIL_FROM = "Selora <onboarding@resend.dev>"
DEFAULT_EMAIL_FROM_WELCOME = "Selora <hello@selora.fashion>"
SEND_TIMEOUT_SECONDS = 10.0
# Email clients need an absolute image URL. 360px source shown at 120px (3x).
EMAIL_LOGO_URL = "https://selora.fashion/brand/email-logo.png"

_missing_key_logged = False


def _email_from() -> str:
    """Transactional sender (order receipts). Defaults to Resend's test sender,
    which delivers with no DNS setup; switching to a selora.fashion address is
    an env-var change."""
    return os.getenv("EMAIL_FROM", "").strip() or DEFAULT_EMAIL_FROM


def _welcome_email_from() -> str:
    """Welcome sender: hello@ voice rather than orders@. Its default assumes
    the verified selora.fashion domain (unlike EMAIL_FROM's resend.dev
    fallback) — any address on a verified domain is accepted by Resend."""
    return os.getenv("EMAIL_FROM_WELCOME", "").strip() or DEFAULT_EMAIL_FROM_WELCOME


def send_email(to: str, subject: str, html: str, ref: str = "", sender: str = "") -> bool:
    """Send one HTML email. Returns True only on a 2xx from Resend.

    Never raises: callers can treat the return value as advisory. ``ref`` is a
    non-PII label (an order id) used in log lines instead of the address.
    ``sender`` overrides the from-address per message type; empty falls back
    to EMAIL_FROM, so existing callers are unchanged.
    """
    global _missing_key_logged
    import httpx

    tag = f" [{ref}]" if ref else ""

    api_key = os.getenv("RESEND_API_KEY", "").strip()
    if not api_key:
        if not _missing_key_logged:
            _missing_key_logged = True
            print("ℹ️ RESEND_API_KEY is not set — transactional email is disabled; skipping sends.")
        return False

    try:
        res = httpx.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": sender or _email_from(),
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=SEND_TIMEOUT_SECONDS,
        )
    except Exception as e:
        print(f"⚠️ Email send failed{tag}: {type(e).__name__}: {e}")
        return False

    if res.status_code // 100 != 2:
        # Resend puts the reason in the body; it carries no recipient address.
        body = (res.text or "")[:300]
        print(f"⚠️ Email send rejected{tag}: HTTP {res.status_code} {body}")
        return False

    print(f"✉️ Email sent{tag}: {subject}")
    return True


# ─── Templates ────────────────────────────────────────────────────────────────
# Inline styles only, table-free where possible, no modern CSS: email clients
# (Outlook especially) drop <style> blocks, flexbox and grid. Plain and
# readable beats clever.

_TEXT = "#3D362B"
_MUTED = "#8A8072"
_ACCENT = "#B08968"
_BORDER = "#E4DCD0"
_SURFACE = "#F6F1E8"


def _esc(value) -> str:
    """Escape untrusted text (store names, product titles) for HTML."""
    return _html.escape(str(value if value is not None else ""), quote=True)


def _money(value) -> str:
    try:
        return f"{float(value):.2f}"
    except (TypeError, ValueError):
        return "—"


# The Privy bridge stores {wallet}@selora.io placeholder addresses for
# wallet-only users (main.py privy-sync). They are not deliverable.
SYNTHETIC_EMAIL_DOMAIN = "@selora.io"

def send_welcome_email(user: dict) -> bool:
    """Send the one-time welcome email for a JUST-CREATED users row.

    Call sites are the create branches only (get_or_create_user_by_auth and
    the Privy sync bridge) — returning logins never reach this. Guarantees:

      * At-most-once: users.welcome_email_sent_at (migration 020) is claimed
        atomically (NULL -> now) BEFORE sending, so the loser of a concurrent
        double-create matches zero rows and sends nothing. A failed send then
        RELEASES the claim (back to NULL): the flag only ever means "Resend
        accepted a send", never "a send was attempted", and a later attempt
        can still welcome the user. Releasing is safe against the concurrent
        loser — it already returned at claim time and never retries.
      * Synthetic wallet-placeholder addresses ({wallet}@selora.io) are
        skipped with a log line — sending to them is a guaranteed bounce.
        Their claim stays NULL, so a future real-email link could still
        welcome them.
      * Never raises, and logs by user-id prefix only: signup completes
        identically whether or not this sends.
    """
    from datetime import datetime, timezone

    user_id = str((user or {}).get("id") or "")
    ref = f"user {user_id[:8]} welcome"
    try:
        email = str((user or {}).get("email") or "").strip()
        if not user_id or not email or email.lower().endswith(SYNTHETIC_EMAIL_DOMAIN):
            print(f"ℹ️ Welcome email skipped [{ref}]: no real email address")
            return False

        subject, html = render_welcome(user.get("display_name"))

        from database import supabase_admin
        claim = (
            supabase_admin().table("users")
            .update({"welcome_email_sent_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", user_id)
            .is_("welcome_email_sent_at", "null")
            .execute()
        )
        if not claim.data:
            return False   # already claimed — a concurrent create fired first

        sent = send_email(email, subject, html, ref=ref, sender=_welcome_email_from())
        if not sent:
            # Release the claim so the flag stays a "sent" marker, not an
            # "attempted" marker — otherwise a rejected send permanently
            # records the user as welcomed with only a long-gone log line
            # to say otherwise.
            supabase_admin().table("users").update(
                {"welcome_email_sent_at": None}
            ).eq("id", user_id).execute()
        return sent
    except Exception as e:
        print(f"⚠️ Welcome email hook failed [{ref}]: {type(e).__name__}: {e}")
        return False


def render_welcome(user_name=None) -> tuple[str, str]:
    """Build (subject, html) for the one-time welcome email.

    ``user_name`` personalises the greeting when a display name is known at
    signup; None (the common case — web2 rows are created with id+email only)
    falls back to a plain welcome.
    """
    subject = "Welcome to Selora"
    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    dashboard_url = f"{frontend}/dashboard"
    name = str(user_name).strip() if user_name else ""
    greeting = f"Welcome, {_esc(name)}" if name else "Welcome to Selora"

    html = f"""\
<div style="margin:0;padding:24px 12px;background:{_SURFACE};">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid {_BORDER};border-radius:12px;padding:28px 24px;font-family:Helvetica,Arial,sans-serif;">
    <img src="{EMAIL_LOGO_URL}" width="120" alt="Selora" style="display:block;width:120px;height:auto;margin:0 0 20px;border:0;" />
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;color:{_TEXT};">{greeting}</h1>

    <p style="margin:0 0 20px;font-size:14px;color:{_TEXT};line-height:1.6;">
      You're in. Selora is your store's quiet co-pilot — it watches what sells,
      tidies your product listings, and keeps your storefront looking sharp
      while you stay focused on the products themselves.
    </p>

    <p style="margin:0 0 20px;font-size:14px;color:{_TEXT};line-height:1.6;">
      First step: connect your Shopify store, or create a Selora storefront
      from scratch — either way, Selora gets to work.
    </p>

    <p style="margin:0;">
      <a href="{_esc(dashboard_url)}" style="display:inline-block;background:{_ACCENT};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:8px;">Open your dashboard</a>
    </p>

    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid {_BORDER};font-size:12px;color:{_MUTED};line-height:1.5;">
      This is a one-time note sent because a Selora account was just created with this address.
    </p>
  </div>
</div>"""
    return subject, html


def render_order_receipt(store_name: str, order_id: str, items: list,
                         total_usd, order_url: str) -> tuple[str, str]:
    """Build (subject, html) for a buyer's order receipt.

    ``items`` are the order's stored line items: dicts with title, quantity and
    price. ``order_url`` is the durable /store/{handle}/checkout/{reference}
    link — the same page the buyer just saw, which re-verifies on load.
    """
    short_id = (order_id or "")[:8]
    store = _esc(store_name or "the store")

    rows = []
    for item in (items or []):
        title = _esc(item.get("title") or "Item")
        qty = item.get("quantity", 1)
        try:
            line_total = float(item.get("price", 0)) * int(qty)
        except (TypeError, ValueError):
            line_total = 0.0
        rows.append(
            f'<tr>'
            f'<td style="padding:8px 0;border-bottom:1px solid {_BORDER};'
            f'font-size:14px;color:{_TEXT};">{title} '
            f'<span style="color:{_MUTED};">&times;{_esc(qty)}</span></td>'
            f'<td style="padding:8px 0;border-bottom:1px solid {_BORDER};'
            f'font-size:14px;color:{_TEXT};text-align:right;white-space:nowrap;">'
            f'{_money(line_total)} USDC</td>'
            f'</tr>'
        )
    if not rows:
        rows.append(
            f'<tr><td colspan="2" style="padding:8px 0;font-size:14px;'
            f'color:{_MUTED};">Order items are on your order page.</td></tr>'
        )

    subject = f"Your {store_name or 'Selora'} order #{short_id}"
    html = f"""\
<div style="margin:0;padding:24px 12px;background:{_SURFACE};">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid {_BORDER};border-radius:12px;padding:28px 24px;font-family:Helvetica,Arial,sans-serif;">
    <img src="{EMAIL_LOGO_URL}" width="120" alt="Selora" style="display:block;width:120px;height:auto;margin:0 0 20px;border:0;" />
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:normal;color:{_TEXT};">Payment received</h1>
    <p style="margin:0 0 20px;font-size:14px;color:{_MUTED};">Thanks for your order at {store}.</p>

    <p style="margin:0 0 4px;font-size:13px;color:{_MUTED};">Order</p>
    <p style="margin:0 0 20px;font-size:15px;color:{_TEXT};font-family:monospace;">#{_esc(short_id)}</p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 4px;">
      {''.join(rows)}
      <tr>
        <td style="padding:12px 0 0;font-size:15px;font-weight:bold;color:{_TEXT};">Total paid</td>
        <td style="padding:12px 0 0;font-size:15px;font-weight:bold;color:{_TEXT};text-align:right;white-space:nowrap;">{_money(total_usd)} USDC</td>
      </tr>
    </table>

    <p style="margin:24px 0 0;">
      <a href="{_esc(order_url)}" style="display:inline-block;background:{_ACCENT};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:8px;">View your order</a>
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:{_MUTED};line-height:1.5;">
      Or open this link any time:<br />
      <a href="{_esc(order_url)}" style="color:{_ACCENT};">{_esc(order_url)}</a>
    </p>

    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid {_BORDER};font-size:12px;color:{_MUTED};line-height:1.5;">
      The seller has your order and will start preparing it. Devnet demo — no real funds moved.
    </p>
  </div>
</div>"""
    return subject, html
