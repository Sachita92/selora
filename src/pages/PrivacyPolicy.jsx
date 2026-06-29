import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'

export default function PrivacyPolicy() {
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

            <div className="site-page-container" style={{ padding: "4rem 1.5rem 6rem" }}>
                <div style={{ maxWidth: 760, margin: "0 auto" }}>

                {/* Header */}
                <div style={{ marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: ".72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--g)", marginBottom: ".6rem" }}>Legal</p>
                    <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", fontWeight: 500, color: "var(--dark)", letterSpacing: "-.3px", marginBottom: ".8rem" }}>Privacy Policy</h1>
                    <p style={{ fontSize: ".85rem", color: "var(--text-muted)", fontWeight: 300 }}>Last updated: January 1, 2025 &nbsp;·&nbsp; Effective: January 1, 2025</p>
                </div>

                <Section title="1. Introduction">
                    <P>Welcome to Selora ("we," "our," or "us"). Selora is an AI-powered e-commerce growth agent that helps online sellers automate and optimize their stores. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our platform, website, and services (collectively, the "Service").</P>
                    <P>By using Selora, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use our Service.</P>
                </Section>

                <Section title="2. Information We Collect">
                    <SubTitle>2.1 Information You Provide</SubTitle>
                    <UL items={[
                        "Account information: name, email address, and password when you register",
                        "Payment information: billing details processed securely through our payment provider (we do not store card numbers)",
                        "Store information: your e-commerce store URL and business details you provide during onboarding",
                        "Communications: messages you send us via support or email",
                    ]} />
                    <SubTitle>2.2 Information From Your Connected Stores</SubTitle>
                    <P>When you connect your e-commerce store to Selora, we access data through official platform APIs including:</P>
                    <UL items={[
                        "Product data: titles, descriptions, prices, inventory levels",
                        "Order data: order history, revenue figures, fulfillment status",
                        "Customer data: aggregated and anonymized customer behavior (we do not store individual customer personal data)",
                        "Advertising data: ad spend, impressions, clicks, and conversion data",
                    ]} />
                    <SubTitle>2.3 Automatically Collected Information</SubTitle>
                    <UL items={[
                        "Log data: IP address, browser type, pages visited, time spent on pages",
                        "Device information: device type, operating system, browser version",
                        "Cookies and similar tracking technologies (see Section 7)",
                    ]} />
                </Section>

                <Section title="3. How We Use Your Information">
                    <P>We use the information we collect to:</P>
                    <UL items={[
                        "Provide, operate, and improve the Selora Service",
                        "Power the AI agent to analyze your store and make optimization decisions",
                        "Send you daily growth reports and important account notifications",
                        "Process payments and manage your subscription",
                        "Respond to your support requests",
                        "Detect and prevent fraud, abuse, or security incidents",
                        "Comply with legal obligations",
                        "Improve our machine learning models to better serve all users (using anonymized, aggregated data only)",
                    ]} />
                </Section>

                <Section title="4. How We Share Your Information">
                    <P>We do not sell your personal information. We may share your information only in the following circumstances:</P>
                    <SubTitle>4.1 Service Providers</SubTitle>
                    <P>We share data with trusted third-party service providers who help us operate the Service, including cloud hosting providers, payment processors, and analytics tools. These providers are contractually bound to protect your data.</P>
                    <SubTitle>4.2 Platform Integrations</SubTitle>
                    <P>When you authorize Selora to connect to your e-commerce store (e.g. Shopify, Amazon), data is exchanged with those platforms in accordance with your authorization and their respective terms of service.</P>
                    <SubTitle>4.3 Legal Requirements</SubTitle>
                    <P>We may disclose your information if required by law, court order, or government authority, or to protect the rights, property, or safety of Selora, our users, or the public.</P>
                    <SubTitle>4.4 Business Transfers</SubTitle>
                    <P>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your data is transferred and becomes subject to a different privacy policy.</P>
                </Section>

                <Section title="5. Data Storage and Security">
                    <P>Selora is operated from Nepal and our servers are hosted with reputable cloud providers. Your data may be processed in countries outside of Nepal, including the United States and European Union. By using our Service, you consent to this transfer.</P>
                    <P>We implement industry-standard security measures including:</P>
                    <UL items={[
                        "Encryption of data in transit (TLS/SSL) and at rest (AES-256)",
                        "Secure, access-controlled infrastructure",
                        "Regular security audits and vulnerability assessments",
                        "Strict internal access controls — only authorized personnel can access your data",
                    ]} />
                    <P>No method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</P>
                </Section>

                <Section title="6. Data Retention">
                    <P>We retain your personal information for as long as your account is active or as needed to provide the Service. If you close your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.</P>
                    <P>Store data (products, orders, analytics) fetched from connected platforms is retained for up to 12 months to power historical analysis. You may request deletion at any time.</P>
                </Section>

                <Section title="7. Cookies">
                    <P>We use cookies and similar technologies to:</P>
                    <UL items={[
                        "Keep you logged in to your account",
                        "Remember your preferences",
                        "Understand how you use the Service (analytics)",
                        "Improve performance and user experience",
                    ]} />
                    <P>You can control cookies through your browser settings. Disabling cookies may affect some functionality of the Service.</P>
                </Section>

                <Section title="8. Your Rights">
                    <P>You have the following rights regarding your personal data:</P>
                    <UL items={[
                        "Access: request a copy of the personal data we hold about you",
                        "Correction: request that we correct inaccurate or incomplete data",
                        "Deletion: request that we delete your personal data",
                        "Portability: request your data in a machine-readable format",
                        "Objection: object to certain types of data processing",
                        "Withdraw consent: withdraw consent at any time where processing is based on consent",
                    ]} />
                    <P>To exercise any of these rights, contact us at privacy@selora.com. We will respond within 30 days.</P>
                </Section>

                <Section title="9. Children's Privacy">
                    <P>Selora is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will delete it immediately.</P>
                </Section>

                <Section title="10. Third-Party Links">
                    <P>Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party services you visit.</P>
                </Section>

                <Section title="11. Changes to This Policy">
                    <P>We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page and notify you by email or through the Service. Your continued use of Selora after changes are posted constitutes your acceptance of the updated policy.</P>
                </Section>

                <Section title="12. Contact Us" last>
                    <P>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</P>
                    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", marginTop: "1rem" }}>
                        <p style={{ fontSize: ".88rem", color: "var(--text)", lineHeight: 1.9 }}>
                            <strong>Selora</strong><br />
                            Email: <a href="mailto:privacy@selora.com" style={{ color: "var(--g)" }}>privacy@selora.com</a><br />
                            Support: <a href="mailto:support@selora.com" style={{ color: "var(--g)" }}>support@selora.com</a><br />
                            Location: Kathmandu, Nepal
                        </p>
                    </div>
                </Section>

                </div>
            </div>

            {/* FOOTER */}
            <footer style={{ borderTop: "1px solid var(--border)", padding: "1.8rem 4rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-bg)", flexWrap: "wrap", gap: "1rem" }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--dark)" }}>Se<span style={{ color: "var(--g)" }}>lo</span>ra</div>
                </Link>
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