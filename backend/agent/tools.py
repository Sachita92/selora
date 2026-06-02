from adapters.base import BaseAdapter, AgentAction

def get_tools_definition() -> list:
    """
    Returns the list of tools in Groq/OpenAI format.
    The AI brain uses these to decide what actions to take.
    """
    return [
        {
            "type": "function",
            "function": {
                "name": "reprice_product",
                "description": (
                    "Change the price of a product. Use when a product is priced too high "
                    "(low sales, high views) or too low (selling fast but low revenue). "
                    "Always explain your pricing reasoning."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "The product ID to reprice",
                        },
                        "new_price": {
                            "type": "number",
                            "description": "The new price to set — must be a number like 29.99 not a string like '29.99'",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Why you are changing this price",
                        },
                        "confidence": {
                            "type": "number",
                            "description": "Confidence score between 0.0 and 1.0 — must be a number not a string",
                        },
                    },
                    "required": ["product_id", "new_price", "reason", "confidence"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "optimize_listing",
                "description": (
                    "Rewrite a product's title and/or description to be clearer, "
                    "more compelling, and better for search. Use when a product has "
                    "low conversion rate or a weak/vague title/description."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "The product ID to optimize",
                        },
                        "new_title": {
                            "type": "string",
                            "description": "The improved product title",
                        },
                        "new_description": {
                            "type": "string",
                            "description": "The improved product description in plain text",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Why you are improving this listing",
                        },
                        "confidence": {
                            "type": "number",
                            "description": "How confident you are (0.0 to 1.0)",
                        },
                    },
                    "required": ["product_id", "reason", "confidence"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "restock_alert",
                "description": (
                    "Flag a product that is running low on inventory and needs restocking. "
                    "Use when inventory is below 10 units and the product has recent sales."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "The product ID that needs restocking",
                        },
                        "current_inventory": {
                            "type": "integer",
                            "description": "Current inventory level",
                        },
                        "days_until_stockout": {
                            "type": "integer",
                            "description": "Estimated days until stock runs out based on sales velocity",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Why this product needs restocking now",
                        },
                    },
                    "required": ["product_id", "current_inventory", "days_until_stockout", "reason"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "generate_report",
                "description": (
                    "Generate a plain-English summary of the store's performance "
                    "and what the agent did. Always call this at the end of every cycle."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "summary": {
                            "type": "string",
                            "description": "A friendly, plain-English summary of the store's health and what was done",
                        },
                        "wins": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of positive things happening in the store",
                        },
                        "concerns": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of things that need attention",
                        },
                        "actions_taken": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of actions the agent took this cycle",
                        },
                    },
                    "required": ["summary", "wins", "concerns", "actions_taken"],
                },
            },
        },
    ]


def execute_tool(tool_name, tool_args, adapter, dry_run=False):
    # Force numeric types in case model returns strings
    for key in ["new_price", "confidence", "current_inventory", "days_until_stockout"]:
        if key in tool_args and isinstance(tool_args[key], str):
            try:
                tool_args[key] = float(tool_args[key])
            except ValueError:
                pass

def execute_tool(
    tool_name: str,
    tool_args: dict,
    adapter: BaseAdapter,
    dry_run: bool = False,
) -> dict:
    """
    Execute a tool call from the AI agent.

    dry_run=True means we log the action but don't actually make changes.
    Use dry_run=True for testing before connecting a real store.
    """

    print(f"\n🔧 Agent wants to: {tool_name}")
    print(f"   Args: {tool_args}")

    if dry_run:
        print(f"   [DRY RUN] Skipping actual execution")
        return {"success": True, "dry_run": True, "tool": tool_name, "args": tool_args}

    # ── reprice_product ───────────────────────────────────────────────────────
    if tool_name == "reprice_product":
        success = adapter.reprice_product(
            product_id=str(tool_args["product_id"]),
            new_price=float(tool_args["new_price"]),
        )
        return {
            "success": success,
            "tool": tool_name,
            "product_id": tool_args["product_id"],
            "new_price": float(tool_args["new_price"]),
            "reason": tool_args.get("reason"),
        }

    # ── optimize_listing ──────────────────────────────────────────────────────
    elif tool_name == "optimize_listing":
        success = adapter.update_listing(
            product_id=tool_args["product_id"],
            title=tool_args.get("new_title"),
            description=tool_args.get("new_description"),
        )
        return {
            "success": success,
            "tool": tool_name,
            "product_id": tool_args["product_id"],
            "reason": tool_args.get("reason"),
        }

    # ── restock_alert ─────────────────────────────────────────────────────────
    elif tool_name == "restock_alert":
        # No API call needed — just log the alert
        print(f"   ⚠️  RESTOCK ALERT: Product {tool_args['product_id']} — "
              f"{tool_args['current_inventory']} units left, "
              f"~{tool_args['days_until_stockout']} days until stockout")
        return {
            "success": True,
            "tool": tool_name,
            "alert": True,
            "product_id": tool_args["product_id"],
            "inventory": tool_args["current_inventory"],
            "days_until_stockout": tool_args["days_until_stockout"],
        }

    # ── generate_report ───────────────────────────────────────────────────────
    elif tool_name == "generate_report":
        print(f"\n📊 SELORA GROWTH REPORT")
        print(f"{'='*50}")
        print(f"\n{tool_args['summary']}\n")
        print("✅ Wins:")
        for win in tool_args.get("wins", []):
            print(f"   • {win}")
        print("\n⚠️  Concerns:")
        for concern in tool_args.get("concerns", []):
            print(f"   • {concern}")
        print("\n🤖 Actions Taken:")
        for action in tool_args.get("actions_taken", []):
            print(f"   • {action}")
        print(f"{'='*50}\n")
        return {"success": True, "tool": tool_name, "report": tool_args}

    else:
        print(f"   ✗ Unknown tool: {tool_name}")
        return {"success": False, "error": f"Unknown tool: {tool_name}"}