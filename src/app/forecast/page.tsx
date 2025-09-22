'use client';

import * as React from 'react';
import getApi from '@shared/api/client';
import dynamic from 'next/dynamic';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';

type Point = { date: string; revenue: number; expenses: number };
type ScenarioKey = 'baseline' | 'rev_down_20' | 'exp_up_15' | 'fx_vol';
type ForecastResp = { horizonMonths: number; baseline: Point[]; scenarios: Record<ScenarioKey, Point[]>; ai: { summary: string; insights: string[] } };

const ResponsiveContainer: any = dynamic(() => import('recharts').then(m => m.ResponsiveContainer as any), { ssr: false });
const LineChart: any = dynamic(() => import('recharts').then(m => m.LineChart as any), { ssr: false });
const Line: any = dynamic(() => import('recharts').then(m => m.Line as any), { ssr: false });
const XAxis: any = dynamic(() => import('recharts').then(m => m.XAxis as any), { ssr: false });
const YAxis: any = dynamic(() => import('recharts').then(m => m.YAxis as any), { ssr: false });
const Tooltip: any = dynamic(() => import('recharts').then(m => m.Tooltip as any), { ssr: false });
const Legend: any = dynamic(() => import('recharts').then(m => m.Legend as any), { ssr: false });

export default function ForecastPage() {
    const [months, setMonths] = React.useState(12);
    const [data, setData] = React.useState<ForecastResp | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true); setError(null);
        try { const api = getApi(); const res = await api.get<ForecastResp>('/api/demo/forecast', { params: { months } }); setData(res.data); } catch (e: any) { setError(e?.message ?? 'Failed'); } finally { setLoading(false); }
    }, [months]);

    React.useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-deep-navy">Forecast & Stress Test</h1>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-deep-navy/70">Months</label>
                    <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="rounded-xl border border-medium/60 px-3 py-2 text-sm">
                        {[6, 9, 12].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Revenue — Baseline vs Scenarios</h2>
                <div className="h-72">
                    {loading ? (<div className="text-sm text-deep-navy/70">Loading…</div>) : error ? (<div className="text-sm text-coral">{error}</div>) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.baseline ?? []} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis width={50} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Baseline" data={data?.baseline} stroke="#2774FF" dot={false} />
                                <Line type="monotone" dataKey="revenue" name="Rev -20%" data={data?.scenarios.rev_down_20} stroke="#FF6F59" dot={false} />
                                <Line type="monotone" dataKey="revenue" name="FX Vol" data={data?.scenarios.fx_vol} stroke="#7C3AED" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Expenses — Baseline vs Scenarios</h2>
                <div className="h-72">
                    {loading ? (<div className="text-sm text-deep-navy/70">Loading…</div>) : error ? (<div className="text-sm text-coral">{error}</div>) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.baseline ?? []} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis width={50} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="expenses" name="Baseline" data={data?.baseline} stroke="#2774FF" dot={false} />
                                <Line type="monotone" dataKey="expenses" name="Exp +15%" data={data?.scenarios.exp_up_15} stroke="#FF6F59" dot={false} />
                                <Line type="monotone" dataKey="expenses" name="FX Vol" data={data?.scenarios.fx_vol} stroke="#7C3AED" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-2">AI Summary</h2>
                {loading ? <div className="text-sm text-deep-navy/70">Loading…</div> : error ? <div className="text-sm text-coral">{error}</div> : (
                    <div className="space-y-2">
                        <div className="text-sm text-deep-navy/90">{data?.ai.summary}</div>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            {data?.ai.insights.map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                    </div>
                )}
            </Card>
        </div>
    );
}
