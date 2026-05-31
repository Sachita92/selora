# adapters/shopify.py
# Shopify → Universal format → Shopify
# Fetches data from Shopify and converts to UniversalProduct/Order/StoreSnapshot
# Also sends actions back to Shopify via API

import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from adapters.base import (
    BaseAdapter,
    UniversalProduct,
    UniversalOrder,
    StoreSnapshot,
)

load_dotenv()


class ShopifyAdapter(BaseAdapter):
    """
    Connects Selora to a Shopify store.
    Uses Shopify Admin REST API with access token auth.
    """

    def __init__(self):
        self.shop_url = os.getenv("SHOPIFY_SHOP_URL")        # e.g. your-store.myshopify.com
        self.access_token = os.getenv("SHOPIFY_ACCESS_TOKEN") # Admin API access token
        self.api_version = "2024-01"

        if not self.shop_url or not self.access_token:
            raise ValueError(
                "Missing SHOPIFY_SHOP_URL or SHOPIFY_ACCESS_TOKEN in .env file.\n"
                "Get your access token from Shopify Admin → Apps → your app → API credentials."
            )

        self.base_url = f"https://{self.shop_url}/admin/api/{self.api_version}"
        self.headers = {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json",
        }

    def get_platform_name(self) -> str:
        return "shopify"

    # ─── Private helpers ──────────────────────────────────────────────────────

    def _get(self, endpoint: str, params: dict = None) -> dict:
        """Make a GET request to Shopify API."""
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def _put(self, endpoint: str, data: dict) -> dict:
        """Make a PUT request to Shopify API."""
        url = f"{self.base_url}/{endpoint}"
        response = requests.put(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def _get_shop_info(self) -> dict:
        """Get basic shop information."""
        return self._get("shop.json").get("shop", {})

    def _get_products(self) -> list:
        """Fetch all products from Shopify."""
        data = self._get("products.json", params={"limit": 250, "status": "active"})
        return data.get("products", [])

    def _get_orders(self, days: int = 30) -> list:
        """Fetch orders from the last N days."""
        since = (datetime.now() - timedelta(days=days)).isoformat()
        data = self._get("orders.json", params={
            "limit": 250,
            "status": "any",
            "created_at_min": since,
        })
        return data.get("orders", [])

    def _calculate_product_stats(self, product_id: str, orders: list) -> dict:
        """Calculate sales stats for a product from order history."""
        sales = 0
        revenue = 0.0

        for order in orders:
            if order.get("financial_status") == "paid":
                for item in order.get("line_items", []):
                    if str(item.get("product_id")) == str(product_id):
                        sales += item.get("quantity", 0)
                        revenue += float(item.get("price", 0)) * item.get("quantity", 0)

        return {"sales": sales, "revenue": revenue}

    # ─── Public methods (implements BaseAdapter) ──────────────────────────────

    def get_store_snapshot(self) -> StoreSnapshot:
        """
        Fetch everything from Shopify and return as a StoreSnapshot.
        This is what the AI agent sees.
        """
        print("📦 Fetching store data from Shopify...")

        shop_info = self._get_shop_info()
        raw_products = self._get_products()
        raw_orders = self._get_orders(days=30)

        print(f"   ✓ Found {len(raw_products)} products")
        print(f"   ✓ Found {len(raw_orders)} orders in last 30 days")

        # Convert orders to universal format
        universal_orders = []
        for order in raw_orders[:20]:  # last 20 orders
            universal_orders.append(UniversalOrder(
                id=str(order["id"]),
                total=float(order.get("total_price", 0)),
                items_count=len(order.get("line_items", [])),
                status=order.get("fulfillment_status") or "pending",
                created_at=order.get("created_at", ""),
                platform="shopify",
            ))

        # Convert products to universal format
        universal_products = []
        for product in raw_products:
            # Get first variant price and inventory
            variants = product.get("variants", [{}])
            first_variant = variants[0] if variants else {}
            price = float(first_variant.get("price", 0))
            compare_at = first_variant.get("compare_at_price")
            inventory = sum(
                v.get("inventory_quantity", 0) for v in variants
            )

            # Calculate sales stats
            stats = self._calculate_product_stats(product["id"], raw_orders)

            universal_products.append(UniversalProduct(
                id=str(product["id"]),
                title=product.get("title", ""),
                description=product.get("body_html", "") or "",
                price=price,
                compare_at_price=float(compare_at) if compare_at else None,
                inventory=inventory,
                sales_last_30_days=stats["sales"],
                revenue_last_30_days=stats["revenue"],
                conversion_rate=0.0,   # needs analytics API — placeholder for now
                views_last_30_days=0,  # needs analytics API — placeholder for now
                platform="shopify",
                raw=product,
            ))

        # Calculate totals
        total_revenue = sum(float(o.get("total_price", 0)) for o in raw_orders)
        total_orders = len(raw_orders)

        return StoreSnapshot(
            platform="shopify",
            shop_name=shop_info.get("name", self.shop_url),
            total_revenue_30d=total_revenue,
            total_orders_30d=total_orders,
            products=universal_products,
            recent_orders=universal_orders,
        )

    def reprice_product(self, product_id: str, new_price: float) -> bool:
        """
        Change the price of all variants of a product.
        Returns True if successful.
        """
        try:
            # Get current variants
            data = self._get(f"products/{product_id}.json")
            product = data.get("product", {})
            variants = product.get("variants", [])

            # Update each variant price
            updated_variants = [
                {"id": v["id"], "price": str(round(new_price, 2))}
                for v in variants
            ]

            self._put(f"products/{product_id}.json", {
                "product": {
                    "id": product_id,
                    "variants": updated_variants,
                }
            })

            print(f"   ✓ Repriced product {product_id} to ${new_price}")
            return True

        except Exception as e:
            print(f"   ✗ Failed to reprice product {product_id}: {e}")
            return False

    def update_listing(self, product_id: str, title: str = None, description: str = None) -> bool:
        """
        Update a product's title and/or description.
        Returns True if successful.
        """
        try:
            update_data = {"id": product_id}
            if title:
                update_data["title"] = title
            if description:
                update_data["body_html"] = description

            self._put(f"products/{product_id}.json", {"product": update_data})
            print(f"   ✓ Updated listing for product {product_id}")
            return True

        except Exception as e:
            print(f"   ✗ Failed to update listing for product {product_id}: {e}")
            return False