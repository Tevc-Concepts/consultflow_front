'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import DemoSwitch from '@shared/components/DemoSwitch';
import { useAppStore, type Currency, type AppState } from '@shared/state/app';

const companiesDemo = [
    { id: 'lagos', name: 'Lagos Retail Ltd', currency: 'NGN' },
    { id: 'accra', name: 'Accra Foods Ltd', currency: 'CFA' },
    { id: 'abuja', name: 'Abuja Tech Ltd', currency: 'USD' }
] as const;

export default function SettingsPage() {
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const setReportingCurrency = useAppStore((s: AppState) => s.setReportingCurrency);
    const consolidated = useAppStore((s: AppState) => s.consolidated);
    const setConsolidated = useAppStore((s: AppState) => s.setConsolidated);
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const setSelectedCompanyIds = useAppStore((s: AppState) => s.setSelectedCompanyIds);

    function toggleCompany(id: string) {
        const set = new Set(selectedCompanyIds);
        if (set.has(id)) set.delete(id); else set.add(id);
        setSelectedCompanyIds(Array.from(set));
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-deep-navy">Settings</h1>
                <DemoSwitch />
            </div>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Reporting</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-deep-navy/70">Reporting currency</label>
                        <select
                            value={reportingCurrency}
                            onChange={(e) => setReportingCurrency(e.target.value as Currency)}
                            className="mt-1 w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                        >
                            {(['NGN', 'USD', 'CFA'] as Currency[]).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={consolidated} onChange={(e) => setConsolidated(e.target.checked)} />
                            Consolidate across companies
                        </label>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Companies</h2>
                <ul className="divide-y divide-medium/60">
                    {companiesDemo.map(c => (
                        <li key={c.id} className="flex items-center justify-between py-2">
                            <div>
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-deep-navy/70">Currency: {c.currency}</div>
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={selectedCompanyIds.includes(c.id)} onChange={() => toggleCompany(c.id)} />
                                Include
                            </label>
                        </li>
                    ))}
                </ul>
                <div className="mt-2 text-xs text-deep-navy/70">Tip: select multiple companies then enable Consolidate to view group results.</div>
            </Card>
        </div>
    );
}
