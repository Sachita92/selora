import os
import re
import stripe
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

stripe_key = os.getenv("STRIPE_SECRET_KEY")

if not stripe_key or stripe_key == "sk_test_mock":
    print("Error: STRIPE_SECRET_KEY is not configured or is a mock value in backend/.env")
    exit(1)

# Mask the key for printing
masked_key = stripe_key[:10] + "..." + stripe_key[-10:] if len(stripe_key) > 20 else stripe_key
print(f"Connecting to Stripe with secret key: {masked_key}")
stripe.api_key = stripe_key

def get_or_create_product(name, plan_slug):
    print(f"\nChecking for existing product '{name}'...")
    products = stripe.Product.list(limit=100)
    for p in products.data:
        if p.name == name and p.active:
            print(f"   Found existing product: {p.id}")
            return p.id
            
    print(f"   Creating product '{name}'...")
    product = stripe.Product.create(
        name=name,
        description=f"Selora Fashion Platform - {name.replace('Selora ', '')}",
        metadata={"plan_slug": plan_slug}
    )
    print(f"   Created product: {product.id}")
    return product.id

def get_or_create_price(product_id, price_cents, interval, plan_slug):
    print(f"   Checking for existing price of ${price_cents/100:.2f}/{interval}...")
    prices = stripe.Price.list(product=product_id, active=True, limit=100)
    for pr in prices.data:
        if pr.unit_amount == price_cents and pr.recurring and pr.recurring.interval == interval:
            print(f"   Found existing recurring price: {pr.id}")
            return pr.id
            
    print(f"   Creating recurring price of ${price_cents/100:.2f}/{interval}...")
    price = stripe.Price.create(
        product=product_id,
        unit_amount=price_cents,
        currency="usd",
        recurring={"interval": interval},
        metadata={"plan_slug": plan_slug, "interval": interval}
    )
    print(f"   Created price: {price.id}")
    return price.id

try:
    # Get or create Products
    growth_prod_id = get_or_create_product("Selora Growth Plan", "growth")
    scale_prod_id = get_or_create_product("Selora Scale Plan", "scale")
    
    # Get or create Prices (Option B new rates)
    # Growth monthly: $4.99, Yearly: $47.88 ($3.99/mo)
    growth_monthly_price_id = get_or_create_price(growth_prod_id, 499, "month", "growth")
    growth_yearly_price_id = get_or_create_price(growth_prod_id, 4788, "year", "growth")
    
    # Scale monthly: $19.99, Yearly: $191.88 ($15.99/mo)
    scale_monthly_price_id = get_or_create_price(scale_prod_id, 1999, "month", "scale")
    scale_yearly_price_id = get_or_create_price(scale_prod_id, 19188, "year", "scale")
    
    print("\nReading backend/.env file...")
    with open(dotenv_path, "r") as f:
        content = f.read()
        
    # Replace/Inject the 4 Price ID keys
    # 1. Update/Add STRIPE_PRICE_GROWTH
    if "STRIPE_PRICE_GROWTH=" in content:
        content = re.sub(r"STRIPE_PRICE_GROWTH=.*", f"STRIPE_PRICE_GROWTH={growth_monthly_price_id}", content)
    else:
        content += f"\nSTRIPE_PRICE_GROWTH={growth_monthly_price_id}"
        
    # 2. Update/Add STRIPE_PRICE_GROWTH_YEARLY
    if "STRIPE_PRICE_GROWTH_YEARLY=" in content:
        content = re.sub(r"STRIPE_PRICE_GROWTH_YEARLY=.*", f"STRIPE_PRICE_GROWTH_YEARLY={growth_yearly_price_id}", content)
    else:
        content += f"\nSTRIPE_PRICE_GROWTH_YEARLY={growth_yearly_price_id}"
        
    # 3. Update/Add STRIPE_PRICE_SCALE
    if "STRIPE_PRICE_SCALE=" in content:
        content = re.sub(r"STRIPE_PRICE_SCALE=.*", f"STRIPE_PRICE_SCALE={scale_monthly_price_id}", content)
    else:
        content += f"\nSTRIPE_PRICE_SCALE={scale_monthly_price_id}"
        
    # 4. Update/Add STRIPE_PRICE_SCALE_YEARLY
    if "STRIPE_PRICE_SCALE_YEARLY=" in content:
        content = re.sub(r"STRIPE_PRICE_SCALE_YEARLY=.*", f"STRIPE_PRICE_SCALE_YEARLY={scale_yearly_price_id}", content)
    else:
        content += f"\nSTRIPE_PRICE_SCALE_YEARLY={scale_yearly_price_id}"
        
    with open(dotenv_path, "w") as f:
        f.write(content)
        
    print("\nbackend/.env successfully updated!")
    print(f"   STRIPE_PRICE_GROWTH={growth_monthly_price_id} ($4.99/mo)")
    print(f"   STRIPE_PRICE_GROWTH_YEARLY={growth_yearly_price_id} ($47.88/yr)")
    print(f"   STRIPE_PRICE_SCALE={scale_monthly_price_id} ($19.99/mo)")
    print(f"   STRIPE_PRICE_SCALE_YEARLY={scale_yearly_price_id} ($191.88/yr)")
    
except Exception as e:
    print(f"\nError configuring Stripe products/prices: {e}")
    exit(1)
