'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import DemoSwitch from '@shared/components/DemoSwitch';
import { useAppStore, type Currency, type AppState } from '@shared/state/app';
import OutboxPanel from '@shared/components/OutboxPanel';
import getApi from '@shared/api/client';

interface CompanyData {
    id: string;
    name: string;
    currency: string;
}

interface ExchangeRate {
    month: string;
    rates: {
        NGN_USD: number;
        KES_USD: number;
        ZAR_USD: number;
        GHS_USD: number;
        MAD_USD: number;
        NGN_ZAR: number;
        KES_NGN: number;
        GHS_MAD: number;
    };
}

export default function SettingsPage() {
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const setReportingCurrency = useAppStore((s: AppState) => s.setReportingCurrency);
    const consolidated = useAppStore((s: AppState) => s.consolidated);
    const setConsolidated = useAppStore((s: AppState) => s.setConsolidated);
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const setSelectedCompanyIds = useAppStore((s: AppState) => s.setSelectedCompanyIds);
    const role = useAppStore((s: AppState) => s.role);
    const setRole = useAppStore((s: AppState) => s.setRole);

    const [companies, setCompanies] = React.useState<CompanyData[]>([]);
    const [loadingCompanies, setLoadingCompanies] = React.useState(false);
    const [supportedCurrencies, setSupportedCurrencies] = React.useState<Currency[]>(['NGN', 'USD', 'CFA']);
    const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([]);
    const [loadingRates, setLoadingRates] = React.useState(false);
    const [editingRate, setEditingRate] = React.useState<string | null>(null);
    const [tempRates, setTempRates] = React.useState<any>({});

    // Load companies on mount
    React.useEffect(() => {
        loadCompanies();
        loadExchangeRates();
    }, []);

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
        } finally {
            setLoadingCompanies(false);
        }
    };

    const loadExchangeRates = async () => {
        setLoadingRates(true);
        try {
            const api = getApi();
            const response = await api.get('/api/local/exchange-rates');
            if (response.data.success) {
                setExchangeRates(response.data.rates);
            }
        } catch (error) {
            console.error('Failed to load exchange rates:', error);
        } finally {
            setLoadingRates(false);
        }
    };

    const updateExchangeRate = async (month: string, rates: any) => {
        try {
            const api = getApi();
            await api.put('/api/local/exchange-rates', { month, rates });
            await loadExchangeRates(); // Reload rates
            setEditingRate(null);
            setTempRates({});
        } catch (error) {
            console.error('Failed to update exchange rate:', error);
        }
    };

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
                            {supportedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={consolidated} onChange={(e) => setConsolidated(e.target.checked)} />
                            Consolidate across companies
                        </label>
                    </div>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-deep-navy/70">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'Consultant' | 'Client')}
                            className="mt-1 w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                        >
                            <option value="Consultant">Consultant</option>
                            <option value="Client">Client</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Companies</h2>
                {loadingCompanies ? (
                    <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt mx-auto mb-2"></div>
                        <div className="text-sm text-deep-navy/70">Loading companies...</div>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="py-8 text-center text-sm text-deep-navy/70">
                        No companies available
                    </div>
                ) : (
                    <ul className="divide-y divide-medium/60">
                        {companies.map(c => (
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
                )}
                <div className="mt-2 text-xs text-deep-navy/70">Tip: select multiple companies then enable Consolidate to view group results.</div>
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">Exchange Rates</h2>
                    <Button 
                        variant="ghost" 
                        onClick={loadExchangeRates}
                        disabled={loadingRates}
                    >
                        {loadingRates ? 'Loading...' : 'Refresh'}
                    </Button>
                </div>
                <div className="text-xs text-deep-navy/70 mb-3">
                    Exchange rates used for multi-currency reporting and consolidation
                </div>
                
                {loadingRates ? (
                    <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt mx-auto mb-2"></div>
                        <div className="text-sm text-deep-navy/70">Loading exchange rates...</div>
                    </div>
                ) : exchangeRates.length === 0 ? (
                    <div className="py-8 text-center text-sm text-deep-navy/70">
                        No exchange rates available
                    </div>
                ) : (
                    <div className="space-y-2">
                        {exchangeRates.slice(0, 6).map((rate, index) => (
                            <div key={rate.month} className="border border-medium/30 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium">
                                        {new Date(rate.month + '-01').toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long' 
                                        })}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (editingRate === rate.month) {
                                                setEditingRate(null);
                                                setTempRates({});
                                            } else {
                                                setEditingRate(rate.month);
                                                setTempRates(rate.rates);
                                            }
                                        }}
                                    >
                                        {editingRate === rate.month ? 'Cancel' : 'Edit'}
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                                    {(['NGN_USD', 'KES_USD', 'ZAR_USD', 'GHS_USD', 'MAD_USD'] as const).map(rateKey => (
                                        <div key={rateKey} className="flex items-center justify-between">
                                            <span className="text-deep-navy/70 text-xs">
                                                {rateKey.replace('_', '/')}:
                                            </span>
                                            {editingRate === rate.month ? (
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={tempRates[rateKey] || 0}
                                                    onChange={(e) => setTempRates({
                                                        ...tempRates,
                                                        [rateKey]: parseFloat(e.target.value) || 0
                                                    })}
                                                    className="w-20 px-2 py-1 text-xs border border-medium/60 rounded"
                                                />
                                            ) : (
                                                <span className="font-mono">
                                                    {rate.rates[rateKey]?.toFixed(2) || '0.00'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {editingRate === rate.month && (
                                    <div className="flex justify-end gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            onClick={() => updateExchangeRate(rate.month, tempRates)}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Mock email outbox */}
            <OutboxPanel />
        </div>
    );
}

// Note: Pages in Next.js App Router should not export arbitrary named components.
