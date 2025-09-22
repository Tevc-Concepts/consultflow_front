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
                                src="/images/consultflow_stacked.jpg"
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
                                src="/images/consultflow_secondary.jpg"
                                alt="Consultflow"
                                width={220}
                                height={40}
                                priority
                                sizes="(min-width: 768px) 220px"
                                className="h-10 w-auto"
                            />
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-4 text-white/90">
                        <Link href="#about" className="hover:underline">About</Link>
                        <Link href="#features" className="hover:underline">Features</Link>
                        <Link href="#contact" className="hover:underline">Contact</Link>
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
                        <h1 className="text-white">Finance reports your clients love.</h1>
                        <p className="mt-3 text-white/90 text-lg">
                            Multi-entity consolidation, multi-currency P&L, Balance Sheet, and Cash Flow — with forecasting, compliance, and a client portal. All in a fast, offline-ready PWA.
                        </p>
                        <div className="mt-5 flex flex-col sm:flex-row gap-3">
                            <Link href="/onboarding"><Button size="lg">Start in demo mode</Button></Link>
                            <Link href="/reports"><Button size="lg" variant="ghost" className="text-white hover:bg-white/10">See reports</Button></Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Feature highlights */}
            <section id="features" className="container -mt-6 md:-mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <article className="primary-card pad-responsive" aria-label="Multi-currency & FX">
                        <h2>Multi‑currency, sane FX</h2>
                        <p className="mt-2 text-white/90">Report in NGN, USD, or CFA. FX is applied per month using stored rates.</p>
                    </article>
                    <article className="card p-5" aria-label="Consolidation">
                        <h2>Consolidation</h2>
                        <p className="mt-2">Select multiple companies to auto-consolidate KPIs and reports. Toggle on/off anytime.</p>
                    </article>
                    <article className="card p-5" aria-label="Offline-first PWA">
                        <h2>Offline‑first</h2>
                        <p className="mt-2">Demo data and adjustments live locally. Works great as a PWA on the go.</p>
                    </article>
                </div>
            </section>

            {/* Role-based sections */}
            <section id="about" className="container mt-8 md:mt-12 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <article className="card p-5 gradient-donor" aria-label="Donors">
                        <h3 className="text-deep-navy">Donors</h3>
                        <p className="mt-2 text-deep-navy/90">Impact reporting with Coral + Amber accents, exports, and PDF slides.</p>
                    </article>
                    <article className="card p-5 gradient-volunteer" aria-label="NGOs & Volunteers">
                        <h3>NGOs & Volunteers</h3>
                        <p className="mt-2">Forest Green + Teal themed flows for logistics, needs, and compliance.</p>
                    </article>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <article className="card p-5 gradient-logistics" aria-label="Corporate & Logistics">
                        <h3 className="text-white">Corporate & Logistics</h3>
                        <p className="mt-2 text-white/90">Deep Navy + Cobalt. Sync banks, reconcile, and track burn.</p>
                    </article>
                    <article className="card p-5" aria-label="Client Portal">
                        <h3>Client Portal</h3>
                        <p className="mt-2">Share reports, comment, approve. Simple annotation included.</p>
                    </article>
                </div>
            </section>

            {/* CTA footer */}
            <section id="contact" className="container my-10 md:my-14">
                <div className="rounded-2xl shadow-soft bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-2xl">Ready to explore?</h3>
                        <p className="text-deep-navy/70 mt-1">Start with rich demo data. You can connect to real systems later.</p>
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
