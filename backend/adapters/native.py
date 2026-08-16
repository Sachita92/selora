from typing import Optional
from adapters.base import (
    BaseAdapter,
    UniversalProduct,
    UniversalOrder,
    StoreSnapshot,
)
from database import supabase_admin as db

class SeloraNativeAdapter(BaseAdapter):
    """
    Connects Selora to native Selora stores (stored in Supabase database directly).
    """

    def __init__(self, store_id: str):
        self.store_id = store_id

    def get_platform_name(self) -> str:
        return "selora"

    def get_store_snapshot(self) -> StoreSnapshot:
        client = db()
        
        # 1. Fetch store info
        store_res = client.table("selora_stores").select("name").eq("id", self.store_id).execute()
        shop_name = store_res.data[0]["name"] if store_res.data else "My Store"

        # 2. Fetch products
        prod_res = client.table("selora_products").select("*").eq("store_id", self.store_id).execute()
        products_list = prod_res.data or []

        universal_products = [
            UniversalProduct(
                id=str(p.get("id", "")),
                title=p.get("title", ""),
                description=p.get("description", "") or "",
                price=float(p.get("price", 0)),
                compare_at_price=None,
                inventory=int(p.get("inventory", 0)) if p.get("inventory") is not None else 10,
                sales_last_30_days=0,
                revenue_last_30_days=0.0,
                conversion_rate=0.0,
                views_last_30_days=0,
                platform="selora",
                image_url=p.get("image_url"),
                raw=p,
            )
            for p in products_list
        ]

        # 3. Fetch orders
        order_res = client.table("selora_orders").select("*").eq("store_id", self.store_id).execute()
        orders_list = order_res.data or []

        universal_orders = [
            UniversalOrder(
                id=str(o.get("id", "")),
                total=float(o.get("total_usd", 0)),
                items_count=len(o.get("items", [])) if isinstance(o.get("items"), list) else 1,
                status=o.get("status", "pending"),
                created_at=o.get("created_at", ""),
                platform="selora",
            )
            for o in orders_list
        ]

        total_rev = sum(o.total for o in universal_orders if o.status in ["paid", "confirmed"])
        total_ord = len([o for o in universal_orders if o.status in ["paid", "confirmed"]])

        return StoreSnapshot(
            platform="selora",
            shop_name=shop_name,
            total_revenue_30d=total_rev,
            total_orders_30d=total_ord,
            products=universal_products,
            recent_orders=universal_orders,
        )

    def reprice_product(self, product_id: str, new_price: float) -> bool:
        client = db()
        res = client.table("selora_products").update({"price": new_price}).eq("id", product_id).execute()
        return bool(res.data)

    def update_listing(self, product_id: str, title: str = None, description: str = None) -> bool:
        client = db()
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if not update_data:
            return True
        res = client.table("selora_products").update(update_data).eq("id", product_id).execute()
        return bool(res.data)

    def add_product(self, title: str, price: float, description: str = "", inventory: int = 10, image_url: Optional[str] = None) -> bool:
        client = db()
        res = client.table("selora_products").insert({
            "store_id": self.store_id,
            "title": title,
            "price": price,
            "description": description,
            "inventory": inventory,
            "image_url": image_url or "",
        }).execute()
        return bool(res.data)

    def delete_product(self, product_id: str) -> bool:
        client = db()
        res = client.table("selora_products").delete().eq("id", product_id).execute()
        return bool(res.data)
