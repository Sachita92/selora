import os
import hmac
import hashlib
import secrets
import requests
from urllib.parse import urlencode, parse_qs, urlparse
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

SHOPIFY_API_KEY    = os.getenv("SHOPIFY_API_KEY")
SHOPIFY_API_SECRET = os.getenv("SHOPIFY_API_SECRET")
APP_URL            = os.getenv("SHOPIFY_APP_URL", "https://selora.fashion")
REDIRECT_URI       = f"{APP_URL}/auth/callback"

# Scopes we need — must match what you configured in Shopify Dev Dashboard
SCOPES = ",".join([
    "read_products",
    "write_products",
    "read_orders",
    "read_inventory",
    "write_inventory",
    "read_price_rules",
    "write_price_rules",
    "read_analytics",
    "read_customers",
    "read_fulfillments",
    "read_marketing_events",
    "write_marketing_events",
])


def build_install_url(shop: str) -> str:
    """
    Build the Shopify OAuth install URL.
    Redirects the seller to Shopify's permission screen.

    shop: the myshopify.com domain e.g. "selora-test.myshopify.com"
    """
    if not shop.endswith(".myshopify.com"):
        shop = f"{shop}.myshopify.com"

    state = secrets.token_hex(16)  # CSRF protection token

    params = {
        "client_id": SHOPIFY_API_KEY,
        "scope": SCOPES,
        "redirect_uri": REDIRECT_URI,
        "state": state,
    }

    url = f"https://{shop}/admin/oauth/authorize?{urlencode(params)}"
    return url, state


import base64

def verify_hmac(params: dict, hmac_value: str) -> bool:
    """
    Verify that the callback came from Shopify (not a fake request).
    Shopify signs the callback with our API secret.
    """
    # Remove hmac and signature from params before calculating
    params_without_hmac = {k: v for k, v in params.items() if k not in ("hmac", "signature")}
    sorted_params = "&".join(f"{k}={v}" for k, v in sorted(params_without_hmac.items()))

    digest = hmac.new(
        SHOPIFY_API_SECRET.encode("utf-8"),
        sorted_params.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(digest, hmac_value)


def verify_webhook_hmac(raw_body: bytes, hmac_header: str) -> bool:
    """
    Verify that a webhook request came from Shopify.
    Shopify hashes the raw request body with our API secret and base64 encodes it.
    """
    if not hmac_header:
        return False
    webhook_secret = os.getenv("SHOPIFY_WEBHOOK_SECRET") or SHOPIFY_API_SECRET
    if not webhook_secret:
        return False

    digest = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).digest()

    calculated_hmac = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(calculated_hmac, hmac_header)


def exchange_code_for_token(shop: str, code: str) -> str:
    """
    Exchange the authorization code for a permanent access token.
    This is the final step of OAuth.
    """
    url = f"https://{shop}/admin/oauth/access_token"
    payload = {
        "client_id": SHOPIFY_API_KEY,
        "client_secret": SHOPIFY_API_SECRET,
        "code": code,
    }

    response = requests.post(url, json=payload)
    response.raise_for_status()
    data = response.json()

    access_token = data.get("access_token")
    if not access_token:
        raise ValueError(f"No access token in response: {data}")

    print(f"✓ Got access token for {shop}")
    return access_token


def get_shop_info(shop: str, access_token: str) -> dict:
    """Fetch basic shop info using the access token."""
    url = f"https://{shop}/admin/api/2024-01/shop.json"
    headers = {"X-Shopify-Access-Token": access_token}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json().get("shop", {})