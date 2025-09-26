'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { KPI } from '@components/ui/KPI';
import RechartsLineChart from '@shared/components/LineChart';
import getApi from '@shared/api/client';
import { useAppStore, type AppState, convertAmount, formatCurrency } from '@shared/state/app';
import { useNotifications } from '@shared/state/notifications';

type KPIKey = 'revenue' | 'grossProfit' | 'netIncome' | 'cashBalance' | 'burnRate';

type KPIItem = {
    key: KPIKey;
    label: string;
    value: number;
    delta: number;
};

type TimeseriesPoint = {
    date: string;
    revenue: number;
    expenses: number;
};

type ReportsResponse = {
    companies?: Array<{ id: string; name: string; currency: string }>;
    kpis?: KPIItem[];
    series?: TimeseriesPoint[];
    exchangeRates?: Array<{ month: string; usd: number; cfa: number }>;
};

export default function ClientDashboardPage() {
    const role = useAppStore((s: AppState) => s.role);
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const notify = useNotifications(s => s.add);
    
    const [data, setData] = React.useState<ReportsResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [clientCompany, setClientCompany] = React.useState<string>('');

    // For clients, we'll use the first selected company or auto-select one
    React.useEffect(() => {
        if (selectedCompanyIds.length > 0) {
            setClientCompany(selectedCompanyIds[0]);
        }
    }, [selectedCompanyIds]);

    const fetchData = React.useCallback(async () => {
        if (role !== 'Client') return;
        
        setLoading(true);
        setError(null);
        try {
            const api = getApi();
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const endpoint = dataSource === 'demo' ? '/api/demo/reports' : 
                           dataSource === 'localDb' ? '/api/local/reports' : 
                           '/api/reports';

            // If no company is selected, get companies and auto-select first one
            if (!clientCompany) {
                const res = await api.get<ReportsResponse>(endpoint, {
                    params: { range: '30', currency: reportingCurrency }
                });
                if (res.data.companies && res.data.companies.length > 0) {
                    setClientCompany(res.data.companies[0].id);
                    // Update app state with client's company
                    useAppStore.getState().setSelectedCompanyIds([res.data.companies[0].id]);
                }
                setLoading(false);
                return;
            }

            // Fetch data for client's specific company
            const res = await api.get<ReportsResponse>(endpoint, {
                params: { 
                    company: clientCompany, 
                    range: '30', 
                    currency: reportingCurrency 
                }
            });
            setData(res.data);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [clientCompany, reportingCurrency, role]);

    React.useEffect(() => {
        if (role === 'Client') {
            fetchData();
        }
    }, [fetchData, role]);

    // Redirect non-clients
    React.useEffect(() => {
        if (role !== 'Client') {
            notify({ 
                title: 'Access Restricted', 
                message: 'Client dashboard is only available for client users.', 
                kind: 'warning' 
            });
        }
    }, [role, notify]);

    const currentCompany = data?.companies?.find(c => c.id === clientCompany);
    
    const kpiData = React.useMemo(() => {
        if (!data?.kpis) return [];
        
        const kpiOrder: KPIKey[] = ['revenue', 'grossProfit', 'netIncome', 'cashBalance', 'burnRate'];
        const icons = {
            revenue: '📈',
            grossProfit: '💰', 
            netIncome: '✨',
            cashBalance: '🏦',
            burnRate: '⚡'
        };
        
        return kpiOrder.map(key => {
            const item = data.kpis?.find(k => k.key === key);
            return {
                icon: icons[key],
                data: item ? {
                    value: item.value,
                    delta: item.delta
                } : { value: 0, delta: 0 },
                key,
                label: item?.label || key
            };
        });
    }, [data]);

    const fxLast = React.useMemo(() => {
        const ex = data?.exchangeRates;
        if (!ex || ex.length === 0) return undefined;
        return ex[ex.length - 1];
    }, [data]);

    const fmt = React.useCallback((n: number) => formatCurrency(convertAmount(n, reportingCurrency, fxLast ? { month: fxLast.month, NGN_USD: fxLast.usd, NGN_CFA: fxLast.cfa } : undefined), reportingCurrency), [reportingCurrency, fxLast]);

    if (role !== 'Client') {
        return (
            <div className="container py-6 space-y-4">
                <Card className="p-8 text-center">
                    <h1 className="text-2xl font-semibold text-deep-navy mb-2">Access Restricted</h1>
                    <p className="text-deep-navy/70 mb-4">This page is only available for client users.</p>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6" data-testid="client-dashboard">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-deep-navy">Your Company Dashboard</h1>
                    {currentCompany && (
                        <p className="text-deep-navy/70 mt-1">
                            {currentCompany.name} • {currentCompany.currency}
                        </p>
                    )}
                </div>
                
                {/* Company selector for clients with multiple companies */}
                {data?.companies && data.companies.length > 1 && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="company" className="text-sm text-deep-navy/80">Company:</label>
                        <select
                            id="company"
                            value={clientCompany}
                            onChange={(e) => setClientCompany(e.target.value)}
                            className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                        >
                            {data.companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="h-24 animate-pulse bg-medium/20" />
                    ))}
                </div>
            ) : error ? (
                <Card className="p-8 text-center">
                    <div className="text-coral mb-2">⚠️</div>
                    <h2 className="text-lg font-semibold mb-2">Unable to load data</h2>
                    <p className="text-deep-navy/70 mb-4">{error}</p>
                    <Button onClick={fetchData}>Try Again</Button>
                </Card>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {kpiData.map((item) => (
                            <KPI
                                key={item.key}
                                label={item.label}
                                value={fmt(item.data?.value ?? 0)}
                                delta={item.data?.delta ?? 0}
                                icon={item.icon}
                            />
                        ))}
                    </div>

                    {/* Chart */}
                    <Card>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Financial Trends</h2>
                            <p className="text-sm text-deep-navy/70">Revenue and expenses over the last 30 days</p>
                        </div>
                        <div className="h-64 md:h-80">
                            <RechartsLineChart 
                                data={(data?.series ?? []).map(p => ({
                                    date: p.date,
                                    revenue: Number(convertAmount(p.revenue, reportingCurrency, fxLast ? { month: fxLast.month, NGN_USD: fxLast.usd, NGN_CFA: fxLast.cfa } : undefined).toFixed(0)),
                                    expenses: Number(convertAmount(p.expenses, reportingCurrency, fxLast ? { month: fxLast.month, NGN_USD: fxLast.usd, NGN_CFA: fxLast.cfa } : undefined).toFixed(0))
                                }))}
                                lines={[
                                    { dataKey: 'revenue', stroke: '#2774FF', name: 'Revenue' },
                                    { dataKey: 'expenses', stroke: '#FF6F59', name: 'Expenses' }
                                ]}
                                height="100%"
                                loading={loading}
                            />
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                            <h3 className="font-semibold mb-2">📊 View Reports</h3>
                            <p className="text-sm text-deep-navy/70 mb-3">Access your P&L, Balance Sheet, and Cash Flow reports.</p>
                            <Button size="sm" onClick={() => window.location.href = '/reports'}>
                                Open Reports
                            </Button>
                        </Card>
                        
                        <Card className="p-4">
                            <h3 className="font-semibold mb-2">📈 Forecast</h3>
                            <p className="text-sm text-deep-navy/70 mb-3">View financial projections and scenario planning.</p>
                            <Button size="sm" variant="ghost" onClick={() => window.location.href = '/forecast'}>
                                View Forecast
                            </Button>
                        </Card>

                        <Card className="p-4">
                            <h3 className="font-semibold mb-2">⚙️ Settings</h3>
                            <p className="text-sm text-deep-navy/70 mb-3">Manage your preferences and currency settings.</p>
                            <Button size="sm" variant="ghost" onClick={() => window.location.href = '/settings'}>
                                Open Settings
                            </Button>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
