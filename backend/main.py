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

@app.get("/api/public/stats")
def get_public_stats_endpoint():
    """Get aggregated statistics for the public landing page."""
    from database import get_public_stats
    return get_public_stats()


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
        "run_count_this_month": s.get("run_count_this_month", 0),
    } for s in stores]

    return {
        "stores": safe_stores,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "subscription_plan": user.get("subscription_plan", "free"),
            "subscription_status": user.get("subscription_status", "active"),
            "subscription_current_period_end": user.get("subscription_current_period_end"),
        }
    }



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
    Enforces subscription limits check for non-dry runs.
    """
    from database import get_store_by_id, check_store_run_limit, increment_store_run_count
    store = get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Enforce billing limit check on real optimization runs
    if not dry_run:
        is_allowed = check_store_run_limit(store_id)
        if not is_allowed:
            raise HTTPException(
                status_code=403,
                detail="Monthly optimization limit exceeded for your current plan. Please upgrade your subscription."
            )
        # Increment usage count
        try:
            increment_store_run_count(store_id)
        except Exception as e:
            print(f"⚠️ Failed to increment store run count: {e}")

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
            f"  • {p.title} (ID: {p.id}) — ${p.price}, {p.inventory} in stock, "
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
- Execute commands when asked — reprice products, optimize listings, flag restocks, add new products, or delete/remove products from the catalog
- Be warm, conversational, and encouraging — like a knowledgeable fashion business mentor
- When you take an action, confirm what you did and why
- Use specific product names and numbers from the store data
- Keep responses concise but helpful — this is a chat, not a report

CURRENT STORE DATA:
{store_context}

GUIDELINES FOR CREATING/ADDING PRODUCTS:
When calling the `add_product` tool, if you need to set an image URL, ALWAYS choose the closest match from these high-quality stock photo URLs to showcase it beautifully in the store layout:
- Denim Pants / Jeans / Trousers: https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80
- Denim Jacket / Outerwear: https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80
- Cardigan / Sweater / Knitwear: https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=800&q=80
- T-Shirt / Top / Shirt: https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80
- Dress / Skirt: https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80
- Suit / Blazer / Formal Wear: https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80

When the user asks you to do something (e.g. "lower the price of X", "rewrite the description for Y", "add a new product Z", "delete/remove product W"), use your tools to execute it. If you're unsure about something, ask for clarification. Always explain what you're doing before you do it."""

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


# ─── Stripe Billing Endpoints ────────────────────────────────────────────────

import stripe
from fastapi import Header, Request

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")

# Setup plan lookup mapping
PLAN_PRICE_MAP = {
    "growth_monthly": os.getenv("STRIPE_PRICE_GROWTH", "price_growth_mock"),
    "growth_annual": os.getenv("STRIPE_PRICE_GROWTH_YEARLY", "price_growth_yearly_mock"),
    "scale_monthly": os.getenv("STRIPE_PRICE_SCALE", "price_scale_mock"),
    "scale_annual": os.getenv("STRIPE_PRICE_SCALE_YEARLY", "price_scale_yearly_mock"),
}

class CheckoutRequest(BaseModel):
    user_id: str
    email: str
    plan: str  # 'growth' or 'scale'
    billing_period: str = "monthly"  # 'monthly' or 'annual'

@app.post("/api/billing/create-checkout")
def create_checkout_session(body: CheckoutRequest):
    """Create a Stripe checkout session for a customer."""
    plan_key = f"{body.plan}_{body.billing_period}"
    if plan_key not in PLAN_PRICE_MAP:
        raise HTTPException(status_code=400, detail="Invalid plan or billing period selection")

    price_id = PLAN_PRICE_MAP[plan_key]
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    try:
        # Check if user already has stripe_customer_id in Supabase
        from database import get_user_by_id
        user = get_user_by_id(body.user_id)
        customer_id = user.get("stripe_customer_id") if user else None

        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            customer_email=body.email if not customer_id else None,
            ui_mode="embedded_page",
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            return_url=f"{frontend_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}&billing_status=success",
            metadata={
                "user_id": body.user_id,
                "plan": body.plan,
                "billing_period": body.billing_period,
            }
        )
        return {"clientSecret": checkout_session.client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe session error: {str(e)}")


@app.post("/api/billing/portal")
def create_portal_session(body: dict):
    """Generate a portal session link for subscription management."""
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    from database import get_user_by_id
    user = get_user_by_id(user_id)
    customer_id = user.get("stripe_customer_id") if user else None

    if not customer_id:
        raise HTTPException(status_code=400, detail="Stripe customer not found. Subscribed plan required.")

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{frontend_url}/dashboard",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portal error: {str(e)}")


class CancelSubscriptionRequest(BaseModel):
    subscription_id: str

@app.get("/api/billing/subscriptions")
def get_user_subscriptions(email: str = Query(..., description="User email")):
    """Get active subscriptions from Stripe for a user."""
    from database import get_or_create_user
    try:
        user = get_or_create_user(email)
        customer_id = user.get("stripe_customer_id")
        if not customer_id:
            return {"subscriptions": []}

        subs = stripe.Subscription.list(customer=customer_id, status="all", limit=20)
        formatted_subs = []

        for sub in subs.data:
            sub_dict = sub.to_dict() if hasattr(sub, "to_dict") else dict(sub)
            items = sub_dict.get("items", {}).get("data", [])
            plan_name = "Growth Plan"
            amount = 9.99
            interval = "month"

            if items:
                price_id = items[0].get("price", {}).get("id")
                for plan_key, pid in PLAN_PRICE_MAP.items():
                    if pid == price_id:
                        if "scale" in plan_key:
                            plan_name = "Scale Plan"
                            amount = 287.88 if "yearly" in plan_key or "annual" in plan_key else 29.99
                        else:
                            plan_name = "Growth Plan"
                            amount = 95.88 if "yearly" in plan_key or "annual" in plan_key else 9.99
                        interval = "year" if "yearly" in plan_key or "annual" in plan_key else "month"
                        break

            card_brand = None
            card_last4 = None
            pm_id = sub_dict.get("default_payment_method")
            if pm_id:
                try:
                    pm = stripe.PaymentMethod.retrieve(pm_id)
                    pm_dict = pm.to_dict() if hasattr(pm, "to_dict") else dict(pm)
                    card_data = pm_dict.get("card", {})
                    card_brand = card_data.get("brand")
                    card_last4 = card_data.get("last4")
                except Exception as e:
                    print(f"Error retrieving payment method: {e}")

            from datetime import datetime, timezone
            period_end_ts = None
            if items:
                period_end_ts = items[0].get("current_period_end")
            period_end_iso = datetime.fromtimestamp(period_end_ts, tz=timezone.utc).isoformat() if period_end_ts else None

            formatted_subs.append({
                "id": sub_dict.get("id"),
                "status": sub_dict.get("status"),
                "plan_name": plan_name,
                "amount": amount,
                "interval": interval,
                "cancel_at_period_end": sub_dict.get("cancel_at_period_end"),
                "current_period_end": period_end_iso,
                "card_brand": card_brand,
                "card_last4": card_last4
            })

        return {"subscriptions": formatted_subs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch subscriptions: {str(e)}")


@app.post("/api/billing/cancel-subscription")
def cancel_subscription(body: CancelSubscriptionRequest):
    """Cancel a subscription at the end of the billing period."""
    try:
        sub = stripe.Subscription.modify(body.subscription_id, cancel_at_period_end=True)
        return {"success": True, "subscription": sub}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")


@app.get("/api/billing/history")
def get_billing_history(email: str = Query(..., description="User email")):
    """Get billing history (events) for a user."""
    from database import get_or_create_user, db
    try:
        user = get_or_create_user(email)
        client = db()
        res = client.table("billing_events").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
        return {"history": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch billing history: {str(e)}")


@app.post("/api/billing/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Stripe webhook to handle subscription updates in real-time."""
    import json
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    payload = await request.body()

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
        else:
            # Fallback for development without local listener CLI signature verification
            data = json.loads(payload)
            event = stripe.Event.construct_from(data, stripe.api_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {e}")

    event_type = event["type"]
    event_data = event["data"]["object"]
    if hasattr(event_data, "to_dict"):
        event_data = event_data.to_dict()
    else:
        event_data = dict(event_data)

    from database import update_user_subscription, update_user_subscription_by_stripe_id, save_billing_event

    if event_type == "checkout.session.completed":
        metadata = event_data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan = metadata.get("plan")
        customer_id = event_data.get("customer")
        subscription_id = event_data.get("subscription")

        if user_id and plan:
            # Fetch subscription expiration dates
            sub = stripe.Subscription.retrieve(subscription_id)
            sub_dict = sub.to_dict() if hasattr(sub, "to_dict") else dict(sub)
            current_period_end_timestamp = sub_dict.get("current_period_end")
            
            from datetime import datetime, timezone, timedelta
            if current_period_end_timestamp:
                period_end = datetime.fromtimestamp(current_period_end_timestamp, tz=timezone.utc).isoformat()
            else:
                billing_period = metadata.get("billing_period", "monthly")
                days = 365 if billing_period == "annual" else 30
                period_end = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
            
            update_user_subscription(
                user_id=user_id,
                plan=plan,
                status="active",
                customer_id=customer_id,
                subscription_id=subscription_id,
                period_end=period_end
            )
            save_billing_event(user_id, "checkout_session_completed", event["id"], event_data)

    elif event_type in ["customer.subscription.updated", "customer.subscription.deleted"]:
        stripe_sub_id = event_data.get("id")
        customer_id = event_data.get("customer")
        stripe_status = event_data.get("status")
        
        status_map = {
            "active": "active",
            "trialing": "active",
            "past_due": "trailing_grace_period",
            "canceled": "canceled",
            "unpaid": "unpaid"
        }
        db_status = status_map.get(stripe_status, "canceled")
        
        # Look up price item product plans if subscription updated
        plan = "free"
        if stripe_status in ["active", "trialing", "past_due"]:
            items = event_data.get("items", {}).get("data", [])
            if items:
                price_id = items[0].get("price", {}).get("id")
                # Reverse lookup the plan type from price ids
                for plan_key, pid in PLAN_PRICE_MAP.items():
                    if pid == price_id:
                        plan = plan_key.split("_")[0]
                        break

        from datetime import datetime, timezone, timedelta
        current_period_end_timestamp = event_data.get("current_period_end")
        if current_period_end_timestamp:
            period_end = datetime.fromtimestamp(current_period_end_timestamp, tz=timezone.utc).isoformat()
        else:
            period_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

        # Update in database using Stripe ID
        updated = update_user_subscription_by_stripe_id(
            stripe_sub_id=stripe_sub_id,
            plan=plan,
            status=db_status,
            period_end=period_end
        )
        
        if updated and "id" in updated:
            save_billing_event(updated["id"], f"subscription_{stripe_status}", event["id"], event_data)

    return {"status": "success"}


# ─── Shopify Webhooks ────────────────────────────────────────────────────────

@app.post("/api/webhooks/shopify/product-update")
async def shopify_product_update(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Shopify webhook triggered when a product is updated."""
    return await process_shopify_webhook(request, background_tasks, topic="products/update")


@app.post("/api/webhooks/shopify/order-create")
async def shopify_order_create(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Shopify webhook triggered when a new order is created."""
    return await process_shopify_webhook(request, background_tasks, topic="orders/create")


async def process_shopify_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    topic: str
) -> JSONResponse:
    """Helper to process Shopify webhooks with signature verification."""
    from auth import verify_webhook_hmac
    from database import get_store_by_url

    # Retrieve raw body and headers
    raw_body = await request.body()
    hmac_header = request.headers.get("x-shopify-hmac-sha256")
    shop_domain = request.headers.get("x-shopify-shop-domain")

    # Verify Shopify HMAC signature
    if not verify_webhook_hmac(raw_body, hmac_header):
        print(f"⚠️ Shopify webhook HMAC verification failed for topic: {topic}")
        raise HTTPException(status_code=401, detail="Webhook signature verification failed")

    if not shop_domain:
        print(f"⚠️ Shopify webhook missing x-shopify-shop-domain header")
        raise HTTPException(status_code=400, detail="Missing shop domain header")

    # Look up store in database
    store = get_store_by_url(shop_domain)
    if not store:
        # Return 200 to prevent Shopify from retrying and eventually disabling the webhook
        print(f"ℹ️ Received webhook for unregistered shop: {shop_domain}. Ignoring.")
        return JSONResponse(
            status_code=200,
            content={"status": "ignored", "reason": f"Shop {shop_domain} not registered"}
        )

    # Trigger agent run loop asynchronously in the background
    background_tasks.add_task(_run_agent_task, store, False)
    print(f"✅ Scheduled background agent run for store: {store['shop_name']} ({shop_domain}) via webhook '{topic}'")

    return JSONResponse(
        status_code=200,
        content={"status": "success", "message": f"Agent task scheduled for {shop_domain}"}
    )


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