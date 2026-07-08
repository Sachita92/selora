import os
import json
from groq import Groq
from dotenv import load_dotenv
from adapters.base import StoreSnapshot
from agent.tools import get_tools_definition, execute_tool

load_dotenv()

from product_facts import PRODUCT_FACTS_CORE


class SeloraBrain:
    """
    The core AI agent brain — fashion-focused.
    Feed it a StoreSnapshot → it thinks → it takes actions → it reports.
    Platform agnostic — works with any adapter.
    """

    def __init__(self, adapter, dry_run: bool = False):
        self.adapter = adapter
        self.dry_run = dry_run
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"
        self.actions_taken = []

        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("Missing GROQ_API_KEY in .env file. Get one free at console.groq.com")

    def _build_system_prompt(self) -> str:
        return f"""You are Selora, an expert AI growth agent exclusively for fashion e-commerce stores.

{PRODUCT_FACTS_CORE}

You deeply understand the fashion industry — trends, seasonality, sizing, styling, buyer psychology, and what makes fashion listings convert. Your job is to analyze a fashion store's data and take smart actions to grow revenue, improve listings, optimize pricing, and protect inventory.

YOUR PERSONALITY:
- Warm, stylish, and encouraging — like a knowledgeable fashion business mentor
- You explain every decision in plain English
- You are conservative — only make changes you are confident about
- You always think about the seller's profit margin, not just revenue
- You understand fashion buyers: they care about fit, style, occasion, material, and how something makes them feel

YOUR FASHION EXPERTISE:
- You know that fashion listings need: material, fit, occasion, styling tips, size guidance
- You know seasonal trends affect pricing (summer dresses sell faster in spring/summer)
- You know fashion buyers respond to emotional, aspirational language
- You know that weak fashion titles like "Blue Dress" or "Nice Top" kill conversion rates
- You know good fashion titles include: style name, key feature, occasion, color/material

DECISION RULES:

PRICING:
- If a fashion item has high views but low sales → price may be too high → consider lowering
- If an item is selling out fast → price may be too low → consider raising slightly
- Never lower price below 20% of current price in one cycle
- Never raise price more than 15% in one cycle
- Consider seasonality — if it's a summer item selling in peak season, hold the price
- Only reprice if confidence > 0.7

LISTINGS (fashion-specific):
- Always optimize listings with weak or vague descriptions
- Great fashion titles follow this format:
  [Style/Occasion] + [Item Type] + [Key Feature] + [Color/Material]
  Example: "Everyday Floral Wrap Midi Dress — Lightweight Summer Cotton"
- Great fashion descriptions include:
  • What makes it special (fit, fabric, drape, stretch)
  • Who it's for and what occasions it suits
  • Styling tips (what to pair it with)
  • Size and fit guidance
  • Care instructions (brief)
- Only optimize if confidence > 0.6

INVENTORY:
- Alert if inventory < 10 units AND product sold > 3 units in last 30 days
- Fashion items run out fast in peak season — be proactive
- Calculate days_until_stockout as: inventory / (sales_last_30_days / 30)

REPORTS:
- Always call generate_report at the end of every analysis cycle
- Use fashion-forward language — "your collection", "your pieces", "your customers"
- Be specific — mention actual product names and numbers
- Keep the tone warm, encouraging, and actionable

HEALTH CHECK:
- If the merchant asks 'run a health check', 'how healthy is my store?', 'what's wrong with my store?', 'find issues', 'analyze my catalog', or similar — call the `store_health_check` tool immediately.
- After the tool returns, summarise the results in a warm, conversational way. Lead with the score, then highlight critical issues first, then warnings, then praise healthy areas.
- Be specific: mention actual product names from the report.
- End with 2-3 actionable next steps they can take right now.

Remember: you are working on a real fashion seller's store. Every decision affects their livelihood. Be thoughtful, precise, and always explain your reasoning in plain English."""

    def _build_user_prompt(self, snapshot: StoreSnapshot) -> str:
        """Build the prompt the AI sees — the full store data."""
        products_text = ""
        for i, p in enumerate(snapshot.products[:20]):
            products_text += f"""
Product {i+1}:
  ID: {p.id}
  Title: {p.title}
  Price: ${p.price}
  Inventory: {p.inventory} units
  Sales (30d): {p.sales_last_30_days} units
  Revenue (30d): ${p.revenue_last_30_days:.2f}
  Description: {p.description[:200] if p.description else 'No description'}
"""

        return f"""Analyze this fashion store and take actions to help it grow.

STORE: {snapshot.shop_name} ({snapshot.platform})
PERIOD: Last 30 days
TOTAL REVENUE: ${snapshot.total_revenue_30d:.2f}
TOTAL ORDERS: {snapshot.total_orders_30d}

COLLECTION:
{products_text}

Instructions:
1. Review each fashion piece carefully
2. Pay special attention to listing quality — fashion descriptions are critical for conversion
3. Use your tools to reprice, optimize listings, or send restock alerts where needed
4. Only take actions you are confident about
5. Rewrite any weak titles or descriptions with fashion-forward, conversion-optimized copy
6. At the end, call generate_report with a warm summary of what you found and did
7. Be specific — mention product names and actual numbers"""

    def think_and_act(self, snapshot: StoreSnapshot) -> list:
        """
        Main agent loop:
        1. Build prompt from store snapshot
        2. Ask Groq to analyze and decide
        3. Execute tool calls
        4. Return list of actions taken
        """
        print(f"\n👗 Selora is analyzing {snapshot.shop_name}'s fashion collection...")
        print(f"   Pieces: {len(snapshot.products)} | Orders (30d): {snapshot.total_orders_30d} | Revenue (30d): ${snapshot.total_revenue_30d:.2f}")
        if self.dry_run:
            print("   [DRY RUN MODE — no real changes will be made]\n")

        messages = [
            {"role": "system", "content": self._build_system_prompt()},
            {"role": "user",   "content": self._build_user_prompt(snapshot)},
        ]

        tools = get_tools_definition()
        actions_taken = []
        max_iterations = 10
        iteration = 0

        while iteration < max_iterations:
            iteration += 1
            print(f"\n💭 Agent thinking... (iteration {iteration})")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=tools,
                tool_choice="auto",
                max_tokens=4096,
            )

            message = response.choices[0].message

            if not message.tool_calls:
                if message.content:
                    print(f"\n🤖 Agent: {message.content}")
                print("\n✅ Agent finished analysis.")
                break

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

                # Force numeric types — Groq sometimes returns strings
                for key in ["new_price", "confidence", "current_inventory", "days_until_stockout"]:
                    if key in tool_args and isinstance(tool_args[key], str):
                        try:
                            tool_args[key] = float(tool_args[key])
                        except ValueError:
                            pass

                result = execute_tool(
                    tool_name=tool_name,
                    tool_args=tool_args,
                    adapter=self.adapter,
                    dry_run=self.dry_run,
                    snapshot=snapshot,
                )

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

        self.actions_taken = actions_taken
        return actions_taken