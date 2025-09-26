import Image from 'next/image';
import Link from 'next/link';
import Button from '@components/ui/Button';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="gradient-hero">
                <div className="container py-4 md:py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="md:hidden inline-flex items-center">
                            <Image
                                src="/images/consultflow_primary.png"
                                alt="Consultflow logo"
                                width={40}
                                height={40}
                                priority
                                sizes="(max-width: 768px) 40px"
                                className="h-10 w-auto"
                            />
                        </span>
                        <span className="hidden md:inline-flex items-center">
                            <Image
                                src="/images/consultflow_primary.png"
                                alt="Consultflow"
                                width={220}
                                height={40}
                                priority
                                sizes="(min-width: 768px) 220px"
                                className="h-10 w-auto"
                            />
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-4 text-white/95">
                        <Link href="#features" className="hover:underline">Features</Link>
                        <Link href="#reports" className="hover:underline">Reports</Link>
                        <Link href="#compliance" className="hover:underline">Compliance</Link>
                        <Link href="#integrations" className="hover:underline">Integrations</Link>
                        <Link href="/login" className="ml-2">
                            <Button variant="ghost" className="text-white hover:bg-white/10">Sign in</Button>
                        </Link>
                        <Link href="/onboarding">
                            <Button>Try the demo</Button>
                        </Link>
                    </nav>
                </div>
                {/* Hero */}
                <div className="container pb-10 md:pb-16">
                    <div className="max-w-3xl">
                        <h1 className="text-white">Consolidated, explainable finance for modern firms.</h1>
                        <p className="mt-3 text-white/95 text-lg">
                            Multi-entity consolidation in NGN, USD, or CFA. Beautiful P&L, Balance Sheet, and Cash Flow with drill‑downs, forecasting, Nigeria 2025 tax compliance, and a client portal—packed into a fast, offline‑ready PWA.
                        </p>
                        <div className="mt-5 flex flex-col sm:flex-row gap-3">
                            <Link href="/onboarding"><Button size="lg">Start in demo mode</Button></Link>
                            <Link href="/dashboard"><Button size="lg" variant="ghost" className="text-white hover:bg-white/10">View dashboard</Button></Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Feature highlights */}
            <section id="features" className="container -mt-6 md:-mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <article className="primary-card pad-responsive" aria-label="Consolidation + Multi-currency">
                        <h2>Consolidation & multi‑currency</h2>
                        <p className="mt-2 text-white/90">One click to consolidate entities. Report in NGN, USD, or CFA with monthly FX rates.</p>
                    </article>
                    <article className="card p-5" aria-label="Forecasting">
                        <h2>Forecasting & scenarios</h2>
                        <p className="mt-2">Baseline projections with quick what‑ifs. Spot trends and steer decisions.</p>
                    </article>
                    <article className="card p-5" aria-label="AI Assistant">
                        <h2>AI that explains</h2>
                        <p className="mt-2">Ask in plain English. “Explain like I’m a CEO/CFO/Accountant.” Clear summaries and commentary.</p>
                    </article>
                </div>
            </section>

            {/* Product sections */}
            <section id="reports" className="container mt-8 md:mt-12 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <article className="card p-5" aria-label="Reports">
                        <h3>Reports your board will read</h3>
                        <p className="mt-2">P&amp;L, Balance Sheet, and Cash Flow with date pickers, compare modes, and touch‑friendly drill‑downs.</p>
                        <ul className="mt-3 text-sm list-disc pl-5 space-y-1 text-deep-navy/90">
                            <li>Dashboard KPIs: Revenue, Gross Profit, Net Income, Cash, Burn.</li>
                            <li>Report Builder: drag &amp; drop blocks into a slide deck.</li>
                            <li>Export: generate a clean PDF presentation.</li>
                        </ul>
                        <div className="mt-4 flex gap-2">
                            <Link href="/reports"><Button size="sm">See sample reports</Button></Link>
                            <Link href="/builder"><Button size="sm" variant="ghost">Open Report Builder</Button></Link>
                        </div>
                    </article>
                    <article className="card p-5" aria-label="Client Portal">
                        <h3>Client portal & approvals</h3>
                        <p className="mt-2">Share reports securely, collect comments, and capture approvals with a simple timeline.</p>
                        <ul className="mt-3 text-sm list-disc pl-5 space-y-1 text-deep-navy/90">
                            <li>Commenting &amp; mentions</li>
                            <li>Approval flow with status badges</li>
                            <li>Notifications for updates</li>
                        </ul>
                        <div className="mt-4"><Link href="/client"><Button size="sm">Visit Client Portal</Button></Link></div>
                    </article>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <article id="compliance" className="card p-5" aria-label="Nigeria 2025 Compliance">
                        <h3>Nigeria tax compliance (2025)</h3>
                        <p className="mt-2">VAT, PAYE, WHT, and CIT forms prefilled from your data. A compliance calendar keeps you on time.</p>
                        <div className="mt-4"><Link href="/compliance"><Button size="sm">Preview Compliance</Button></Link></div>
                    </article>
                    <article className="card p-5" aria-label="Bank sync & upload mapping">
                        <h3>Bank sync & reconciliation</h3>
                        <p className="mt-2">Mock bank feeds for demos. Upload CSV/Excel with a smart mapping preview and quick data‑cleaning.</p>
                        <div className="mt-4 flex gap-2">
                            <Link href="/upload"><Button size="sm">Upload a file</Button></Link>
                            <Link href="/forecast"><Button size="sm" variant="ghost">Open Forecast</Button></Link>
                        </div>
                    </article>
                </div>
            </section>

            {/* Integrations & PWA */}
            <section id="integrations" className="container mt-8 md:mt-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <article className="card p-5" aria-label="Integrations">
                        <h3>Integrations</h3>
                        <p className="mt-2">ERPNext, QuickBooks, and Xero—toggle connectors in Settings to simulate pulls for demos.</p>
                        <div className="mt-4"><Link href="/settings"><Button size="sm">Open Settings</Button></Link></div>
                    </article>
                    <article className="card p-5" aria-label="Offline PWA">
                        <h3>Offline‑first PWA</h3>
                        <p className="mt-2">Fast, installable, and resilient. Works great during travel or low connectivity.</p>
                        <p className="mt-2 text-sm text-deep-navy/80">Runs with demo or local SQLite today; switch to a Frappe backend for production.</p>
                    </article>
                    <article className="card p-5" aria-label="Role switch">
                        <h3>Consultant ↔ Client</h3>
                        <p className="mt-2">Role‑aware UI so both sides stay aligned—from KPIs to approvals.</p>
                        <div className="mt-4"><Link href="/dashboard"><Button size="sm">Explore Dashboard</Button></Link></div>
                    </article>
                </div>
            </section>

            {/* CTA footer */}
            <section id="contact" className="container my-10 md:my-14">
                <div className="rounded-2xl shadow-soft bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-2xl">Ready to explore?</h3>
                        <p className="text-deep-navy/80 mt-1">Start with rich demo data. Toggle to local SQLite or connect Frappe later.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/onboarding"><Button size="lg">Try the demo</Button></Link>
                        <Link href="/login"><Button size="lg" variant="ghost">Request access</Button></Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
