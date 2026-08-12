"""
x402 Payment Protocol - AI Agent Test Client (Solana Devnet)

This script acts as an AI agent making a payment-gated API request:
1. Calls POST http://localhost:8000/api/x402/chat without payment -> receives HTTP 402
2. Decodes PAYMENT-REQUIRED header (x402 v2 spec)
3. Signs a real USDC payment transaction on Solana devnet using test_payer_wallet.json
4. Retries POST http://localhost:8000/api/x402/chat with PAYMENT-SIGNATURE header
5. Output final HTTP response (200 OK) + transaction signature
"""

import os
import json
import base64
import sys
import httpx
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Check payer keypair file
PAYER_WALLET_FILE = os.path.join(os.path.dirname(__file__), "test_payer_wallet.json")

if not os.path.exists(PAYER_WALLET_FILE):
    print(f"❌ Error: {PAYER_WALLET_FILE} not found. Please run keypair generation first.")
    sys.exit(1)

with open(PAYER_WALLET_FILE, "r") as f:
    secret_bytes = json.load(f)

from solders.keypair import Keypair
from solana.rpc.api import Client

payer_kp = Keypair.from_bytes(secret_bytes)
payer_pubkey = str(payer_kp.pubkey())

RPC_URL = os.getenv("SOLANA_RPC_URL")
if not RPC_URL or not RPC_URL.strip():
    raise ValueError("SOLANA_RPC_URL environment variable is not configured.")
RPC_URL = RPC_URL.strip()
rpc_client = Client(RPC_URL)

print("==================================================================")
print("[x402 AI Agent Test Client]")
print("==================================================================")
print(f"Payer Public Key : {payer_pubkey}")

# Check payer SOL balance
sol_bal_resp = rpc_client.get_balance(payer_kp.pubkey())
sol_bal = (sol_bal_resp.value if hasattr(sol_bal_resp, "value") else 0) / 1e9
print(f"Payer SOL Balance: {sol_bal} SOL")

if sol_bal < 0.001:
    print("\n[WARNING] Payer wallet has insufficient SOL for transaction gas fees.")
    print(f"Please transfer 0.01 SOL on devnet to: {payer_pubkey}\n")

# Check payer USDC balance (Circle devnet USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU)
USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

SERVER_URL = "http://localhost:8000/api/x402/chat"

print("\n------------------------------------------------------------------")
print(f"STEP 1: Making initial request to {SERVER_URL} without payment...")
print("------------------------------------------------------------------")

payload = {
    "message": "Hello Selora! Analyze my store health.",
    "session_id": "test-payer-session-1",
    "store_id": "demo",
    "is_guest": True
}

with httpx.Client(timeout=30.0) as http:
    resp1 = http.post(SERVER_URL, json=payload)
    print(f"Initial Status Code: {resp1.status_code}")

    if resp1.status_code != 402:
        print(f"[ERROR] Expected HTTP 402, but received {resp1.status_code}: {resp1.text}")
        sys.exit(1)

    print("[OK] Successfully received HTTP 402 Payment Required!")
    
    payment_header = resp1.headers.get("PAYMENT-REQUIRED")
    if not payment_header:
        print("[ERROR] Missing PAYMENT-REQUIRED header in 402 response.")
        sys.exit(1)

    print(f"\nPAYMENT-REQUIRED Header: {payment_header[:60]}...")

    # Decode x402 requirements JSON
    req_json = json.loads(base64.b64decode(payment_header).decode("utf-8"))
    print("\nDecoded Payment Requirements:")
    print(json.dumps(req_json, indent=2))

    accepts = req_json.get("accepts", [])
    if not accepts:
        print("[ERROR] No payment options found in 'accepts' array.")
        sys.exit(1)

    opt = accepts[0]
    pay_to = opt.get("payTo")
    amount = opt.get("amount") # in atomic units
    network = opt.get("network")

    print("\n------------------------------------------------------------------")
    print(f"STEP 2: Preparing payment of {amount} atomic units ({float(amount)/1e6} USDC)")
    print(f"Pay To : {pay_to}")
    print(f"Network: {network}")
    print("------------------------------------------------------------------")

    # Import x402 SVM client signer
    try:
        from x402.mechanisms.svm.exact.client import ExactSvmScheme
        from x402.mechanisms.svm.signers import KeypairSigner
        from x402.schemas import PaymentRequirements

        signer = KeypairSigner(payer_kp)
        scheme_client = ExactSvmScheme(signer, rpc_url=RPC_URL)

        extra_dict = opt.get("extra", {}) or {}
        fee_payer = extra_dict.get("feePayer") or payer_pubkey
        extra_dict["feePayer"] = fee_payer

        req_obj = PaymentRequirements(
            scheme=opt.get("scheme", "exact"),
            network=network,
            asset=opt.get("asset", "USDC"),
            amount=amount,
            pay_to=pay_to,
            max_timeout_seconds=opt.get("maxTimeoutSeconds", 300),
            extra=extra_dict
        )

        print("[...] Signing payment payload using x402 SVM client...")
        inner_payload = scheme_client.create_payment_payload(req_obj)
        print("[OK] Inner payment payload created successfully!")

        payment_payload = {
            "x402Version": req_json.get("x402Version", 2),
            "accepted": opt,
            "resource": req_json.get("resource"),
            "payload": inner_payload
        }

        # Encode payment signature header (x402 v2 spec: PAYMENT-SIGNATURE or X-Payment)
        payment_payload_json = json.dumps(payment_payload)
        sig_header_val = base64.b64encode(payment_payload_json.encode("utf-8")).decode("utf-8")

    except Exception as e:
        import traceback
        print(f"[ERROR] Error creating payment payload: {e}")
        traceback.print_exc()
        sys.exit(1)

    print("\n------------------------------------------------------------------")
    print("STEP 3: Retrying request with PAYMENT-SIGNATURE header...")
    print("------------------------------------------------------------------")

    headers2 = {
        "PAYMENT-SIGNATURE": sig_header_val,
        "X-Payment": sig_header_val,
        "Content-Type": "application/json"
    }

    resp2 = http.post(SERVER_URL, json=payload, headers=headers2)
    print(f"Final Response Status Code: {resp2.status_code}")
    
    print("\nResponse Headers:")
    for k, v in resp2.headers.items():
        print(f"  {k}: {v}")

    payment_resp_header = resp2.headers.get("PAYMENT-RESPONSE") or resp2.headers.get("payment-response") or resp2.headers.get("x-payment-response")
    if payment_resp_header:
        try:
            settle_data = json.loads(base64.b64decode(payment_resp_header).decode("utf-8"))
            print("\nDecoded PAYMENT-RESPONSE Header:")
            print(json.dumps(settle_data, indent=2))
        except Exception as ex:
            print(f"Raw PAYMENT-RESPONSE Header: {payment_resp_header}")

    print("\nFinal Response Body:")
    print(resp2.text)

    if resp2.status_code == 200:
        print("\n[SUCCESS] Payment verified and request served!")
    else:
        print("\n[FAILED] Request with payment signature failed.")
