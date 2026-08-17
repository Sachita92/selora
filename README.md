# Selora — AI-Powered Fashion Commerce Platform

> Your store grows while you sleep.

Selora is a growth platform for fashion sellers. A seller can either connect an existing **Shopify** store, or launch a fully custom **Selora Native Store** — its own storefront (hero section, categories, products, checkout) built and hosted directly on Selora, with no separate ecommerce platform required.

Selora Native Stores support **Solana Pay checkout**, letting buyers pay in USDC and track orders using only a connected wallet — no buyer account needed. This is specific to Native Stores; Shopify-connected stores use Shopify's own checkout.

---

## Core Features

- **Two ways to sell**: connect an existing Shopify store, or build a Selora Native Store from scratch through the Store Builder.
- **Store Builder** — sellers configure their store's identity, hero section, dynamic categories, and product catalog, with a live preview of the real storefront before publishing.
- **Native Storefront** — a public, buyer-facing store page per seller (`/store/{handle}`), no login required to browse or buy.
- **Solana Pay Checkout (Native Stores)** — buyers pay in **USDC on Solana Devnet** via two paths: scan a standard Solana Pay QR code with **any Solana wallet app** (Phantom, Solflare, Backpack, Glow, etc.), or connect **Phantom directly in-browser** for a one-click desktop flow. Payment is verified on-chain before the order is confirmed.
- **Wallet-Based Order Tracking** — buyers on a Native Store can look up their own past orders by reconnecting their **Phantom** wallet — no account, no password. Each order links to its transaction on Solana Explorer for independent verification.
- **Seller Dashboard** — active products, stock levels, recent orders, and low-stock alerts, scoped per store. Merchant login/wallet connection uses **Privy**, supporting multiple Solana wallets and embedded/social login for store owners.
- **x402 Autonomous Agent Payments** — HTTP 402 payment-gated AI agent endpoint (`/api/x402/chat`) enabling software agents to autonomously pay for API access using USDC on Solana Devnet, complete with a live step-by-step interactive demo (`/x402-demo`).

---

## Technology Stack

### Frontend
- React (Vite), React Router DOM
- Solana web3.js + SPL Token libraries for building/signing transactions client-side via Phantom
- Deployed on Vercel

### Backend
- FastAPI (Python)
- Supabase (PostgreSQL) for stores, products, categories, and orders
- x402 Python SDK (`x402`) for HTTP-native payment-gated endpoints via the x402.org facilitator
- Solana Devnet RPC for building, sending, and verifying on-chain USDC transfers
- Deployed on Render

---

## Solana Pay Checkout (Native Stores) — How It Works

1. Buyer adds items to their bag (no wallet needed at this stage).
2. At checkout, buyer chooses:
   - **Scan & Pay** — a standard Solana Pay QR code (`solana:<recipient>?amount=...`) is generated. Any Solana wallet app (Phantom, Solflare, Backpack, Glow, etc.) can scan and complete payment on mobile.
   - **Pay with Connected Wallet** — a one-click flow using Phantom directly in-browser (`window.solana`) or their connected **Privy Wallet** (supporting embedded/social/email logins).
3. For the direct-browser path, the frontend builds a versioned transaction: creates the buyer's Associated Token Account if needed, and a `transferChecked` instruction moving USDC to the store's payout wallet — resolved **server-side** from the store's saved settings, never from client input.
4. Buyer approves the payment in their wallet (or via Privy's embedded signature overlay).
5. Backend polls Solana Devnet for on-chain confirmation, comparing pre/post token balances at the merchant's wallet to confirm the transfer actually landed.
6. Order status flips to `confirmed`, product stock decrements, and the buyer sees a confirmation screen with a link to view the transaction on Solana Explorer (Devnet).

**Wallet support today:**
| Flow | Supported wallets |
|---|---|
| QR code checkout (mobile) | Any Solana wallet app |
| Direct browser checkout | Phantom (`window.solana`) OR **Privy Embedded Wallet** (Email/Google/Social) |
| "My Orders" tracking lookup | Phantom only |
| Merchant/seller login (Store Builder & Dashboard) | Multiple wallets + social login, via Privy |

Direct Privy integration solves the mobile and browser-extension barrier: customers without Phantom installed can log in with their email, instantly spin up a Privy Solana embedded wallet, and execute the payment signature on-chain.

### Testing it yourself
- Get Devnet SOL (for fees): https://faucet.solana.com
- Get Devnet USDC on Circle's official devnet mint (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`): https://faucet.circle.com/
- Set Phantom to **Devnet** before testing.

---

## x402 Autonomous Agent Payments — How It Works

The **x402 protocol** is an HTTP-native payment standard that enables AI agents to autonomously pay for API resources and services using stablecoins on Solana without human intervention or manual approval prompts.

### What Selora Built
- **Payment-Gated AI Endpoint (`POST /api/x402/chat`)**: A payment-gated agent endpoint requiring `$0.001 USDC` per call. Unpaid requests return a standard `402 Payment Required` header containing machine-readable payment parameters (price, token mint, network, settlement address).
- **Autonomous Payment Loop**: An agent client decodes the 402 challenge, constructs and signs an SPL USDC transfer on Solana Devnet using its local keypair, and resends the request with a `PAYMENT-SIGNATURE` header. The server verifies and settles the payment on-chain via the `x402.org` facilitator and returns HTTP 200 with a `PAYMENT-RESPONSE` header.
- **Live Interactive Showcase**: A visual, step-by-step progress UI at [https://selora.fashion/x402-demo](https://selora.fashion/x402-demo) (or `/x402-demo` locally) where users can trigger the full agent-to-agent payment cycle live and watch the 5-stage loop execute in real time.
- **On-Chain Verification**: Verified on Solana Devnet with real USDC transactions.
  - *Verified Devnet Transaction*: [`3wfYtiCD64KnBG1iCWWm1WcRYGxxD3q4ZRtLAGusdGvAD7PS6nXUgGXLg7aivT9vVorRp64hHrMzYjTT71cHT1Jx`](https://explorer.solana.com/tx/3wfYtiCD64KnBG1iCWWm1WcRYGxxD3q4ZRtLAGusdGvAD7PS6nXUgGXLg7aivT9vVorRp64hHrMzYjTT71cHT1Jx?cluster=devnet)

### Technologies Involved
- **x402 Python SDK** (`x402`) — server middleware & SVM payment scheme signing
- **x402.org Facilitator** — on-chain verification & settlement service for SVM transactions
- **Solana Devnet & Circle USDC Mint** (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`)

---

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

`backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

SOLANA_RPC_URL=https://api.devnet.solana.com
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Optional LLM model overrides (defaults live in backend/llm_config.py)
AGENT_MODEL=openai/gpt-oss-120b
TITLE_MODEL=llama-3.1-8b-instant
```

```bash
uvicorn main:app --reload
```
API available at http://localhost:8000

### Database
Run the migration scripts located in `backend/migrations/` in your Supabase SQL Editor in numerical order (from `001_core_tables.sql` to `013_add_template_data_to_selora_stores.sql`). This creates the core store/product/category tables, buyer order tracking tables, and store theme customizer additions.

### Frontend
```bash
npm install
```

`.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

```bash
npm run dev
```
Open http://localhost:5173

---

## Project Structure

```
selora/
├── backend/
│   ├── migrations/            # Supabase SQL schema, incl. Solana orders table
│   ├── main.py                 # FastAPI routes: stores, products, categories, checkout
│   └── requirements.txt
├── src/
│   ├── components/
│   ├── lib/
│   │   ├── AppContext.jsx      # Global store/product/order state
│   │   └── supabase.js
│   ├── pages/
│   │   ├── Dashboard.jsx       # Seller dashboard
│   │   ├── StoreBuilder.jsx    # Store settings, hero images, categories, products
│   │   ├── Storefront.jsx      # Public buyer-facing storefront + Solana Pay checkout
│   │   ├── StorefrontOrders.jsx # Buyer-facing wallet-based order tracking (`/store/{handle}/orders`)
│   │   └── Orders.jsx          # Seller dashboard order management
│   └── App.jsx
├── package.json
└── vite.config.js
```

---

## Roadmap

- AI growth agent: automated repricing, listing copywriting, and restock alerts for connected stores
- Broaden direct-browser checkout and order lookup beyond Phantom, via `@solana/wallet-adapter-react`
- Solana Token Extensions loyalty tokens for Native Store buyers
- Expanded platform connections beyond Shopify

---

*Selora — built for fashion sellers who want a modern, AI-assisted storefront, on their platform of choice.*