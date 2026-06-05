from dataclasses import dataclass, field
from typing import Optional


@dataclass
class UniversalProduct:
    """A product in any e-commerce store — platform agnostic."""
    id: str
    title: str
    description: str
    price: float
    compare_at_price: Optional[float]   # original price before discount
    inventory: int
    sales_last_30_days: int
    revenue_last_30_days: float
    conversion_rate: float              # % of visitors who buy
    views_last_30_days: int
    platform: str
    image_url: Optional[str] = None
    raw: dict = field(default_factory=dict)  # original platform data

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "compare_at_price": self.compare_at_price,
            "inventory": self.inventory,
            "sales_last_30_days": self.sales_last_30_days,
            "revenue_last_30_days": self.revenue_last_30_days,
            "conversion_rate": self.conversion_rate,
            "views_last_30_days": self.views_last_30_days,
            "platform": self.platform,
            "image_url": self.image_url,
        }


@dataclass
class UniversalOrder:
    """An order from any e-commerce store — platform agnostic."""
    id: str
    total: float
    items_count: int
    status: str           # "pending", "fulfilled", "cancelled"
    created_at: str
    platform: str

    def to_dict(self):
        return {
            "id": self.id,
            "total": self.total,
            "items_count": self.items_count,
            "status": self.status,
            "created_at": self.created_at,
            "platform": self.platform,
        }


@dataclass
class StoreSnapshot:
    """A full snapshot of a store's current state — what the agent sees."""
    platform: str
    shop_name: str
    total_revenue_30d: float
    total_orders_30d: int
    products: list[UniversalProduct]
    recent_orders: list[UniversalOrder]

    def to_dict(self):
        return {
            "platform": self.platform,
            "shop_name": self.shop_name,
            "total_revenue_30d": self.total_revenue_30d,
            "total_orders_30d": self.total_orders_30d,
            "products": [p.to_dict() for p in self.products],
            "recent_orders": [o.to_dict() for o in self.recent_orders],
        }


@dataclass
class AgentAction:
    """An action the agent wants to take on a store."""
    action_type: str        # "reprice", "update_listing", "restock_alert", "pause_ad", "report"
    product_id: str
    reason: str             # why the agent is doing this
    data: dict              # what to change (e.g. {"new_price": 29.99})
    platform: str
    confidence: float       # 0.0 to 1.0 — how confident the agent is

    def to_dict(self):
        return {
            "action_type": self.action_type,
            "product_id": self.product_id,
            "reason": self.reason,
            "data": self.data,
            "platform": self.platform,
            "confidence": self.confidence,
        }


class BaseAdapter:
    """
    Every platform adapter must inherit from this and implement these methods.
    This is the contract — if you implement these 4 methods, Selora works on any platform.
    """

    def get_store_snapshot(self) -> StoreSnapshot:
        """Fetch all store data and return as a StoreSnapshot."""
        raise NotImplementedError

    def reprice_product(self, product_id: str, new_price: float) -> bool:
        """Change the price of a product. Returns True if successful."""
        raise NotImplementedError

    def update_listing(self, product_id: str, title: str = None, description: str = None) -> bool:
        """Update a product's title and/or description. Returns True if successful."""
        raise NotImplementedError

    def get_platform_name(self) -> str:
        """Return the platform name e.g. 'shopify'."""
        raise NotImplementedError

    def add_product(self, title: str, price: float, description: str = "", inventory: int = 10, image_url: Optional[str] = None) -> bool:
        """Add a new product to the store. Returns True if successful."""
        raise NotImplementedError

    def delete_product(self, product_id: str) -> bool:
        """Delete a product from the store. Returns True if successful."""
        raise NotImplementedError