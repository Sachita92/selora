import os
import requests
from datetime import datetime, timedelta
from typing import Optional
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

    def __init__(self, shop_url: str = None, access_token: str = None):
        self.shop_url = shop_url or os.getenv("SHOPIFY_SHOP_URL")
        self.access_token = access_token or os.getenv("SHOPIFY_ACCESS_TOKEN")
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
        """Fetch orders from the last N days. Returns [] if access is forbidden."""
        since = (datetime.now() - timedelta(days=days)).isoformat()
        try:
            data = self._get("orders.json", params={
                "limit": 250,
                "status": "any",
                "created_at_min": since,
                "fields": "id,total_price,line_items,fulfillment_status,created_at,financial_status"
            })
            return data.get("orders", [])
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 403:
                print("   [WARNING] Orders API: 403 Forbidden (Protected Customer Data scope not granted). Skipping order stats.")
                return []
            raise

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
        print("[Shopify] Fetching store data from Shopify...")

        shop_info = self._get_shop_info()
        raw_products = self._get_products()
        raw_orders   = self._get_orders(days=30)   # returns [] on 403 — never crashes

        print(f"   [OK] Found {len(raw_products)} products")
        print(f"   [OK] Found {len(raw_orders)} orders in last 30 days")

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

            # Extract product image URL
            image_url = None
            if product.get("image"):
                image_url = product.get("image").get("src")
            elif product.get("images") and len(product.get("images")) > 0:
                image_url = product.get("images")[0].get("src")

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
                image_url=image_url,
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

    def _resolve_product_id(self, product_id: str) -> str:
        """
        If product_id is not a numeric string (e.g. if the AI passed the title instead of the ID),
        attempt to find the product in the active store products and return its numeric ID.
        """
        product_id_str = str(product_id).strip()
        if product_id_str.isdigit():
            return product_id_str

        # Try to extract a long number (Shopify ID) from the string
        import re
        match = re.search(r'\b\d{10,}\b', product_id_str)
        if match:
            extracted_id = match.group(0)
            print(f"   [OK] Extracted numerical ID {extracted_id} from '{product_id_str}'")
            return extracted_id

        print(f"[WARNING] Product ID '{product_id_str}' is not numeric. Attempting to resolve by title...")
        try:
            products = self._get_products()
            # Try exact match first
            for p in products:
                if str(p.get("title")).lower() == product_id_str.lower():
                    print(f"   [OK] Resolved '{product_id_str}' to ID {p['id']} via exact match")
                    return str(p["id"])
            
            # Try substring match
            for p in products:
                title = str(p.get("title")).lower()
                pid_lower = product_id_str.lower()
                if pid_lower in title or title in pid_lower:
                    print(f"   [OK] Resolved '{product_id_str}' to ID {p['id']} via partial match")
                    return str(p["id"])
        except Exception as e:
            print(f"   [ERROR] Failed to resolve product ID by title: {e}")
            
        return product_id_str

    def reprice_product(self, product_id: str, new_price: float) -> bool:
        """
        Change the price of all variants of a product.
        Returns True if successful.
        """
        product_id = self._resolve_product_id(product_id)
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

            print(f"   [OK] Repriced product {product_id} to ${new_price}")
            return True

        except Exception as e:
            print(f"   [ERROR] Failed to reprice product {product_id}: {e}")
            return False

    def update_listing(self, product_id: str, title: str = None, description: str = None) -> bool:
        """
        Update a product's title and/or description.
        Returns True if successful.
        """
        product_id = self._resolve_product_id(product_id)
        try:
            update_data = {"id": product_id}
            if title:
                update_data["title"] = title
            if description:
                update_data["body_html"] = description

            self._put(f"products/{product_id}.json", {"product": update_data})
            print(f"   [OK] Updated listing for product {product_id}")
            return True

        except Exception as e:
            print(f"   [ERROR] Failed to update listing for product {product_id}: {e}")
            return False

    def add_product(self, title: str, price: float, description: str = "", inventory: int = 10, image_url: Optional[str] = None) -> bool:
        """
        Add a new product to the Shopify store.
        Returns True if successful.
        """
        try:
            url = f"{self.base_url}/products.json"
            
            # Prepare variants list
            variant = {
                "price": str(round(price, 2)),
                "inventory_quantity": inventory,
                "inventory_management": "shopify"
            }
            
            product_data = {
                "title": title,
                "body_html": description,
                "status": "active",
                "variants": [variant]
            }
            
            if image_url:
                product_data["images"] = [{"src": image_url}]
                
            response = requests.post(
                url, 
                headers=self.headers, 
                json={"product": product_data}
            )
            response.raise_for_status()
            new_prod = response.json().get("product", {})
            print(f"   [OK] Added new product '{title}' to Shopify (ID: {new_prod.get('id')})")
            return True
        except Exception as e:
            print(f"   [ERROR] Failed to add product '{title}': {e}")
            return False

    def delete_product(self, product_id: str) -> bool:
        """
        Delete a product from the Shopify store.
        Returns True if successful.
        """
        product_id = self._resolve_product_id(product_id)
        try:
            url = f"{self.base_url}/products/{product_id}.json"
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            print(f"   [OK] Deleted product {product_id} from Shopify")
            return True
        except Exception as e:
            print(f"   [ERROR] Failed to delete product {product_id}: {e}")
            return False