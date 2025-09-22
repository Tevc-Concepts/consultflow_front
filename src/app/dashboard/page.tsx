'use client';

import * as React from 'react';
import getApi from '@shared/api/client';
import dynamic from 'next/dynamic';
import { KPI } from '@components/ui/KPI';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Skeleton from '@shared/components/Skeleton';
import AIWidget from '@shared/components/AIWidget';
import { useAppStore, type AppState, convertAmount, formatCurrency } from '@shared/state/app';

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

type Insight = {
    id: string;
    title: string;
    detail: string;
    severity: 'low' | 'medium' | 'high';
};

type ReportsResponse = {
    companies: Array<{ id: string; name: string }>;
    kpis: KPIItem[];
    series: TimeseriesPoint[];
    insights: Insight[];
    exchangeRates?: Array<{ month: string; usd: number; cfa: number }>;
};

const ResponsiveContainer: any = dynamic(() => import('recharts').then(m => m.ResponsiveContainer as any), { ssr: false });
const LineChart: any = dynamic(() => import('recharts').then(m => m.LineChart as any), { ssr: false });
const Line: any = dynamic(() => import('recharts').then(m => m.Line as any), { ssr: false });
const XAxis: any = dynamic(() => import('recharts').then(m => m.XAxis as any), { ssr: false });
const YAxis: any = dynamic(() => import('recharts').then(m => m.YAxis as any), { ssr: false });
const Tooltip: any = dynamic(() => import('recharts').then(m => m.Tooltip as any), { ssr: false });
const Legend: any = dynamic(() => import('recharts').then(m => m.Legend as any), { ssr: false });

type Range = '30' | '90' | 'custom';

export default function DashboardPage() {
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const consolidated = useAppStore((s: AppState) => s.consolidated);
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const [company, setCompany] = React.useState<string>('');
    const [range, setRange] = React.useState<Range>('30');
    const [customFrom, setCustomFrom] = React.useState<string>('');
    const [customTo, setCustomTo] = React.useState<string>('');

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [data, setData] = React.useState<ReportsResponse | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const api = getApi();
            const companyParam = consolidated && selectedCompanyIds.length > 0
                ? selectedCompanyIds.join(',')
                : company;
            const res = await api.get<ReportsResponse>('/api/demo/reports', {
                params: { company: companyParam, range, from: customFrom, to: customTo, currency: reportingCurrency }
            });
            setData(res.data);
            if (!company && res.data.companies?.length) {
                setCompany(res.data.companies[0].id);
            }
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [company, range, customFrom, customTo, reportingCurrency, consolidated, selectedCompanyIds]);

    React.useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    const kpiMap = React.useMemo(() => {
        const map: Record<KPIKey, KPIItem | undefined> = {
            revenue: undefined,
            grossProfit: undefined,
            netIncome: undefined,
            cashBalance: undefined,
            burnRate: undefined
        };
        if (data?.kpis) {
            for (const k of data.kpis) map[k.key] = k;
        }
        return map;
    }, [data]);

    const fxLast = React.useMemo(() => {
        const ex = data?.exchangeRates;
        if (!ex || ex.length === 0) return undefined;
        return ex[ex.length - 1];
    }, [data]);

    const fmt = React.useCallback((n: number) => formatCurrency(convertAmount(n, reportingCurrency, fxLast ? { month: fxLast.month, NGN_USD: fxLast.usd, NGN_CFA: fxLast.cfa } : undefined), reportingCurrency), [reportingCurrency, fxLast]);

    return (
        <div className="container py-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2">
                    <label htmlFor="company" className="text-sm text-deep-navy/80">Company</label>
                    <select
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                        aria-label="Select company"
                    >
                        {(data?.companies ?? []).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-deep-navy/80">Range</span>
                    <div className="inline-flex rounded-full border border-medium/60 p-0.5">
                        {(['30', '90', 'custom'] as Range[]).map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={[
                                    'px-3 py-1.5 text-sm rounded-full',
                                    range === r ? 'bg-medium/60 text-deep-navy font-medium' : 'text-deep-navy/80 hover:bg-medium/40'
                                ].join(' ')}
                                aria-pressed={range === r}
                            >
                                {r === '30' ? 'Last 30' : r === '90' ? 'Last 90' : 'Custom'}
                            </button>
                        ))}
                    </div>
                    {range === 'custom' && (
                        <div className="flex items-center gap-2">
                            <label className="sr-only" htmlFor="from">From</label>
                            <input id="from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                            <label className="sr-only" htmlFor="to">To</label>
                            <input id="to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                            <Button onClick={fetchData} variant="primary" size="sm">Apply</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="-mx-4 md:mx-0 overflow-x-auto pb-2">
                <div className="grid grid-flow-col auto-cols-[75%] sm:auto-cols-[45%] md:auto-cols-fr gap-3 px-4 md:px-0 md:grid-cols-5">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
                    ) : error ? (
                        <Card>
                            <p className="text-sm text-coral">{error}</p>
                        </Card>
                    ) : (
                        [
                            {
                                data: kpiMap.revenue, icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12l6 6L21 6" />
                                    </svg>
                                )
                            },
                            {
                                data: kpiMap.grossProfit, icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12l4-4m-4 4l4 4" />
                                    </svg>
                                )
                            },
                            {
                                data: kpiMap.netIncome, icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
                                    </svg>
                                )
                            },
                            {
                                data: kpiMap.cashBalance, icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                                    </svg>
                                )
                            },
                            {
                                data: kpiMap.burnRate, icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )
                            }
                        ].map((item, i) => (
                            <KPI
                                key={i}
                                label={item.data?.label ?? ''}
                                value={fmt(item.data?.value ?? 0)}
                                delta={item.data?.delta ?? 0}
                                icon={item.icon}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Charts and insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Revenue vs Expenses</h3>
                    </div>
                    <div className="h-64 md:h-80">
                        {loading ? (
                            <Skeleton className="h-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={(data?.series ?? []).map(p => ({
                                    ...p,
                                    revenue: Number(convertAmount(p.revenue, reportingCurrency, fxLast ? { month: fxLast.month, NGN_USD: fxLast.usd, NGN_CFA: fxLast.cfa } : undefined).toFixed(0)),
                                    expenses: Number(convertAmount(p.expenses, reportingCurrency, fxLast ? { month: fxLast.month, NGN_USD: fxLast.usd, NGN_CFA: fxLast.cfa } : undefined).toFixed(0))
                                }))} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} hide={false} />
                                    <YAxis tick={{ fontSize: 12 }} width={40} />
                                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#2774FF" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="expenses" stroke="#FF6F59" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
                    ) : (
                        (data?.insights ?? []).slice(0, 3).map((ins) => (
                            <div key={ins.id} className="rounded-2xl p-4 text-white shadow-soft gradient-hero">
                                <div className="text-sm font-semibold">{ins.title}</div>
                                <div className="text-xs opacity-90">{ins.detail}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Floating AI widget */}
            <AIWidget />
        </div>
    );
}
