# Selora Fashion Platform

> Your store grows while you sleep.

Selora is a world-class luxury AI-powered growth platform for e-commerce. Built with a premium forest green editorial design, it automates pricing, listing copywriting, inventory alerts, and growth reporting for Shopify merchants. 

The application is a fully integrated SaaS platform combining a React frontend, a Python (FastAPI) backend API, a Supabase (PostgreSQL) database, and Stripe subscription billing.

---

## Current Status & Key Features

- **Multi-Store Dashboard**: Displays sales metrics, agent activity logs, and growth reports. Features an interactive **Connected Stores switcher at the top** to instantly reload the active store's data across the frontend.
- **Smart Repricing & Copymriting Agent**: A background execution engine using LLMs (Groq API) to reprice products within defined guardrails, optimize listings with high-fashion copy, and trigger restock alerts.
- **Interactive AI Chat Widget**: A persistent chat drawer on the dashboard allowing merchants to speak directly with Selora to query product info, adjust prices, list new items, or delete products.
- **Shopify OAuth Integration**: Automatic merchant onboarding and store authorization.
- **Stripe Billing System**: Fully integrated Free, Growth, and Scale billing tiers with Stripe checkout redirects and customer subscription portals.
- **Supabase Integration**: Centralized storage for user sessions, connected store configurations, chat history, and optimization logs.

---

## Technology Stack

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router DOM (v6)
- **State Management**: React Context (`AppContext`, `ChatContext`)
- **Styling**: Premium Custom Vanilla CSS (Forest Green & Ivory themes)
- **Deployment**: Vercel configuration (`vercel.json`)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn
- **E-Commerce Adapter**: Shopify API (REST & OAuth)
- **AI Engine**: Groq SDK / LLM (Tool-Calling enabled)
- **Database client**: Supabase Python SDK
- **Billing Provider**: Stripe Python SDK

---

## Project Structure

```
selora/
├── backend/                  # Python FastAPI API & Agent code
│   ├── adapters/             # E-commerce platform connectors (ShopifyAdapter)
│   ├── agent/                # LLM system prompts and tool calling definitions
│   ├── migrations/           # Database migration SQL schema scripts
│   ├── auth.py               # Shopify HMAC security & OAuth helpers
│   ├── database.py           # Supabase DB operations and model mapping
│   ├── main.py               # FastAPI router and background tasks setup
│   └── requirements.txt      # Python dependencies
├── src/                      # React Frontend codebase
│   ├── assets/               # Brand assets & images
│   ├── components/
│   │   ├── ChatWidget.jsx     # Conversational AI drawer widget
│   │   └── SidebarLayout.jsx  # Primary navigation and chat session menu
│   ├── lib/
│   │   ├── AppContext.jsx     # Global user, store list, and activeStore context
│   │   ├── ChatContext.jsx    # Conversation state & session list context
│   │   └── supabase.js        # Supabase client credentials initialization
│   ├── pages/
│   │   ├── LandingPage.jsx    # Public marketing page (Selora.jsx)
│   │   ├── Dashboard.jsx      # Analytics charts, logs, and stores panel
│   │   ├── Products.jsx       # Inventory grid and sorting controls
│   │   ├── Settings.jsx       # Repricing guardrails & schedule options
│   │   ├── Connect.jsx        # Shopify onboarding page
│   │   ├── Login.jsx          # Elegant split-screen authorization
│   │   └── ...                # Pricing, support, and public pages
│   ├── App.css
│   ├── App.jsx                # SPA Route configuration
│   └── index.css              # Theme colors & fonts variables
├── index.html
├── package.json
└── vite.config.js
```

---

## Setup & Configuration

### 1. Database Setup (Supabase)
Initialize your database by running the SQL scripts located in `backend/migrations/` in your Supabase SQL Editor:
1. `create_stripe_subscriptions.sql` - Sets up users, stores, logs, and reports tables.
2. `create_chat_messages.sql` - Creates chat message logs and sessions tracking.
3. `create_support_and_demo.sql` - Creates support requests and demo bookers.

### 2. Backend Setup
Navigate to the `backend` directory and configure the `.env` file:

```bash
cd backend
```

Create a `backend/.env` file:
```env
GROQ_API_KEY=your_groq_api_key
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_secret
SHOPIFY_APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_GROWTH=price_growth_id
STRIPE_PRICE_SCALE=price_scale_id
```

Run the backend:
```bash
# Set up a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```
The API will be available at [http://localhost:8000](http://localhost:8000).

### 3. Frontend Setup
Navigate to the root directory and configure the frontend `.env` file:

Create a `.env` file in the root:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run the frontend client:
```bash
# Install packages
npm install

# Run Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Solana Pay Checkout Integration (Native Storefronts)

We have added a native **Solana Pay Checkout** system for Selora Native storefronts. Shoppers can add multiple items to their Cart/Bag and check out using **USDC on Solana Devnet**.

### 1. Database Setup
Ensure you apply the new migration in your Supabase SQL Editor:
* `backend/migrations/009_solana_pay_orders.sql` — Creates the `selora_orders` table and adds `payout_wallet_address` to `selora_stores`.

### 2. Environment Variables
Add the following configuration parameters to your environment files:

**Backend (`backend/.env`)**:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Frontend (`.env`)**:
```env
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 3. How to Test End-to-End
1. **Configure Payout Address**: 
   - Add a Solana wallet address to the `payout_wallet_address` column in the `selora_stores` table for your store, or ensure your developer login wallet address is populated in the `users.wallet_address` table.
2. **Shop on storefront**:
   - Go to your native store URL (e.g. `http://localhost:5173/store/your-store-handle`).
   - Add items to your bag. The product detail modal will close and the **Your Bag** drawer will slide out from the right.
3. **Pay with Solana**:
   - Click **Pay with Solana (USDC)**.
   - A Solana Pay Devnet payment session is initialized:
     - **Connected Wallet (Desktop)**: If you are signed in with Privy and have a connected Solana wallet, you can click **Pay with Connected Wallet** to build and sign the transfer transaction directly in-browser.
     - **QR Code (Mobile)**: Scan the QR code with Phantom/Solflare mobile wallet set to Devnet.
4. **Verification & Fulfillment**:
   - The frontend automatically polls the backend endpoint `/api/checkout/solana/verify/{reference}`.
   - The backend checks Devnet block confirmations for token balance changes owned by the merchant's wallet.
   - Once confirmed, the order status shifts to `paid` in `selora_orders`, a `purchase` event is logged in `selora_events`, the cart is cleared, and a checkmark success screen is rendered.

---

## Production Build & Deployments
- Build Vite assets for production: `npm run build`
- Frontend is configured to deploy directly to Vercel (using the `vercel.json` rewrite settings to enable clean client-side routing).

*Built for premium e-commerce growth.*