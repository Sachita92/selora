import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ─── Client ───────────────────────────────────────────────────────────────────

def get_client() -> Client:
    """Get a Supabase client using the service role key (bypasses RLS for backend use)."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")  # service role — never expose in frontend
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    return create_client(url, key)


# Singleton client — reuse across requests
_client: Client = None

def db() -> Client:
    global _client
    if _client is None:
        _client = get_client()
    return _client


# ─── Users ────────────────────────────────────────────────────────────────────

def get_or_create_user(email: str) -> dict:
    """Get a user by email, or create them if they don't exist."""
    client = db()

    # Try to find existing user
    result = client.table("users").select("*").eq("email", email).execute()
    if result.data:
        return result.data[0]

    # Create new user
    result = client.table("users").insert({"email": email}).execute()
    return result.data[0]


def get_user_by_id(user_id: str) -> dict:
    """Get a user by their UUID."""
    result = db().table("users").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None


# ─── Stores ───────────────────────────────────────────────────────────────────

def save_store(user_id: str, platform: str, shop_url: str, access_token: str, shop_name: str = None) -> dict:
    """
    Save a connected store to the database.
    If the store already exists for this user, update the access token.
    """
    client = db()

    # Check if store already connected
    existing = client.table("stores").select("*").eq("user_id", user_id).eq("shop_url", shop_url).execute()

    if existing.data:
        # Update existing store's token
        result = client.table("stores").update({
            "access_token": access_token,
            "shop_name": shop_name,
            "is_active": True,
        }).eq("id", existing.data[0]["id"]).execute()
        print(f"✓ Updated store: {shop_url}")
        return result.data[0]

    # Insert new store
    result = client.table("stores").insert({
        "user_id": user_id,
        "platform": platform,
        "shop_url": shop_url,
        "access_token": access_token,
        "shop_name": shop_name or shop_url,
        "is_active": True,
    }).execute()
    print(f"✓ Saved new store: {shop_url}")
    return result.data[0]


def get_stores_for_user(user_id: str) -> list:
    """Get all active stores for a user."""
    result = db().table("stores").select("*").eq("user_id", user_id).eq("is_active", True).execute()
    return result.data or []


def get_all_active_stores() -> list:
    """Get ALL active stores across all users — used by the agent scheduler."""
    result = db().table("stores").select("*").eq("is_active", True).execute()
    return result.data or []


def get_store_by_id(store_id: str) -> dict:
    """Get a single store by ID."""
    result = db().table("stores").select("*").eq("id", store_id).execute()
    return result.data[0] if result.data else None


def update_store_last_synced(store_id: str):
    """Update the last_synced_at timestamp for a store."""
    from datetime import datetime, timezone
    db().table("stores").update({
        "last_synced_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", store_id).execute()


# ─── Agent Logs ───────────────────────────────────────────────────────────────

def save_agent_log(store_id: str, action_type: str, product_id: str = None, reason: str = None, data: dict = None, success: bool = True):
    """Save a single agent action to the logs table."""
    db().table("agent_logs").insert({
        "store_id": store_id,
        "action_type": action_type,
        "product_id": product_id,
        "reason": reason,
        "data": data or {},
        "success": success,
    }).execute()


def save_agent_actions(store_id: str, actions: list):
    """Save a batch of agent actions from one cycle."""
    for action in actions:
        tool = action.get("tool", "unknown")
        args = action.get("args", {})
        result = action.get("result", {})

        save_agent_log(
            store_id=store_id,
            action_type=tool,
            product_id=args.get("product_id"),
            reason=args.get("reason"),
            data=args,
            success=result.get("success", True),
        )
    print(f"✓ Saved {len(actions)} agent actions to database")


def get_recent_logs(store_id: str, limit: int = 20) -> list:
    """Get the most recent agent logs for a store."""
    result = db().table("agent_logs").select("*").eq("store_id", store_id).order("created_at", desc=True).limit(limit).execute()
    return result.data or []


# ─── Reports ─────────────────────────────────────────────────────────────────

def save_report(store_id: str, summary: str, wins: list, concerns: list, actions_taken: list):
    """Save a daily growth report."""
    db().table("reports").insert({
        "store_id": store_id,
        "summary": summary,
        "wins": wins,
        "concerns": concerns,
        "actions_taken": actions_taken,
    }).execute()
    print(f"✓ Saved growth report for store {store_id}")


def get_recent_reports(store_id: str, limit: int = 7) -> list:
    """Get the most recent reports for a store (last 7 days)."""
    result = db().table("reports").select("*").eq("store_id", store_id).order("created_at", desc=True).limit(limit).execute()
    return result.data or []