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

---

## Technology Stack

### Frontend
- React (Vite), React Router DOM
- Solana web3.js + SPL Token libraries for building/signing transactions client-side via Phantom
- Deployed on Vercel

### Backend
- FastAPI (Python)
- Supabase (PostgreSQL) for stores, products, categories, and orders
- Solana Devnet RPC for building, sending, and verifying on-chain USDC transfers
- Deployed on Render

---

## Solana Pay Checkout (Native Stores) — How It Works

1. Buyer adds items to their bag (no wallet needed at this stage).
2. At checkout, buyer chooses:
   - **Scan & Pay** — a standard Solana Pay QR code (`solana:<recipient>?amount=...`) is generated. Any Solana wallet app (Phantom, Solflare, Backpack, Glow, etc.) can scan and complete payment on mobile.
   - **Pay with Connected Wallet** — a one-click desktop flow using Phantom directly in-browser (via `window.solana`).
3. For the direct-browser path, the frontend builds a versioned transaction: creates the buyer's Associated Token Account if needed, and a `transferChecked` instruction moving USDC to the store's payout wallet — resolved **server-side** from the store's saved settings, never from client input.
4. Buyer approves the payment in their wallet.
5. Backend polls Solana Devnet for on-chain confirmation, comparing pre/post token balances at the merchant's wallet to confirm the transfer actually landed.
6. Order status flips to `confirmed`, product stock decrements, and the buyer sees a confirmation screen with a link to view the transaction on Solana Explorer (Devnet).

**Wallet support today:**
| Flow | Supported wallets |
|---|---|
| QR code checkout (mobile) | Any Solana wallet app |
| Direct browser checkout (desktop) | Phantom only (`window.solana`) |
| "My Orders" tracking lookup | Phantom only |
| Merchant/seller login (Store Builder & Dashboard) | Multiple wallets + social login, via Privy |

Broadening direct-browser checkout and order lookup to other wallets (Solflare, Backpack, etc.) via `@solana/wallet-adapter-react` is on the roadmap.

### Testing it yourself
- Get Devnet SOL (for fees): https://faucet.solana.com
- Get Devnet USDC matching mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`: https://spl-token-faucet.com/?token-name=USDC-Dev
  *(Note: Circle's own devnet faucet uses a different mint and will NOT work with this checkout.)*
- Set Phantom to **Devnet** before testing.

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
- Agent-initiated payments via pay.sh / x402, enabling the AI growth agent to autonomously handle tasks like restocking or paid promotions on a seller's behalf
- Expanded platform connections beyond Shopify

---

*Selora — built for fashion sellers who want a modern, AI-assisted storefront, on their platform of choice.*