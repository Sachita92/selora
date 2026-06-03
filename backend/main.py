import os
import argparse
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Selora API", version="1.0.0")

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://selora.fashion",
        "https://www.selora.fashion",
        os.getenv("SHOPIFY_APP_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "Selora API", "version": "1.0.0"}


# ─── Shopify OAuth ────────────────────────────────────────────────────────────

# In-memory store for OAuth state tokens (use Redis in production)
_oauth_states: dict = {}

@app.get("/install")
def install(
    shop: str = Query(..., description="The myshopify.com domain"),
    email: str = Query(None, description="The logged-in user email"),
):
    """
    Step 1 of OAuth — redirect seller to Shopify's permission screen.
    Usage: GET /install?shop=my-store.myshopify.com&email=user@example.com
    """
    from auth import build_install_url

    if not shop:
        raise HTTPException(status_code=400, detail="shop parameter is required")

    install_url, state = build_install_url(shop)
    _oauth_states[state] = {"shop": shop, "email": email}  # store state data for verification
    print(f"→ Redirecting {shop} to Shopify OAuth")
    return RedirectResponse(url=install_url)


@app.get("/auth/callback")
def oauth_callback(
    request: Request,
    shop: str = Query(...),
    code: str = Query(...),
    state: str = Query(...),
    hmac: str = Query(...),
    background_tasks: BackgroundTasks = None,
):
    """
    Step 2 of OAuth — Shopify redirects here after seller approves.
    We verify the request, exchange the code for a token, save it, and redirect to dashboard.
    """
    from auth import verify_hmac, exchange_code_for_token, get_shop_info
    from database import get_or_create_user, save_store

    # Verify state to prevent CSRF attacks
    if state not in _oauth_states:
        raise HTTPException(status_code=403, detail="Invalid state parameter")
    state_data = _oauth_states[state]
    del _oauth_states[state]

    # Extract details from state (handles dict or legacy str formats)
    if isinstance(state_data, dict):
        user_email = state_data.get("email")
    else:
        user_email = None

    # Verify HMAC signature from Shopify
    query_params = dict(request.query_params)
    if not verify_hmac(query_params, hmac):
        raise HTTPException(status_code=403, detail="HMAC verification failed")

    # Exchange code for permanent access token
    try:
        access_token = exchange_code_for_token(shop, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {e}")

    # Get shop info
    try:
        shop_info = get_shop_info(shop, access_token)
        shop_name = shop_info.get("name", shop)
        shop_email = shop_info.get("email", f"owner@{shop}")
    except Exception:
        shop_name = shop
        shop_email = f"owner@{shop}"

    # Associate store with the logged-in user email if available, otherwise Shopify owner email
    target_email = user_email if user_email else shop_email

    # Get or create user
    user = get_or_create_user(target_email)

    # Save store to database
    store = save_store(
        user_id=user["id"],
        platform="shopify",
        shop_url=shop,
        access_token=access_token,
        shop_name=shop_name,
    )

    print(f"✅ {shop_name} connected successfully!")

    # Redirect to dashboard (frontend)
    dashboard_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/dashboard?store_id={store['id']}"
    return RedirectResponse(url=dashboard_url)


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/stores")
def get_stores(email: str = Query(..., description="User email")):
    """Get all connected stores for a user."""
    from database import get_or_create_user, get_stores_for_user

    user = get_or_create_user(email)
    stores = get_stores_for_user(user["id"])

    # Don't expose access tokens in API response
    safe_stores = [{
        "id": s["id"],
        "platform": s["platform"],
        "shop_url": s["shop_url"],
        "shop_name": s["shop_name"],
        "is_active": s["is_active"],
        "last_synced_at": s["last_synced_at"],
        "created_at": s["created_at"],
    } for s in stores]

    return {"stores": safe_stores}


@app.get("/api/stores/{store_id}/logs")
def get_store_logs(store_id: str, limit: int = 20):
    """Get recent agent activity logs for a store."""
    from database import get_recent_logs
    logs = get_recent_logs(store_id, limit=limit)
    return {"logs": logs}


@app.get("/api/stores/{store_id}/reports")
def get_store_reports(store_id: str, limit: int = 7):
    """Get recent growth reports for a store."""
    from database import get_recent_reports
    reports = get_recent_reports(store_id, limit=limit)
    return {"reports": reports}


@app.get("/api/stores/{store_id}/products")
def get_store_products(store_id: str):
    """Fetch live products from the connected store via the Shopify adapter."""
    from database import get_store_by_id
    from adapters.shopify import ShopifyAdapter

    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    try:
        adapter = ShopifyAdapter(
            shop_url=store["shop_url"],
            access_token=store["access_token"],
        )
        snapshot = adapter.get_store_snapshot()
        return {
            "products": [p.to_dict() for p in snapshot.products],
            "total_revenue_30d": snapshot.total_revenue_30d,
            "total_orders_30d": snapshot.total_orders_30d,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {e}")


@app.get("/api/stores/{store_id}/settings")
def get_store_settings(store_id: str):
    """Get the agent configuration settings for a store."""
    from database import get_store_by_id, get_store_settings
    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    settings = get_store_settings(store_id)
    return {"settings": settings}


@app.put("/api/stores/{store_id}/settings")
def update_store_settings(store_id: str, body: dict):
    """Save agent configuration settings for a store."""
    from database import get_store_by_id, save_store_settings
    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    settings = save_store_settings(store_id, body)
    return {"settings": settings}


@app.post("/api/agent/run/{store_id}")
def run_agent_on_store(store_id: str, dry_run: bool = True, background_tasks: BackgroundTasks = None):
    """
    Manually trigger the Selora agent on a specific store.
    dry_run=True means agent analyzes but makes no real changes.
    """
    from database import get_store_by_id
    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    background_tasks.add_task(_run_agent_task, store, dry_run)
    return {"message": f"Agent started for {store['shop_name']}", "dry_run": dry_run}


# ─── Chat Endpoint ───────────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: List[ChatMessage] = []


@app.get("/api/chat/{store_id}/history")
def get_chat_history_endpoint(store_id: str, session_id: str):
    """Retrieve chat message history for a specific store and session."""
    from database import get_store_by_id, get_chat_history
    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    history = get_chat_history(store_id, session_id)
    return {"history": history}


@app.get("/api/chat/{store_id}/sessions")
def get_chat_sessions_endpoint(store_id: str):
    """Retrieve unique chat sessions for a store."""
    from database import get_store_by_id, get_chat_sessions
    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    sessions = get_chat_sessions(store_id)
    return {"sessions": sessions}


@app.post("/api/chat/{store_id}")
def chat_with_agent(store_id: str, body: ChatRequest):
    """
    Chat with the Selora AI agent about a specific store.
    The agent has access to the store's live data and can take actions.
    """
    import json
    from database import get_store_by_id, get_store_settings, save_agent_actions, save_chat_message
    from adapters.shopify import ShopifyAdapter
    from agent.tools import get_tools_definition, execute_tool
    from groq import Groq

    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Save the user's incoming message
    try:
        save_chat_message(
            store_id=store_id,
            session_id=body.session_id,
            role="user",
            content=body.message
        )
    except Exception as e:
        print(f"⚠️ Failed to save user chat message: {e}")

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    # Fetch live store data for context
    try:
        adapter = ShopifyAdapter(
            shop_url=store["shop_url"],
            access_token=store["access_token"],
        )
        snapshot = adapter.get_store_snapshot()
        products_summary = "\n".join([
            f"  • {p.title} — ${p.price}, {p.inventory} in stock, "
            f"{p.sales_last_30_days} sold (30d), ${p.revenue_last_30_days:.2f} revenue"
            for p in snapshot.products[:20]
        ])
        store_context = (
            f"STORE: {snapshot.shop_name} ({snapshot.platform})\n"
            f"TOTAL REVENUE (30d): ${snapshot.total_revenue_30d:.2f}\n"
            f"TOTAL ORDERS (30d): {snapshot.total_orders_30d}\n"
            f"PRODUCTS ({len(snapshot.products)}):\n{products_summary}"
        )
    except Exception as e:
        print(f"⚠️ Could not fetch live store data for chat: {e}")
        store_context = f"STORE: {store['shop_name']} (shopify)\n(Could not fetch live data — {e})"
        adapter = None
        snapshot = None

    # Build system prompt for chat mode
    system_prompt = f"""You are Selora, a friendly and expert AI growth assistant for fashion e-commerce stores.

You're having a conversation with the store owner. You have access to their live store data and can take actions on their behalf using your tools.

YOUR ROLE IN CHAT:
- Answer questions about their store, products, sales, and performance
- Give actionable advice on pricing, listings, inventory, and marketing
- Execute commands when asked — reprice products, optimize listings, flag restocks
- Be warm, conversational, and encouraging — like a knowledgeable fashion business mentor
- When you take an action, confirm what you did and why
- Use specific product names and numbers from the store data
- Keep responses concise but helpful — this is a chat, not a report

CURRENT STORE DATA:
{store_context}

When the user asks you to do something (e.g. "lower the price of X", "rewrite the description for Y"), use your tools to execute it. If you're unsure about something, ask for clarification. Always explain what you're doing before you do it."""

    # Build messages array
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    for msg in body.history[-20:]:  # limit to last 20 messages
        messages.append({"role": msg.role, "content": msg.content})

    # Add the new user message
    messages.append({"role": "user", "content": body.message})

    # Call Groq with tools
    client = Groq(api_key=groq_key)
    tools = get_tools_definition()
    actions_taken = []
    max_iterations = 5
    final_response = ""

    try:
        for iteration in range(max_iterations):
            print(f"\n💬 Chat agent thinking... (iteration {iteration + 1})")

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=tools,
                tool_choice="auto",
                max_tokens=2048,
            )

            message = response.choices[0].message

            # No tool calls — agent is done, return text
            if not message.tool_calls:
                final_response = message.content or ""
                break

            # Process tool calls
            messages.append({
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    }
                    for tc in message.tool_calls
                ]
            })

            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)

                # Force numeric types
                for key in ["new_price", "confidence", "current_inventory", "days_until_stockout"]:
                    if key in tool_args and isinstance(tool_args[key], str):
                        try:
                            tool_args[key] = float(tool_args[key])
                        except ValueError:
                            pass

                if adapter:
                    result = execute_tool(
                        tool_name=tool_name,
                        tool_args=tool_args,
                        adapter=adapter,
                        dry_run=False,
                    )
                else:
                    result = {"success": False, "error": "No store adapter available"}

                actions_taken.append({
                    "tool": tool_name,
                    "args": tool_args,
                    "result": result,
                })

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

            # After processing tools, continue to get the agent's text response

        # Save actions if any were taken
        if actions_taken and adapter:
            try:
                save_agent_actions(store_id=store["id"], actions=actions_taken)
            except Exception as e:
                print(f"⚠️ Failed to save chat actions: {e}")

    except Exception as e:
        print(f"❌ Chat agent error: {e}")
        final_response = f"I'm sorry, I encountered an error while processing your request. Please try again. ({e})"

    # Save the assistant's response to db
    try:
        save_chat_message(
            store_id=store_id,
            session_id=body.session_id,
            role="assistant",
            content=final_response,
            actions=actions_taken
        )
    except Exception as e:
        print(f"⚠️ Failed to save assistant chat message: {e}")

    return {
        "response": final_response,
        "actions": actions_taken,
    }



def _run_agent_task(store: dict, dry_run: bool):
    """Background task that runs the agent on a store and saves results."""
    from adapters.shopify import ShopifyAdapter
    from agent.brain import SeloraBrain
    from database import save_agent_actions, save_report, update_store_last_synced

    print(f"\n🌱 Running agent on {store['shop_name']}...")

    try:
        # Create adapter with this store's credentials
        adapter = ShopifyAdapter(
            shop_url=store["shop_url"],
            access_token=store["access_token"],
        )

        # Fetch store data
        snapshot = adapter.get_store_snapshot()

        # Run agent
        brain = SeloraBrain(adapter=adapter, dry_run=dry_run)
        actions = brain.think_and_act(snapshot)

        # Save actions to database
        save_agent_actions(store_id=store["id"], actions=actions)

        # Save report if agent generated one
        for action in actions:
            if action["tool"] == "generate_report":
                args = action["args"]
                save_report(
                    store_id=store["id"],
                    summary=args.get("summary", ""),
                    wins=args.get("wins", []),
                    concerns=args.get("concerns", []),
                    actions_taken=args.get("actions_taken", []),
                )
                break

        update_store_last_synced(store["id"])
        print(f"✅ Agent cycle complete for {store['shop_name']}")

    except Exception as e:
        print(f"❌ Agent failed for {store['shop_name']}: {e}")


# ─── Support and Demo Endpoints ──────────────────────────────────────────────

class SupportTicketRequest(BaseModel):
    name: str
    email: str
    storeUrl: Optional[str] = None
    subject: str
    message: str

class DemoBookingRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    storeUrl: Optional[str] = None
    platform: str
    teamSize: Optional[str] = None
    timezone: str
    message: Optional[str] = None
    booking_date: str  # Format: "YYYY-MM-DD"
    booking_time: str


@app.post("/api/support")
def create_support_ticket(body: SupportTicketRequest):
    """Submit a support ticket and store in Supabase."""
    from database import save_support_ticket
    try:
        ticket = save_support_ticket(body.dict())
        return {"success": True, "ticket": ticket}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit ticket: {e}")


@app.post("/api/demo")
def create_demo_booking(body: DemoBookingRequest):
    """Book a demo slot and store in Supabase."""
    from database import save_demo_booking
    try:
        # Map frontend field names to database structure (which handles both camelCase and snake_case)
        booking_data = {
            "first_name": body.firstName,
            "last_name": body.lastName,
            "email": body.email,
            "store_url": body.storeUrl,
            "platform": body.platform,
            "monthly_revenue": body.teamSize,
            "timezone": body.timezone,
            "message": body.message,
            "booking_date": body.booking_date,
            "booking_time": body.booking_time,
        }
        booking = save_demo_booking(booking_data)
        return {"success": True, "booking": booking}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to book demo: {e}")



# ─── Agent Scheduler ─────────────────────────────────────────────────────────

def run_scheduler(interval_minutes: int = 60, dry_run: bool = False):
    """
    Run the agent on ALL connected stores every N minutes.
    This is what runs in production — call from a separate process or cron job.
    """
    import time
    from database import get_all_active_stores

    print(f"\n🔄 Selora scheduler started — running every {interval_minutes} minutes")
    print(f"   Dry run: {dry_run}\n")

    while True:
        stores = get_all_active_stores()
        print(f"\n📋 Found {len(stores)} active stores")

        for store in stores:
            _run_agent_task(store, dry_run=dry_run)

        print(f"\n💤 Sleeping {interval_minutes} minutes...")
        time.sleep(interval_minutes * 60)


# ─── CLI entry point ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Selora Backend")
    parser.add_argument("--mode", choices=["server", "scheduler", "test"], default="server")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--interval", type=int, default=60)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.mode == "server":
        import uvicorn
        print(f"\n🚀 Starting Selora API server on port {args.port}...")
        uvicorn.run("main:app", host="0.0.0.0", port=args.port, reload=True)

    elif args.mode == "scheduler":
        run_scheduler(interval_minutes=args.interval, dry_run=args.dry_run)

    elif args.mode == "test":
        # Quick test to verify database connection
        from database import db
        result = db().table("stores").select("count").execute()
        print(f"✅ Database connected! Stores in DB: {result.data}")