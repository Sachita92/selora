# main.py
# Entry point for Selora backend
# Run with: python main.py

import os
import argparse
from dotenv import load_dotenv

load_dotenv()


def main():
    parser = argparse.ArgumentParser(description="Selora AI E-Commerce Growth Agent")
    parser.add_argument(
        "--mode",
        choices=["once", "loop", "test"],
        default="test",
        help=(
            "once  = run one cycle on your real store\n"
            "loop  = run every hour forever (production mode)\n"
            "test  = run with mock data, no real store needed (default)"
        )
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Think and report but make NO real changes to your store",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Minutes between cycles in loop mode (default: 60)",
    )
    args = parser.parse_args()

    # ── TEST MODE — no real store needed ─────────────────────────────────────
    if args.mode == "test":
        print("\n🧪 Running Selora in TEST MODE with mock data...")
        print("   No real store connection needed — perfect for development!\n")

        from adapters.base import StoreSnapshot, UniversalProduct, UniversalOrder
        from agent.brain import SeloraBrain
        from agent.loop import run_once

        # Create a fake adapter for testing
        class MockAdapter:
            def get_platform_name(self):
                return "mock"

            def reprice_product(self, product_id, new_price):
                print(f"   [MOCK] Would reprice {product_id} to ${new_price}")
                return True

            def update_listing(self, product_id, title=None, description=None):
                print(f"   [MOCK] Would update listing for {product_id}")
                return True

            def get_store_snapshot(self):
                # Fake store data for testing
                return StoreSnapshot(
                    platform="mock",
                    shop_name="Selora Test Store",
                    total_revenue_30d=8420.50,
                    total_orders_30d=142,
                    products=[
                        UniversalProduct(
                            id="001",
                            title="Blue Canvas Tote Bag",
                            description="A bag.",  # intentionally weak — agent should improve this
                            price=24.99,
                            compare_at_price=34.99,
                            inventory=4,           # intentionally low — agent should alert
                            sales_last_30_days=38,
                            revenue_last_30_days=949.62,
                            conversion_rate=3.2,
                            views_last_30_days=1200,
                            platform="mock",
                        ),
                        UniversalProduct(
                            id="002",
                            title="Wireless Earbuds",
                            description="High quality wireless earbuds with 24hr battery life, noise cancellation, and premium sound. Compatible with all Bluetooth devices.",
                            price=89.99,
                            compare_at_price=None,
                            inventory=45,
                            sales_last_30_days=3,  # very low sales — price might be too high
                            revenue_last_30_days=269.97,
                            conversion_rate=0.4,
                            views_last_30_days=750,
                            platform="mock",
                        ),
                        UniversalProduct(
                            id="003",
                            title="Running Shoes - Black",
                            description="Lightweight running shoes with cushioned sole.",
                            price=59.99,
                            compare_at_price=79.99,
                            inventory=120,
                            sales_last_30_days=67,  # selling fast — price might be too low
                            revenue_last_30_days=4019.33,
                            conversion_rate=5.8,
                            views_last_30_days=1150,
                            platform="mock",
                        ),
                    ],
                    recent_orders=[
                        UniversalOrder(id="o1", total=24.99, items_count=1, status="fulfilled", created_at="2025-01-01", platform="mock"),
                        UniversalOrder(id="o2", total=89.99, items_count=1, status="fulfilled", created_at="2025-01-02", platform="mock"),
                        UniversalOrder(id="o3", total=179.98, items_count=2, status="pending",   created_at="2025-01-03", platform="mock"),
                    ],
                )

        adapter = MockAdapter()
        run_once(adapter=adapter, dry_run=True)

    # ── ONCE MODE — run on real Shopify store ─────────────────────────────────
    elif args.mode == "once":
        from adapters.shopify import ShopifyAdapter
        from agent.loop import run_once

        print("\n🛍️  Connecting to your Shopify store...")
        adapter = ShopifyAdapter()
        run_once(adapter=adapter, dry_run=args.dry_run)

    # ── LOOP MODE — run every N minutes forever ───────────────────────────────
    elif args.mode == "loop":
        from adapters.shopify import ShopifyAdapter
        from agent.loop import run_forever

        print("\n🔄 Starting Selora in production loop mode...")
        adapter = ShopifyAdapter()
        run_forever(
            adapter=adapter,
            interval_minutes=args.interval,
            dry_run=args.dry_run,
        )


if __name__ == "__main__":
    main()