from adapters.base import BaseAdapter, AgentAction
from agent.health_check import StoreHealthAnalyzer

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
                            "description": "The unique numerical product ID (e.g., '9243184750834') from the store context. Do NOT use the product title/name.",
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
                            "description": "The unique numerical product ID (e.g., '9243184750834') to optimize. Do NOT use the product title/name.",
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
                            "description": "The unique numerical product ID (e.g., '9243184750834') that needs restocking. Do NOT use the product title/name.",
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
        {
            "type": "function",
            "function": {
                "name": "add_product",
                "description": (
                    "Add a new product/clothing item to the store catalog. "
                    "Use when the user requests to create or list a new item. "
                    "Always ask for the product title and price if not specified."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "The name or title of the new product (e.g., 'Classic Fit Denim Pant')",
                        },
                        "price": {
                            "type": "number",
                            "description": "The sale price of the new product (e.g., 39.99)",
                        },
                        "description": {
                            "type": "string",
                            "description": "A detailed product description, highlighting features and styling options",
                        },
                        "inventory": {
                            "type": "integer",
                            "description": "Initial stock quantity to set (default is 10)",
                        },
                        "image_url": {
                            "type": "string",
                            "description": "Optional URL of the product image asset",
                        },
                    },
                    "required": ["title", "price"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "delete_product",
                "description": (
                    "Delete or remove a product from the store catalog. "
                    "Use when the user requests to delete, remove, or throw away a product listing. "
                    "Always ask for the product title or ID to identify what to delete."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "The unique product ID (e.g., '9243184750834') or the exact product title to delete.",
                        },
                    },
                    "required": ["product_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "store_health_check",
                "description": (
                    "Run a comprehensive Store Health Check on the merchant's catalog. "
                    "Use this when the merchant asks: 'run a health check', 'how healthy is my store?', "
                    "'what's wrong with my store?', 'analyze my catalog', 'find issues', or similar. "
                    "Returns a structured health report with a score, issues, and recommendations."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "include_recommendations": {
                            "type": "boolean",
                            "description": "Whether to include AI recommendations in the report (default true)",
                        },
                    },
                    "required": [],
                },
            },
        },
    ]


def execute_tool(
    tool_name: str,
    tool_args: dict,
    adapter: BaseAdapter,
    dry_run: bool = False,
    snapshot=None,
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

    # ── add_product ───────────────────────────────────────────────────────────
    elif tool_name == "add_product":
        success = adapter.add_product(
            title=tool_args["title"],
            price=float(tool_args["price"]),
            description=tool_args.get("description", ""),
            inventory=int(tool_args.get("inventory", 10)),
            image_url=tool_args.get("image_url"),
        )
        return {
            "success": success,
            "tool": tool_name,
            "title": tool_args["title"],
            "price": float(tool_args["price"]),
        }

    # ── delete_product ────────────────────────────────────────────────────────
    elif tool_name == "delete_product":
        success = adapter.delete_product(
            product_id=str(tool_args["product_id"])
        )
        return {
            "success": success,
            "tool": tool_name,
            "product_id": tool_args["product_id"],
        }

    # ── store_health_check ─────────────────────────────────────────────────
    elif tool_name == "store_health_check":
        if snapshot is None:
            return {"success": False, "error": "No store snapshot available for health check."}
        analyzer = StoreHealthAnalyzer(snapshot)
        report = analyzer.analyze()
        result = report.to_dict()
        result["success"] = True
        result["tool"] = tool_name
        print(f"   ✅ Health check complete — score: {result['score']}/100")
        return result

    else:
        print(f"   ✗ Unknown tool: {tool_name}")
        return {"success": False, "error": f"Unknown tool: {tool_name}"}