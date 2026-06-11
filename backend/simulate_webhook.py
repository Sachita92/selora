import os
import sys
import stripe
import requests
import argparse
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

stripe_key = os.getenv("STRIPE_SECRET_KEY")
if not stripe_key or stripe_key == "sk_test_mock":
    print("Error: STRIPE_SECRET_KEY is not configured or is a mock value in backend/.env")
    exit(1)

stripe.api_key = stripe_key

# Set up database access to select a test user
sys.path.append(os.path.dirname(__file__))
from database import db

def main():
    parser = argparse.ArgumentParser(description="Simulate a Stripe checkout webhook locally.")
    parser.add_argument("--email", type=str, help="Email of the user to upgrade.")
    parser.add_argument("--plan", type=str, choices=["growth", "scale"], default="growth", help="Plan to upgrade to.")
    parser.add_argument("--period", type=str, choices=["monthly", "annual"], default="monthly", help="Billing period.")
    args = parser.parse_args()

    print("Checking database for users...")
    users_res = db().table("users").select("*").execute()
    users = users_res.data
    
    if not users:
        print("Error: No users found in the database. Please register a user first by visiting the login/signup page.")
        exit(1)
        
    target_user = None
    if args.email:
        for u in users:
            if u["email"].lower() == args.email.lower():
                target_user = u
                break
        if not target_user:
            print(f"Error: User with email '{args.email}' not found in database.")
            exit(1)
    else:
        # Default to the first user
        target_user = users[0]
        
    user_id = target_user["id"]
    user_email = target_user["email"]
    plan = args.plan
    period = args.period
    
    print(f"\nTarget User: {user_email} (ID: {user_id})")
    print(f"Target Plan: {plan}")
    print(f"Target Period: {period}")
    
    if period == "annual":
        price_var = f"STRIPE_PRICE_{plan.upper()}_YEARLY"
    else:
        price_var = f"STRIPE_PRICE_{plan.upper()}"
        
    price_id = os.getenv(price_var)
    if not price_id:
        print(f"Error: {price_var} is not configured in backend/.env")
        exit(1)
        
    print(f"Stripe Price ID: {price_id}")
    
    print("\nStep 1: Creating real Stripe test customer...")
    try:
        customer = stripe.Customer.create(
            email=user_email,
            source="tok_visa", # Attach mock Visa card for test mode payment
            description=f"Selora Test Customer - {user_email}",
            metadata={"user_id": user_id}
        )
        print(f"Success! Stripe Customer ID: {customer.id}")
    except Exception as e:
        print(f"Error creating Stripe customer: {e}")
        exit(1)
        
    print("\nStep 2: Creating real Stripe test subscription...")
    try:
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price_id}],
            payment_behavior="allow_incomplete",
            metadata={"user_id": user_id, "plan": plan}
        )
        print(f"Success! Stripe Subscription ID: {subscription.id}")
    except Exception as e:
        print(f"Error creating Stripe subscription: {e}")
        exit(1)
        
    # Construct Stripe checkout.session.completed event
    mock_event = {
        "id": "evt_simulated_" + subscription.id,
        "object": "event",
        "api_version": "2022-11-15",
        "created": subscription.created,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_simulated_" + subscription.id,
                "object": "checkout.session",
                "customer": customer.id,
                "subscription": subscription.id,
                "payment_status": "paid",
                "status": "complete",
                "metadata": {
                    "user_id": user_id,
                    "plan": plan,
                    "billing_period": period
                }
            }
        }
    }
    
    url = "http://localhost:8000/api/billing/webhook"
    print(f"\nStep 3: Sending mock event to local webhook endpoint: {url} ...")
    
    try:
        headers = {
            "Content-Type": "application/json",
            "stripe-signature": "t=123,v1=mock_signature"
        }
        res = requests.post(url, json=mock_event, headers=headers)
        if res.status_code == 200:
            print("\n[OK] Webhook simulated successfully!")
            print(f"Response: {res.json()}")
            
            # Fetch updated user from DB
            updated_user = db().table("users").select("*").eq("id", user_id).execute().data[0]
            print("\nUpdated User Subscription Info in DB:")
            print(f"   Plan: {updated_user.get('subscription_plan')}")
            print(f"   Status: {updated_user.get('subscription_status')}")
            print(f"   Stripe Customer ID: {updated_user.get('stripe_customer_id')}")
            print(f"   Stripe Subscription ID: {updated_user.get('stripe_subscription_id')}")
            print(f"   Period End: {updated_user.get('subscription_current_period_end')}")
        else:
            print(f"\n[ERROR] Local server returned error code {res.status_code}: {res.text}")
            print("Is your FastAPI backend server running on http://localhost:8000?")
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Connection Error: Could not connect to http://localhost:8000/api/billing/webhook")
        print("Please ensure your backend FastAPI server is running (e.g. by running: uvicorn main:app --reload)")

if __name__ == "__main__":
    main()
