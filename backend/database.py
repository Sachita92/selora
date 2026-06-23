import os
import threading
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ─── Client ───────────────────────────────────────────────────────────────────

_thread_local = threading.local()

def get_client() -> Client:
    """Get a Supabase client using the service role key (bypasses RLS for backend use)."""
    if not hasattr(_thread_local, "supabase_client"):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")  # service role — never expose in frontend
        if not url or not key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        _thread_local.supabase_client = create_client(url, key)
    return _thread_local.supabase_client


def db() -> Client:
    return get_client()


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


def update_user_subscription(user_id: str, plan: str, status: str, customer_id: str = None, subscription_id: str = None, period_end: str = None) -> dict:
    """Update user's Stripe subscription information in the DB."""
    client = db()
    update_data = {
        "subscription_plan": plan,
        "subscription_status": status
    }
    if customer_id:
        update_data["stripe_customer_id"] = customer_id
    if subscription_id:
        update_data["stripe_subscription_id"] = subscription_id
    if period_end:
        update_data["subscription_current_period_end"] = period_end

    result = client.table("users").update(update_data).eq("id", user_id).execute()
    return result.data[0] if result.data else {}


def update_user_subscription_by_stripe_id(stripe_sub_id: str, plan: str, status: str, period_end: str = None) -> dict:
    """Update user's subscription in DB using the stripe subscription ID."""
    client = db()
    update_data = {
        "subscription_plan": plan,
        "subscription_status": status
    }
    if period_end:
        update_data["subscription_current_period_end"] = period_end

    result = client.table("users").update(update_data).eq("stripe_subscription_id", stripe_sub_id).execute()
    return result.data[0] if result.data else {}


def increment_store_run_count(store_id: str) -> int:
    """Increment the run count of a store this month."""
    client = db()
    store = client.table("stores").select("run_count_this_month").eq("id", store_id).execute()
    current_count = store.data[0].get("run_count_this_month", 0) if store.data else 0
    new_count = current_count + 1
    client.table("stores").update({"run_count_this_month": new_count}).eq("id", store_id).execute()
    return new_count


def check_store_run_limit(store_id: str) -> bool:
    """
    Check if a store has exceeded its monthly optimization limit.
    Free Plan: Limit of 3 optimizations/month.
    Growth Plan: Limit of 30 optimizations/month.
    Scale Plan: Unlimited (represented as 99999).
    """
    client = db()
    # Join store and user to find the subscription_plan
    store_res = client.table("stores").select("user_id, run_count_this_month").eq("id", store_id).execute()
    if not store_res.data:
        return False  # store doesn't exist

    store = store_res.data[0]
    user_id = store["user_id"]
    run_count = store.get("run_count_this_month", 0)

    user = get_user_by_id(user_id)
    if not user:
        return False

    plan = user.get("subscription_plan", "free")
    status = user.get("subscription_status", "active")

    # If subscription is unpaid/canceled, treat as free plan
    if status not in ["active", "trailing_grace_period"]:
        plan = "free"

    limits = {
        "free": 3,
        "growth": 30,
        "scale": 99999
    }
    max_runs = limits.get(plan, 3)
    return run_count < max_runs


def save_billing_event(user_id: str, event_type: str, stripe_event_id: str = None, details: dict = None):
    """Log billing lifecycle changes to the database."""
    db().table("billing_events").insert({
        "user_id": user_id,
        "event_type": event_type,
        "stripe_event_id": stripe_event_id,
        "details": details or {}
    }).execute()



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


def get_store_by_url(shop_url: str) -> dict:
    """Get a single store by its shop URL domain."""
    if not shop_url:
        return None
    # Strip protocol prefix if present
    if "://" in shop_url:
        shop_url = shop_url.split("://")[-1]
    # Strip trailing slashes
    shop_url = shop_url.rstrip("/")

    result = db().table("stores").select("*").eq("shop_url", shop_url).execute()
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


# ─── Newsletter Subscribers ───────────────────────────────────────────────────

def save_newsletter_subscriber(email: str) -> dict:
    """Insert an email into the newsletter_subscribers table.
    
    The table is created on first use via Supabase's auto-create behaviour,
    or can be created manually with:
      CREATE TABLE newsletter_subscribers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        subscribed_at timestamptz DEFAULT now()
      );
    Returns the row on success. If the email already exists, returns the
    existing row gracefully rather than raising.
    """
    client = db()
    try:
        # upsert so duplicate emails don't raise — just silently succeed
        result = client.table("newsletter_subscribers").upsert(
            {"email": email},
            on_conflict="email"
        ).execute()
        return result.data[0] if result.data else {"email": email}
    except Exception as e:
        print(f"Newsletter subscriber insert error: {e}")
        raise


# ─── Public Data ─────────────────────────────────────────────────────────────

def get_public_stats() -> dict:
    """Get aggregated statistics for the public landing page."""
    client = db()
    try:
        # Get total stores
        stores_res = client.table("stores").select("id", count="exact").execute()
        total_stores = stores_res.count if stores_res.count is not None else 0

        # Get total actions taken by the agent
        logs_res = client.table("agent_logs").select("id", count="exact").execute()
        total_actions = logs_res.count if logs_res.count is not None else 0
        
        # Get recent activity
        recent_res = client.table("agent_logs").select("action_type,created_at,data").order("created_at", desc=True).limit(5).execute()
        
        # Get pinned store ID as demo store ID
        import os
        demo_domain = os.getenv("DEMO_STORE_SHOPIFY_DOMAIN", "selora-test.myshopify.com")
        demo_res = client.table("stores").select("id").eq("shop_url", demo_domain).eq("is_active", True).execute()
        demo_store_id = demo_res.data[0]["id"] if demo_res.data else None
        
        return {
            "total_stores": total_stores,
            "total_actions": total_actions,
            "recent_activity": recent_res.data or [],
            "demo_store_id": demo_store_id
        }
    except Exception as e:
        print(f"Error fetching public stats: {e}")
        return {
            "total_stores": 0,
            "total_actions": 0,
            "recent_activity": [],
            "demo_store_id": None
        }
