# Selora

> Your store grows while you sleep.

Selora is an AI-powered e-commerce growth agent that automatically handles pricing, listings, ads, and inventory — so every day you wake up to a store that's a little better than yesterday.

---

## What Selora Does

| Feature | Description |
|---|---|
| **Smart Pricing** | Monitors the market 24/7 and adjusts prices automatically to stay competitive without hurting margins |
| **Listing Optimizer** | Rewrites product titles and descriptions to be clearer, more searchable, and more convincing |
| **Ad Management** | Shifts ad budget away from what isn't working and toward what is |
| **Growth Reports** | Plain-English daily summary of how your store grew and what the agent did |
| **Inventory Alerts** | Tracks sell-through rate and warns you before you run out of stock |
| **Full Transparency** | Every action the agent takes is logged and explained — you're always in control |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Fonts | Fraunces (headings) + Inter (body) |
| Routing | React Router DOM |
| Deployment | Vercel |
| AI Agent | Claude (Anthropic API) — coming soon |
| Database | PostgreSQL — coming soon |
| Backend | Node.js — coming soon |

---

## Project Structure

```
selora/
├── public/
├── src/
│   ├── pages/
│   │   ├── PrivacyPolicy.jsx     # Privacy Policy page
│   │   └── Terms.jsx             # Terms of Service page
│   ├── App.jsx                   # Routes
│   ├── Selora.jsx                # Main landing page
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles (Tailwind)
├── index.html
├── vercel.json                   # SPA routing fix for Vercel
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone git@github.com:Sachita92/selora.git
cd selora

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# Push to main branch — Vercel auto-deploys
git add .
git commit -m "your message"
git push
```

---

## Pages

| Route | Page |
|---|---|
| `/` | Landing page |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

---

## Contributing

This project is currently in private development. Contribution guidelines will be added when the project opens up.

---

## Legal

- [Privacy Policy](https://selora.vercel.app/privacy)
- [Terms of Service](https://selora.vercel.app/terms)

---

## Contact

- Email: support@selora.com
- Location: Kathmandu, Nepal

---

*Built with ☘️ in Nepal*