import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'

export default function Terms() {
    const [darkMode, toggleTheme] = useDarkMode()
    return (
        <div className="landing-page" style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "Inter, sans-serif", color: "var(--text)" }}>

            {/* NAV */}
            <nav style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--border)", padding: "1rem 3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, backdropFilter: 'blur(14px)' }}>
                <Link to="/" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--dark)", textDecoration: "none", fontFamily: "Inter, sans-serif" }}>
                    Se<span style={{ color: "var(--g)" }}>lo</span>ra
                </Link>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  {/* Dark-mode toggle */}
                  <button
                    className="cn-theme-toggle"
                    onClick={toggleTheme}
                    title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:".25rem",borderRadius:6}}
                  >
                    {darkMode ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                  </button>
                  <Link to="/support" className="cn-nav-link" style={{ fontSize: ".82rem", color: "var(--nav-link)", textDecoration: "none" }}>Support</Link>
                </div>
            </nav>

            {/* CONTENT */}
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

                {/* Header */}
                <div style={{ marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: ".72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--g)", marginBottom: ".6rem" }}>Legal</p>
                    <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", fontWeight: 500, color: "var(--dark)", letterSpacing: "-.3px", marginBottom: ".8rem" }}>Terms of Service</h1>
                    <p style={{ fontSize: ".85rem", color: "var(--text-muted)", fontWeight: 300 }}>Last updated: January 1, 2025 &nbsp;·&nbsp; Effective: January 1, 2025</p>
                </div>

                <Section title="1. Agreement to Terms">
                    <P>These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Selora ("we," "our," or "us"), governing your access to and use of the Selora platform, website, and AI-powered e-commerce services (collectively, the "Service").</P>
                    <P>By creating an account or using the Service, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, do not use the Service.</P>
                    <P>You must be at least 18 years old and capable of forming a legally binding contract to use Selora.</P>
                </Section>

                <Section title="2. Description of Service">
                    <P>Selora is an AI-powered growth agent for e-commerce sellers. The Service connects to your online store(s) via official third-party APIs and provides automated features including:</P>
                    <UL items={[
                        "Automated pricing adjustments based on market conditions",
                        "AI-generated product listing improvements",
                        "Advertising campaign optimization and budget management",
                        "Inventory monitoring and restock alerts",
                        "Sales analytics and growth reporting",
                    ]} />
                    <P>Selora acts on your behalf based on goals and parameters you configure. You remain solely responsible for your store, products, pricing, and compliance with your platform's policies.</P>
                </Section>

                <Section title="3. Account Registration">
                    <P>To use Selora, you must create an account. You agree to:</P>
                    <UL items={[
                        "Provide accurate, complete, and current information during registration",
                        "Maintain the security of your account credentials",
                        "Notify us immediately of any unauthorized access to your account",
                        "Be responsible for all activity that occurs under your account",
                    ]} />
                    <P>We reserve the right to suspend or terminate accounts that provide false information or violate these Terms.</P>
                </Section>

                <Section title="4. Connecting Third-Party Platforms">
                    <P>Selora integrates with third-party e-commerce platforms (such as Shopify, Amazon, eBay, and others) through their official APIs. By connecting your store, you:</P>
                    <UL items={[
                        "Authorize Selora to access and act on your store data as described in our Privacy Policy",
                        "Confirm that you have the right and authority to grant such access",
                        "Acknowledge that your use of those platforms remains subject to their own terms of service",
                        "Understand that Selora is not affiliated with, endorsed by, or officially partnered with those platforms unless explicitly stated",
                    ]} />
                    <P>You may revoke Selora's access to your connected stores at any time through your account settings or directly through the third-party platform.</P>
                </Section>

                <Section title="5. Acceptable Use">
                    <P>You agree to use the Service only for lawful purposes. You must not:</P>
                    <UL items={[
                        "Use Selora to violate any applicable law or regulation",
                        "Use the Service to engage in fraudulent, deceptive, or manipulative practices",
                        "Attempt to gain unauthorized access to our systems or other users' accounts",
                        "Reverse engineer, decompile, or disassemble any part of the Service",
                        "Use the Service to scrape, harvest, or collect data from third-party platforms in violation of their terms",
                        "Resell or sublicense access to the Service without our written permission",
                        "Interfere with or disrupt the integrity or performance of the Service",
                    ]} />
                </Section>

                <Section title="6. Subscription and Payments">
                    <SubTitle>6.1 Plans</SubTitle>
                    <P>Selora offers paid subscription plans (Seed, Bloom, Forest) billed monthly or annually. Plan details and pricing are listed on our pricing page and may change with 30 days' notice.</P>
                    <SubTitle>6.2 Free Trial</SubTitle>
                    <P>We offer a 14-day free trial for new users. No credit card is required to start. At the end of the trial, you will need to select a paid plan to continue using the Service.</P>
                    <SubTitle>6.3 Billing</SubTitle>
                    <P>Subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as described in our refund policy. You authorize us to charge your payment method on a recurring basis.</P>
                    <SubTitle>6.4 Cancellation</SubTitle>
                    <P>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. You will retain access to the Service until that date.</P>
                </Section>

                <Section title="7. AI-Powered Actions and Your Responsibility">
                    <P>Selora uses artificial intelligence to make recommendations and take automated actions on your store. You acknowledge and agree that:</P>
                    <UL items={[
                        "AI decisions are based on data and algorithms and may not always be optimal",
                        "You are responsible for reviewing and approving significant actions before they take effect (where review options are provided)",
                        "Selora is a tool to assist you — final business decisions remain your responsibility",
                        "We are not liable for business outcomes, lost revenue, or platform penalties resulting from AI-driven actions",
                        "You should regularly review your account settings, thresholds, and agent activity logs",
                    ]} />
                </Section>

                <Section title="8. Intellectual Property">
                    <SubTitle>8.1 Our IP</SubTitle>
                    <P>The Selora platform, including its software, design, AI models, and content, is owned by Selora and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our written permission.</P>
                    <SubTitle>8.2 Your Content</SubTitle>
                    <P>You retain ownership of your store data and content. By using Selora, you grant us a limited, non-exclusive license to access and process your store data solely to provide the Service. We do not claim ownership of your products, listings, or business data.</P>
                    <SubTitle>8.3 Feedback</SubTitle>
                    <P>If you submit feedback or suggestions about the Service, you grant us the right to use that feedback without any obligation to you.</P>
                </Section>

                <Section title="9. Disclaimer of Warranties">
                    <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, SELORA DISCLAIMS ALL WARRANTIES INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</P>
                    <P>We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We do not guarantee specific business results from using the Service.</P>
                </Section>

                <Section title="10. Limitation of Liability">
                    <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SELORA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.</P>
                    <P>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 3 MONTHS PRECEDING THE CLAIM.</P>
                </Section>

                <Section title="11. Indemnification">
                    <P>You agree to indemnify, defend, and hold harmless Selora and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights or platform policies.</P>
                </Section>

                <Section title="12. Termination">
                    <P>We may suspend or terminate your access to the Service at any time, with or without notice, if we believe you have violated these Terms or for any other reason at our sole discretion.</P>
                    <P>Upon termination, your right to use the Service ceases immediately. We will delete your data in accordance with our Privacy Policy. Sections 8, 9, 10, and 11 survive termination.</P>
                </Section>

                <Section title="13. Governing Law">
                    <P>These Terms are governed by the laws of Nepal, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in Kathmandu, Nepal.</P>
                    <P>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</P>
                </Section>

                <Section title="14. Changes to Terms">
                    <P>We may update these Terms from time to time. When we do, we will update the "Last updated" date and notify you by email or through the Service at least 14 days before changes take effect for material changes. Your continued use of the Service after changes are effective constitutes your acceptance of the updated Terms.</P>
                </Section>

                <Section title="15. Contact Us" last>
                    <P>If you have any questions about these Terms, please contact us:</P>
                    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", marginTop: "1rem" }}>
                        <p style={{ fontSize: ".88rem", color: "var(--text)", lineHeight: 1.9 }}>
                            <strong>Selora</strong><br />
                            Email: <a href="mailto:legal@selora.com" style={{ color: "var(--g)" }}>legal@selora.com</a><br />
                            Support: <a href="mailto:support@selora.com" style={{ color: "var(--g)" }}>support@selora.com</a><br />
                            Location: Kathmandu, Nepal
                        </p>
                    </div>
                </Section>

            </div>

            {/* FOOTER */}
            <footer style={{ borderTop: "1px solid var(--border)", padding: "1.8rem 4rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-bg)", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--dark)" }}>Se<span style={{ color: "var(--g)" }}>lo</span>ra</div>
                <div style={{ display: "flex", gap: "1.8rem", flexWrap: "wrap" }}>
                    {[
                        { label: "Privacy Policy", href: "/privacy" },
                        { label: "Terms of Service", href: "/terms" },
                        { label: "Support", href: "/support" },
                        { label: "Contact", href: "/support" },
                    ].map(l => (
                        <Link key={l.label} to={l.href} style={{ fontSize: ".74rem", color: "var(--text-muted)", textDecoration: "none", marginLeft: "1.8rem" }}>{l.label}</Link>
                    ))}
                </div>
                <div style={{ fontSize: ".7rem", color: "#c0c8c1" }}>© 2025 Selora. All rights reserved.</div>
            </footer>

        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, children, last }) {
    return (
        <div style={{ marginBottom: last ? 0 : "2.5rem", paddingBottom: last ? 0 : "2.5rem", borderBottom: last ? "none" : "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "1.2rem", fontWeight: 500, color: "var(--dark)", marginBottom: "1rem", letterSpacing: "-.2px" }}>{title}</h2>
            {children}
        </div>
    );
}
function SubTitle({ children }) {
    return <h3 style={{ fontSize: ".88rem", fontWeight: 600, color: "var(--text)", margin: "1.2rem 0 .5rem", fontFamily: "Inter, sans-serif" }}>{children}</h3>;
}
function P({ children }) {
    return <p style={{ fontSize: ".86rem", color: "var(--text-secondary)", lineHeight: 1.85, fontWeight: 300, marginBottom: ".8rem" }}>{children}</p>;
}
function UL({ items }) {
    return (
        <ul style={{ paddingLeft: "1.2rem", marginBottom: ".8rem" }}>
            {items.map((item, i) => (
                <li key={i} style={{ fontSize: ".86rem", color: "var(--text-secondary)", lineHeight: 1.85, fontWeight: 300, marginBottom: ".3rem" }}>{item}</li>
            ))}
        </ul>
    );
}