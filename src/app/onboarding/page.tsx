'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useAppStore, type AppState, type Currency } from '@shared/state/app';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const demoCompanies = [
    { id: 'lagos', name: 'Lagos Retail Ltd', currency: 'NGN' },
    { id: 'accra', name: 'Accra Foods Ltd', currency: 'CFA' },
    { id: 'abuja', name: 'Abuja Tech Ltd', currency: 'USD' }
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
    const router = useRouter();
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const setSelectedCompanyIds = useAppStore((s: AppState) => s.setSelectedCompanyIds);
    const consolidated = useAppStore((s: AppState) => s.consolidated);
    const setConsolidated = useAppStore((s: AppState) => s.setConsolidated);
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const setReportingCurrency = useAppStore((s: AppState) => s.setReportingCurrency);
    const setDemoMode = useAppStore((s: AppState) => s.setDemoMode);
    const setOnboardingComplete = useAppStore((s: AppState) => s.setOnboardingComplete);

    const [step, setStep] = React.useState<Step>(1);
    const [role, setRole] = React.useState<'Consultant' | 'Client' | null>(null);
    const [mode, setMode] = React.useState<'demo' | 'connect' | null>('demo');

    function toggleCompany(id: string) {
        const set = new Set(selectedCompanyIds);
        if (set.has(id)) set.delete(id); else set.add(id);
        setSelectedCompanyIds(Array.from(set));
    }

    function next() {
        // Simple guardrails
        if (step === 3 && selectedCompanyIds.length === 0) return;
        if (step === 4 && !reportingCurrency) return;
        setStep((s) => (Math.min(5, (s + 1)) as Step));
    }
    function back() { setStep((s) => (Math.max(1, (s - 1)) as Step)); }

    function finish() {
        // Persist demo mode if chosen
        setDemoMode(mode !== 'connect');
        setConsolidated(selectedCompanyIds.length > 1 ? true : consolidated);
        setOnboardingComplete(true);
        router.push('/dashboard');
    }

    return (
        <div className="min-h-screen gradient-hero">
            <div className="container py-6 md:py-10 max-w-3xl">
                <Card className="p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-brand-start to-brand-end text-white p-5 md:p-6">
                        <h1>Welcome to Consultflow</h1>
                        <p className="text-white/90 mt-1">A quick setup to personalize your demo. You can change these later in Settings.</p>
                    </div>
                    <div className="p-4 md:p-6">
                        {step === 1 && (
                            <section>
                                <h2 className="text-xl font-semibold">Your role</h2>
                                <p className="text-deep-navy/70 mt-1">Choose how you’ll use Consultflow today.</p>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button onClick={() => setRole('Consultant')} className={["card p-4 text-left", role === 'Consultant' ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                        <div className="font-medium">Consultant</div>
                                        <div className="text-sm text-deep-navy/70">Manage multiple clients, consolidate entities.</div>
                                    </button>
                                    <button onClick={() => setRole('Client')} className={["card p-4 text-left", role === 'Client' ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                        <div className="font-medium">Client</div>
                                        <div className="text-sm text-deep-navy/70">Single company view, simple KPIs and reporting.</div>
                                    </button>
                                </div>
                                <div className="mt-4 flex justify-between">
                                    <Link href="/"><Button variant="ghost">Back</Button></Link>
                                    <Button onClick={() => setStep(2)} disabled={!role}>Continue</Button>
                                </div>
                            </section>
                        )}

                        {step === 2 && (
                            <section>
                                <h2 className="text-xl font-semibold">Use demo data or connect</h2>
                                <p className="text-deep-navy/70 mt-1">Start instantly with rich demo data. You can connect real systems later.</p>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button onClick={() => setMode('demo')} className={["card p-4 text-left", mode === 'demo' ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                        <div className="font-medium">Demo mode</div>
                                        <div className="text-sm text-deep-navy/70">Fully offline, local adjustments, 24‑month history.</div>
                                    </button>
                                    <button onClick={() => setMode('connect')} className={["card p-4 text-left", mode === 'connect' ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                        <div className="font-medium">Connect data</div>
                                        <div className="text-sm text-deep-navy/70">Set up connectors (ERPNext, QuickBooks, Xero). (Demo only)</div>
                                    </button>
                                </div>
                                <div className="mt-4 flex justify-between">
                                    <Button variant="ghost" onClick={back}>Back</Button>
                                    <Button onClick={next} disabled={!mode}>Continue</Button>
                                </div>
                            </section>
                        )}

                        {step === 3 && (
                            <section>
                                <h2 className="text-xl font-semibold">Choose companies</h2>
                                <p className="text-deep-navy/70 mt-1">Select one or more demo companies. Consolidation toggles automatically.</p>
                                <ul className="mt-3 divide-y divide-medium/60">
                                    {demoCompanies.map((c) => (
                                        <li key={c.id} className="flex items-center justify-between py-2">
                                            <div>
                                                <div className="font-medium">{c.name}</div>
                                                <div className="text-xs text-deep-navy/70">Currency: {c.currency}</div>
                                            </div>
                                            <label className="inline-flex items-center gap-2 text-sm">
                                                <input aria-label={`Include ${c.name}`} type="checkbox" checked={selectedCompanyIds.includes(c.id)} onChange={() => toggleCompany(c.id)} /> Include
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 flex justify-between">
                                    <Button variant="ghost" onClick={back}>Back</Button>
                                    <Button onClick={() => { setConsolidated(selectedCompanyIds.length > 1); next(); }} disabled={selectedCompanyIds.length === 0}>Continue</Button>
                                </div>
                            </section>
                        )}

                        {step === 4 && (
                            <section>
                                <h2 className="text-xl font-semibold">Reporting currency</h2>
                                <p className="text-deep-navy/70 mt-1">Choose how amounts are displayed across the app.</p>
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {(['NGN', 'USD', 'CFA'] as Currency[]).map((c) => (
                                        <button key={c} onClick={() => setReportingCurrency(c)} className={["card p-4 text-center", reportingCurrency === c ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                            <div className="font-medium">{c}</div>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-between">
                                    <Button variant="ghost" onClick={back}>Back</Button>
                                    <Button onClick={next}>Continue</Button>
                                </div>
                            </section>
                        )}

                        {step === 5 && (
                            <section>
                                <h2 className="text-xl font-semibold">All set</h2>
                                <p className="text-deep-navy/70 mt-1">We’ll load your dashboard with your demo configuration.</p>
                                <ul className="mt-3 text-sm text-deep-navy/80 list-disc pl-5">
                                    <li>Role: <span className="font-medium">{role}</span></li>
                                    <li>Mode: <span className="font-medium">{mode}</span></li>
                                    <li>Companies: <span className="font-medium">{selectedCompanyIds.length}</span> selected {selectedCompanyIds.length > 1 ? '(Consolidated)' : ''}</li>
                                    <li>Reporting currency: <span className="font-medium">{reportingCurrency}</span></li>
                                </ul>
                                <div className="mt-4 flex justify-between">
                                    <Button variant="ghost" onClick={back}>Back</Button>
                                    <Button onClick={finish}>Go to dashboard</Button>
                                </div>
                            </section>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
