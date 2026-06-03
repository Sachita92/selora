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


# ─── Store Settings ───────────────────────────────────────────────────────────

DEFAULT_SETTINGS = {
    "max_price_increase_pct": 15,
    "max_price_decrease_pct": 20,
    "restock_alert_threshold": 10,
    "run_frequency_hours": 24,
    "auto_reprice": True,
    "auto_optimize_listings": True,
    "dry_run": False,
    "goal": "maximize_revenue",
}

def get_store_settings(store_id: str) -> dict:
    """Get agent configuration settings for a store, falling back to defaults."""
    result = db().table("stores").select("settings").eq("id", store_id).execute()
    if result.data and result.data[0].get("settings"):
        return {**DEFAULT_SETTINGS, **result.data[0]["settings"]}
    return DEFAULT_SETTINGS


def save_store_settings(store_id: str, settings: dict) -> dict:
    """Persist agent configuration settings for a store."""
    db().table("stores").update({"settings": settings}).eq("id", store_id).execute()
    return {**DEFAULT_SETTINGS, **settings}


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


# ─── Chat Messages ───────────────────────────────────────────────────────────

def save_chat_message(store_id: str, session_id: str, role: str, content: str, actions: list = None) -> dict:
    """Save a chat message to the database."""
    client = db()
    result = client.table("chat_messages").insert({
        "store_id": store_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "actions": actions or [],
    }).execute()
    return result.data[0] if result.data else {}


def get_chat_history(store_id: str, session_id: str, limit: int = 50) -> list:
    """Get chat history for a specific store and session."""
    client = db()
    result = client.table("chat_messages")\
        .select("*")\
        .eq("store_id", store_id)\
        .eq("session_id", session_id)\
        .order("created_at", desc=False)\
        .limit(limit)\
        .execute()
    return result.data or []


def get_chat_sessions(store_id: str, limit: int = 20) -> list:
    """Get unique chat sessions (grouped, latest message timestamp) for a store."""
    client = db()
    # PostgREST doesn't support complex GROUP BY well out-of-the-box in basic select,
    # but we can get the most recent messages and group them or fetch from a view/query.
    # A simple approach is selecting the messages ordered by created_at DESC and deduplicating in Python.
    result = client.table("chat_messages")\
        .select("session_id,role,content,created_at")\
        .eq("store_id", store_id)\
        .order("created_at", desc=True)\
        .limit(200)\
        .execute()
    
    sessions = []
    seen = set()
    for msg in (result.data or []):
        sid = msg["session_id"]
        if sid not in seen:
            seen.add(sid)
            sessions.append({
                "session_id": sid,
                "last_message": msg["content"],
                "last_active": msg["created_at"]
            })
            if len(sessions) >= limit:
                break
    return sessions


# ─── Support and Demos ────────────────────────────────────────────────────────

def save_support_ticket(ticket_data: dict) -> dict:
    """Save a support ticket submission."""
    result = db().table("support_tickets").insert({
        "name": ticket_data["name"],
        "email": ticket_data["email"],
        "store_url": ticket_data.get("storeUrl") or ticket_data.get("store_url"),
        "subject": ticket_data["subject"],
        "message": ticket_data["message"],
    }).execute()
    return result.data[0] if result.data else {}


def save_demo_booking(booking_data: dict) -> dict:
    """Save a demo booking schedule."""
    result = db().table("demo_bookings").insert({
        "first_name": booking_data["first_name"],
        "last_name": booking_data["last_name"],
        "email": booking_data["email"],
        "store_url": booking_data.get("store_url") or booking_data.get("storeUrl"),
        "platform": booking_data["platform"],
        "monthly_revenue": booking_data.get("monthly_revenue") or booking_data.get("teamSize"),
        "timezone": booking_data["timezone"],
        "message": booking_data.get("message"),
        "booking_date": booking_data["booking_date"],
        "booking_time": booking_data["booking_time"],
    }).execute()
    return result.data[0] if result.data else {}
