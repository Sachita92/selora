// Selora.jsx — Landing Page
// ─────────────────────────
// Setup:
//   1. npm create vite@latest selora -- --template react
//   2. cd selora && npm install
//   3. npm install -D tailwindcss @tailwindcss/vite
//   4. vite.config.js → add: import tailwindcss from '@tailwindcss/vite'
//                              plugins: [react(), tailwindcss()]
//   5. src/index.css → replace with: @import "tailwindcss";
//   6. index.html <head> → add:
//      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
//   7. src/App.jsx → replace with:
//      import Selora from './Selora'
//      export default function App() { return <Selora /> }

import { useState, useEffect } from "react";

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    :root {
      --g: #5A8A67;
      --g2: #78A885;
      --gpale: #EDF3EE;
      --gborder: #D4E4D7;
      --bg: #F8FAF8;
      --bg2: #F1F5F1;
      --card: #fff;
      --border: #E4EBE5;
      --dark: #1A271C;
      --text: #2E3D30;
      --muted: #7B907D;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
      font-size: 15px;
    }
    h1, h2, h3, h4 { font-family: 'Fraunces', serif; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: .3; transform: scale(1.7); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-7px); }
    }

    .au  { animation: fadeUp .65s ease both; }
    .au1 { animation: fadeUp .65s .08s ease both; }
    .au2 { animation: fadeUp .65s .18s ease both; }
    .au3 { animation: fadeUp .65s .28s ease both; }
    .au4 { animation: fadeUp .65s .42s ease both; }
    .pdot  { animation: pulse 2.2s infinite; }
    .float { animation: float 4.5s ease-in-out infinite; }

    .hero-blob {
      position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
      width: 800px; height: 500px;
      background: radial-gradient(ellipse, rgba(90,138,103,.11) 0%, transparent 68%);
      pointer-events: none;
    }
    .hero-dots {
      position: absolute; inset: 0;
      background-image: radial-gradient(circle, rgba(90,138,103,.13) 1px, transparent 1px);
      background-size: 28px 28px;
      mask-image: radial-gradient(ellipse 75% 65% at 50% 25%, black 15%, transparent 80%);
      pointer-events: none;
    }
    .cta-glow {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 650px; height: 320px;
      background: radial-gradient(ellipse, rgba(90,138,103,.22), transparent 70%);
      pointer-events: none;
    }

    .feat-card {
      background: #fff; border: 1px solid var(--border);
      border-radius: 14px; padding: 1.8rem;
      transition: all .22s; position: relative; overflow: hidden;
    }
    .feat-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, var(--g), var(--g2));
      opacity: 0; transition: opacity .3s;
    }
    .feat-card:hover { border-color: var(--gborder); transform: translateY(-3px); box-shadow: 0 8px 28px rgba(90,138,103,.09); }
    .feat-card:hover::before { opacity: 1; }

    .price-featured {
      border-color: var(--g) !important;
      background: linear-gradient(140deg, #fff, #F3F8F4) !important;
    }
    .price-featured::before {
      content: 'Most popular';
      position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
      background: var(--g); color: #fff; font-size: .6rem; font-weight: 700;
      letter-spacing: .08em; padding: .28rem .9rem; border-radius: 999px;
      text-transform: uppercase; font-family: 'Inter', sans-serif;
    }
  `}</style>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const NAV_LINKS = ["Features", "How It Works", "Pricing", "Docs"];

const TRUST = [
  { icon: "🔒", text: "Bank-level security" },
  { icon: "⚡", text: "Ready in under 5 minutes" },
  { icon: "🤝", text: "Any e-commerce store" },
  { icon: "💬", text: "Real human support" },
  { icon: "🔄", text: "Cancel anytime" },
];

const STATS = [
  { num: "32K+", label: "Stores Growing" },
  { num: "$4B+", label: "Revenue Grown" },
  { num: "3.8x", label: "Avg Growth Rate" },
  { num: "99%",  label: "Uptime" },
];

const FEATURES = [
  { icon: "💰", title: "Smarter Pricing",           desc: "Selora watches the market around the clock and nudges your prices to stay competitive — without ever hurting your margins." },
  { icon: "✍️", title: "Stronger Listings",          desc: "It rewrites your product titles and descriptions to be clearer and more convincing — the kind of copy that turns browsers into buyers." },
  { icon: "📣", title: "Leaner Ad Spend",            desc: "Selora shifts your ad budget away from what isn't working and toward what is — so every dollar you spend works harder for you." },
  { icon: "📊", title: "Clear Growth Reports",       desc: "A plain-English daily summary of how your store grew, what changed, and what Selora is doing next. No dashboards to decode." },
  { icon: "📦", title: "Stock That Never Runs Out",  desc: "Selora tracks how fast your products sell and warns you before you run out — so you never lose a sale to an empty shelf." },
  { icon: "🛡️", title: "You're Always in Charge",   desc: "Every action Selora takes is logged and explained. Approve, adjust, or pause anything at any time — it's your store, always." },
];

const STEPS = [
  { title: "Connect Your Store",    desc: "Link Selora to your e-commerce store in one click. It reads your products, orders, and ads — and gets to work immediately." },
  { title: "Set Your Growth Goal",  desc: "Tell Selora what growth means to you — more revenue, better margins, or lower ad costs. It builds a plan around your goal." },
  { title: "Wake Up to Growth",     desc: "Selora works through the night, every night. Each morning you get a simple report showing exactly what grew and why." },
];

const ACTIVITY = [
  { text: "Adjusted prices on 23 products",          time: "2am" },
  { text: "Paused 2 low-performing ads · saved $14", time: "3am" },
  { text: "Rewrote listing for Blue Tote Bag",        time: "4am" },
  { text: "Restock reminder: Canvas Sneakers low",    time: "6am" },
];

const PLANS = [
  {
    name: "Seed", price: "49",
    desc: "For new sellers planting the first seeds of growth.",
    features: ["1 Store", "Up to 200 Products", "Auto Pricing", "Growth Reports", "Email Support"],
    featured: false, cta: "Get Started",
  },
  {
    name: "Bloom", price: "149",
    desc: "For growing stores ready to put growth on full autopilot.",
    features: ["3 Stores", "Unlimited Products", "Full Growth Agent", "Ad Optimization", "Listing Rewriter", "Priority Support"],
    featured: true, cta: "Start Free Trial",
  },
  {
    name: "Forest", price: null,
    desc: "For large brands and agencies managing many stores at once.",
    features: ["Unlimited Stores", "Custom Agent Setup", "Dedicated Manager", "Onboarding Help", "SLA Guarantee"],
    featured: false, cta: "Talk to Us",
  },
];

const TESTIMONIALS = [
  { quote: "I used to spend hours updating prices every day. Now Selora does it while I sleep and I'm honestly making more money than before.", name: "James K.",  role: "Handmade goods seller", initials: "JK" },
  { quote: "I'm not technical at all. Selora was so easy to set up and within a month my sales were up 40%. I wish I'd found it sooner.",       name: "Sarah R.", role: "Fashion store owner",    initials: "SR" },
  { quote: "Selora rewrote my product descriptions and my click-through rate jumped almost immediately. The growth reports are actually useful.", name: "Marcus P.", role: "Electronics reseller",   initials: "MP" },
];

// ─── Shared primitives ────────────────────────────────────────────────────────
const s = {
  section:  { padding: "5.5rem 4rem", maxWidth: 1160, margin: "0 auto" },
  tag:      { fontSize: ".68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--g)", marginBottom: ".7rem", fontFamily: "Inter, sans-serif" },
  title:    { fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-.3px", marginBottom: ".7rem", color: "var(--dark)", fontFamily: "Fraunces, serif" },
  sub:      { fontSize: ".9rem", color: "var(--muted)", lineHeight: 1.8, fontWeight: 300 },
};

const Tag   = ({ children, center, style }) => <p style={{ ...s.tag,   textAlign: center ? "center" : undefined, ...style }}>{children}</p>;
const Title = ({ children, center, style }) => <h2 style={{ ...s.title, textAlign: center ? "center" : undefined, ...style }}>{children}</h2>;
const Sub   = ({ children, center, style }) => <p style={{ ...s.sub,   textAlign: center ? "center" : undefined, maxWidth: 440, margin: center ? "0 auto" : undefined, ...style }}>{children}</p>;

const BtnPrimary   = ({ children, style, onClick }) => (
  <button onClick={onClick} style={{ background: "var(--g)", color: "#fff", padding: ".8rem 2rem", borderRadius: 8, fontSize: ".92rem", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 18px rgba(90,138,103,.28)", fontFamily: "Inter, sans-serif", transition: "all .2s", ...style }}>
    {children}
  </button>
);
const BtnSecondary = ({ children, style, onClick }) => (
  <button onClick={onClick} style={{ background: "#fff", color: "var(--dark)", padding: ".8rem 2rem", borderRadius: 8, fontSize: ".92rem", fontWeight: 500, border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all .2s", ...style }}>
    {children}
  </button>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ scrolled }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 3.5rem",
      background: scrolled ? "rgba(248,250,248,.97)" : "rgba(248,250,248,.88)",
      backdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--border)",
      transition: "background .3s",
    }}>
      <div style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-.3px", color: "var(--dark)", fontFamily: "Inter, sans-serif" }}>
        Se<span style={{ color: "var(--g)" }}>lo</span>ra
      </div>
      <div style={{ display: "flex" }}>
        {NAV_LINKS.map(l => (
          <a key={l} href="#" style={{ fontSize: ".82rem", fontWeight: 500, color: "var(--muted)", textDecoration: "none", marginLeft: "2rem" }}>{l}</a>
        ))}
      </div>
      <button style={{ background: "var(--g)", color: "#fff", padding: ".5rem 1.3rem", borderRadius: 7, fontSize: ".82rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
        Get Started Free
      </button>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "8rem 2rem 4rem", position: "relative", overflow: "hidden", background: "linear-gradient(170deg,#EEF4EF 0%,var(--bg) 55%)" }}>
      <div className="hero-blob" />
      <div className="hero-dots" />

      <div className="au" style={{ display: "inline-flex", alignItems: "center", gap: ".45rem", background: "#fff", border: "1px solid var(--border)", color: "var(--g)", padding: ".35rem 1rem", borderRadius: 999, fontSize: ".72rem", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: "1.8rem", boxShadow: "0 2px 10px rgba(90,138,103,.08)", fontFamily: "Inter, sans-serif" }}>
        <span className="pdot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--g)" }} />
        Works with any e-commerce store
      </div>

      <h1 className="au1" style={{ fontSize: "clamp(2.4rem,5.5vw,4.4rem)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-.5px", maxWidth: 750, marginBottom: "1.3rem", color: "var(--dark)", fontStyle: "italic" }}>
        Your store grows<br /><em style={{ fontStyle: "normal", color: "var(--g)" }}>while you sleep</em>
      </h1>

      <p className="au2" style={{ fontSize: ".97rem", color: "var(--muted)", maxWidth: 480, lineHeight: 1.8, marginBottom: "2.2rem", fontWeight: 300 }}>
        Selora is your always-on growth agent. It quietly handles pricing, listings, ads, and inventory — so every day you wake up to a store that's a little better than yesterday.
      </p>

      <div className="au3" style={{ display: "flex", gap: ".9rem", flexWrap: "wrap", justifyContent: "center" }}>
        <BtnPrimary>Start Growing for Free →</BtnPrimary>
        <BtnSecondary>See How It Works</BtnSecondary>
      </div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────
function TrustBar() {
  return (
    <div className="au4" style={{ background: "#fff", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "1rem 4rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" }}>
      {TRUST.map(t => (
        <div key={t.text} style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".78rem", color: "var(--muted)", fontWeight: 400 }}>
          <span>{t.icon}</span>{t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <div style={{ display: "flex", justifyContent: "center", background: "var(--bg2)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
      {STATS.map((s, i) => (
        <div key={i} style={{ flex: 1, minWidth: 140, textAlign: "center", padding: "2rem 1.5rem", borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none" }}>
          <div style={{ fontSize: "2rem", fontWeight: 600, color: "var(--dark)", fontFamily: "Fraunces, serif", letterSpacing: "-.5px" }}>{s.num}</div>
          <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: ".25rem", textTransform: "uppercase", letterSpacing: ".08em" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section style={s.section}>
      <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 3rem" }}>
        <Tag center>What Selora Does</Tag>
        <Title center>Six ways Selora grows<br />your store every day</Title>
        <Sub center>Each one runs automatically in the background — no input needed from you.</Sub>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.2rem" }}>
        {FEATURES.map(f => (
          <div key={f.title} className="feat-card">
            <div style={{ width: 40, height: 40, background: "var(--gpale)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", marginBottom: "1.1rem" }}>{f.icon}</div>
            <h3 style={{ fontSize: ".92rem", fontWeight: 600, marginBottom: ".45rem", color: "var(--dark)", fontFamily: "Inter, sans-serif" }}>{f.title}</h3>
            <p style={{ fontSize: ".8rem", color: "var(--muted)", lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function Dashboard() {
  return (
    <div className="float" style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "0 18px 55px rgba(90,138,103,.11)" }}>
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: ".8rem 1.1rem", display: "flex", alignItems: "center", gap: ".45rem" }}>
        {["#f87171","#fbbf24","#4ade80"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        <span style={{ marginLeft: ".7rem", fontSize: ".72rem", color: "var(--muted)", fontWeight: 600 }}>Selora · Growth Dashboard</span>
      </div>
      <div style={{ padding: "1.3rem" }}>
        <p style={{ fontSize: ".68rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".8rem" }}>This Morning's Growth</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".7rem", marginBottom: "1.1rem" }}>
          {[["$4,821","Revenue","↑ 18% today"],["247","Orders","↑ 12% today"],["3.1%","Conversion","↑ 0.4% today"]].map(([val, lbl, chg]) => (
            <div key={lbl} style={{ background: "var(--bg2)", borderRadius: 9, padding: ".85rem", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--dark)", fontFamily: "Fraunces, serif", letterSpacing: "-.3px" }}>{val}</div>
              <div style={{ fontSize: ".62rem", color: "var(--muted)", marginTop: ".15rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{lbl}</div>
              <div style={{ fontSize: ".65rem", color: "var(--g)", fontWeight: 600, marginTop: ".25rem" }}>{chg}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: ".68rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".8rem" }}>What Selora Did Overnight</p>
        {ACTIVITY.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: ".55rem .7rem", background: "var(--bg2)", borderRadius: 7, fontSize: ".72rem", border: "1px solid var(--border)", marginBottom: i < ACTIVITY.length - 1 ? ".45rem" : 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", flexShrink: 0 }} />
            <span style={{ flex: 1, color: "var(--text)" }}>{a.text}</span>
            <span style={{ color: "var(--muted)", fontSize: ".65rem" }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "5.5rem 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 4rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>
        <div>
          <Tag>How It Works</Tag>
          <Title>Three steps to a<br />self-growing store</Title>
          <Sub style={{ marginBottom: "2.2rem" }}>No technical setup. No learning curve. If you can fill out a form, you can run Selora.</Sub>
          <div>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "1.1rem", padding: "1.5rem 0", borderBottom: i < STEPS.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 30, height: 30, minWidth: 30, background: "var(--g)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 700 }}>
                  {i + 1}
                </div>
                <div>
                  <h4 style={{ fontSize: ".88rem", fontWeight: 600, marginBottom: ".3rem", color: "var(--dark)", fontFamily: "Inter, sans-serif" }}>{step.title}</h4>
                  <p style={{ fontSize: ".79rem", color: "var(--muted)", lineHeight: 1.7, fontWeight: 300 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Dashboard />
      </div>
    </div>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  return (
    <section style={{ ...s.section, borderTop: "1px solid var(--border)" }}>
      <div style={{ textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
        <Tag center>Pricing</Tag>
        <Title center>Grow first, pay as you scale</Title>
        <Sub center>Start free. No contracts, no hidden fees, no surprises.</Sub>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.3rem", marginTop: "3rem" }}>
        {PLANS.map(plan => (
          <div key={plan.name} className={plan.featured ? "price-featured" : ""} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "2rem", position: "relative", transition: "all .2s" }}>
            <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: ".7rem" }}>{plan.name}</div>
            {plan.price ? (
              <div style={{ fontSize: "2.5rem", fontWeight: 600, color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1, letterSpacing: "-.5px" }}>
                <sup style={{ fontSize: "1rem", verticalAlign: "super", color: "var(--g)" }}>$</sup>
                {plan.price}
                <span style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 400, fontFamily: "Inter, sans-serif" }}>/mo</span>
              </div>
            ) : (
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "var(--dark)", fontFamily: "Fraunces, serif" }}>Custom</div>
            )}
            <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: ".65rem 0 1.2rem", fontWeight: 300, lineHeight: 1.6 }}>{plan.desc}</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: ".55rem", marginBottom: "1.6rem" }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: ".78rem", color: "var(--text)", display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <span style={{ color: "var(--g)", fontWeight: 700, fontSize: ".82rem" }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button style={{
              width: "100%", padding: ".72rem", borderRadius: 8,
              fontWeight: 600, fontSize: ".82rem", cursor: "pointer",
              fontFamily: "Inter, sans-serif", transition: "all .2s",
              ...(plan.featured
                ? { background: "var(--g)", color: "#fff", border: "1px solid var(--g)", boxShadow: "0 4px 18px rgba(90,138,103,.28)" }
                : { background: "transparent", color: "var(--dark)", border: "1px solid var(--border)" })
            }}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "5.5rem 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <Tag center>From Real Sellers</Tag>
          <Title center>Stores that bloom with Selora</Title>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.2rem" }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 13, padding: "1.6rem", transition: "all .2s" }}>
              <div style={{ color: "var(--g)", fontSize: ".82rem", marginBottom: ".7rem", letterSpacing: 2 }}>★★★★★</div>
              <p style={{ fontSize: ".81rem", color: "var(--muted)", lineHeight: 1.8, fontWeight: 300, marginBottom: "1.2rem", fontStyle: "italic" }}>"{t.quote}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,var(--g),#3b6647)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 700, color: "#fff" }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--dark)" }}>{t.name}</div>
                  <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <div style={{ textAlign: "center", padding: "6rem 4rem", position: "relative", overflow: "hidden", background: "linear-gradient(140deg,var(--dark) 0%,#233329 100%)" }}>
      <div className="cta-glow" />
      <div style={{ position: "relative" }}>
        <Tag center style={{ color: "#86EFAC" }}>Start Growing Today</Tag>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(1.9rem,4vw,3rem)", fontWeight: 500, color: "#fff", margin: ".5rem 0 1rem", lineHeight: 1.15, letterSpacing: "-.3px", fontStyle: "italic" }}>
          Every night, Selora works.<br />
          <span style={{ color: "#86EFAC", fontStyle: "normal" }}>Every morning, you grow.</span>
        </h2>
        <p style={{ color: "#8FA891", fontSize: ".9rem", marginBottom: "2.2rem", fontWeight: 300 }}>
          Join 32,000+ sellers already growing with Selora. 14-day free trial — no credit card needed.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <BtnPrimary style={{ background: "#86EFAC", color: "var(--dark)", boxShadow: "0 4px 20px rgba(134,239,172,.25)" }}>
            Start Growing for Free →
          </BtnPrimary>
          <BtnSecondary style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.18)" }}>
            Book a Demo
          </BtnSecondary>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 4rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", flexWrap: "wrap", gap: "1rem" }}>
      <div style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--dark)", fontFamily: "Inter, sans-serif" }}>
        Se<span style={{ color: "var(--g)" }}>lo</span>ra
      </div>
      <div>
        {[
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Support", href: "#" },
          { label: "Docs", href: "#" },
          { label: "Contact", href: "#" },
        ].map(l => (
          <a key={l.label} href={l.href} style={{ fontSize: ".74rem", color: "var(--muted)", textDecoration: "none", marginLeft: "1.8rem" }}>{l.label}</a>
        ))}
      </div>
      <div style={{ fontSize: ".7rem", color: "#c0c8c1" }}>© 2025 Selora. All rights reserved.</div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Selora() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <GlobalStyles />
      <Navbar scrolled={scrolled} />
      <Hero />
      <TrustBar />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}