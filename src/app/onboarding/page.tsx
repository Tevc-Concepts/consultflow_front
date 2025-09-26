'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useAppStore, type AppState, type Currency } from '@shared/state/app';
import { useNotifications } from '@shared/state/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import getApi from '@shared/api/client';

type Step = 1 | 2 | 3 | 4 | 5;

interface CompanyData {
    id: string;
    name: string;
    currency: string;
}

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
    const dataSource = useAppStore((s: AppState) => s.dataSource);
    const demoMode = useAppStore((s: AppState) => s.demoMode);

    const [step, setStep] = React.useState<Step>(1);
    const [role, setRole] = React.useState<'Consultant' | 'Client' | null>(null);
    const [mode, setMode] = React.useState<'demo' | 'connect' | null>('demo');
    const [companies, setCompanies] = React.useState<CompanyData[]>([]);
    const [loadingCompanies, setLoadingCompanies] = React.useState(false);
    const [supportedCurrencies, setSupportedCurrencies] = React.useState<string[]>(['NGN', 'USD', 'ZAR']);
    const notify = useNotifications(s => s.add);

    // Load companies when stepping to company selection
    React.useEffect(() => {
        if (step === 3 && companies.length === 0) {
            loadCompanies();
        }
    }, [step]);

    const loadCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const api = getApi();
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const endpoint = dataSource === 'demo' ? '/api/demo/companies' : 
                           dataSource === 'localDb' ? '/api/local/companies' : 
                           '/api/companies';
            
            const response = await api.get(endpoint);
            const companiesData = response.data.items || response.data || [];
            setCompanies(companiesData);
            
            // Extract unique currencies from companies
            const uniqueCurrencies = [...new Set(companiesData.map((c: CompanyData) => c.currency))] as Currency[];
            const allCurrencies = ['NGN', 'USD', ...uniqueCurrencies.filter(c => c !== 'NGN' && c !== 'USD')] as Currency[];
            setSupportedCurrencies([...new Set(allCurrencies)]);
            
        } catch (error) {
            console.error('Failed to load companies:', error);
            // Fallback to empty array - user will see loading state
        } finally {
            setLoadingCompanies(false);
        }
    };

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
        if (role) useAppStore.getState().setRole(role);
        setConsolidated(selectedCompanyIds.length > 1 ? true : consolidated);
        setOnboardingComplete(true);
        notify({ title: 'Welcome to Consultflow', message: `Role: ${role ?? 'Consultant'} • Mode: ${mode}`, kind: 'success' });
        
        // Role-based routing
        if (role === 'Client') {
            router.push('/client');
        } else {
            router.push('/dashboard');
        }
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
                                    <button onClick={() => { setRole('Consultant'); useAppStore.getState().setRole('Consultant'); }} className={["card p-4 text-left", role === 'Consultant' ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                        <div className="font-medium">Consultant</div>
                                        <div className="text-sm text-deep-navy/70">Financial advisory, multi-company consolidation, and client management.</div>
                                    </button>
                                    <button onClick={() => { setRole('Client'); useAppStore.getState().setRole('Client'); }} className={["card p-4 text-left", role === 'Client' ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                        <div className="font-medium">Client</div>
                                        <div className="text-sm text-deep-navy/70">Business owner or finance team member. View your company&apos;s KPIs, reports, and financial insights.</div>
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
                                <p className="text-deep-navy/70 mt-1">Select one or more African companies from our portfolio. Consolidation enables multi-entity reporting.</p>
                                {loadingCompanies ? (
                                    <div className="mt-3 py-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt mx-auto mb-2"></div>
                                        <div className="text-sm text-deep-navy/70">Loading companies...</div>
                                    </div>
                                ) : companies.length === 0 ? (
                                    <div className="mt-3 py-8 text-center">
                                        <div className="text-4xl mb-2">⚠️</div>
                                        <div className="text-sm text-deep-navy/70">No companies available. Please try again.</div>
                                        <Button variant="ghost" size="sm" onClick={loadCompanies} className="mt-2">Retry</Button>
                                    </div>
                                ) : (
                                    <ul className="mt-3 divide-y divide-medium/60">
                                        {companies.map((c) => (
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
                                )}
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
                                    {supportedCurrencies.map((c) => (
                                        <button key={c} onClick={() => setReportingCurrency(c as Currency)} className={["card p-4 text-center", reportingCurrency === c ? 'ring-2 ring-cobalt' : ''].join(' ')}>
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
                                <p className="text-deep-navy/70 mt-1">We&rsquo;ll load your home page with your personalized configuration.</p>
                                <ul className="mt-3 text-sm text-deep-navy/80 list-disc pl-5">
                                    <li>Role: <span className="font-medium">{role}</span></li>
                                    <li>Mode: <span className="font-medium">{mode}</span></li>
                                    <li>Companies: <span className="font-medium">{selectedCompanyIds.length}</span> selected {selectedCompanyIds.length > 1 ? "(Consolidated)" : ""}</li>
                                    <li>Reporting currency: <span className="font-medium">{reportingCurrency}</span></li>
                                </ul>
                                <div className="mt-4 flex justify-between">
                                    <Button variant="ghost" onClick={back}>Back</Button>
                                    <Button onClick={finish}>Go to Home</Button>
                                </div>
                            </section>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
