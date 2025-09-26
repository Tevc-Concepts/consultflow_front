'use client';

import * as React from 'react';
import getApi from '@shared/api/client';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import RechartsLineChart from '@shared/components/LineChart';

type Point = { date: string; revenue: number; expenses: number };
type ScenarioKey = 'baseline' | 'rev_down_20' | 'exp_up_15' | 'fx_vol';
type ForecastResp = { horizonMonths: number; baseline: Point[]; scenarios: Record<ScenarioKey, Point[]>; ai: { summary: string; insights: string[] } };

export default function ForecastPage() {
    const [months, setMonths] = React.useState(12);
    const [data, setData] = React.useState<ForecastResp | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true); setError(null);
        try { 
            const api = getApi(); 
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const endpoint = dataSource === 'demo' ? '/api/demo/forecast' : 
                           dataSource === 'localDb' ? '/api/local/forecast' : 
                           '/api/forecast'; // frappe endpoint
            const res = await api.get<ForecastResp>(endpoint, { params: { months } }); 
            setData(res.data); 
        } catch (e: any) { 
            console.error('Forecast fetch error:', e);
            setError(e?.message ?? 'Failed to fetch forecast data'); 
        } finally { 
            setLoading(false); 
        }
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
                    <RechartsLineChart 
                        data={[...(data?.baseline ?? []), ...(data?.scenarios.rev_down_20 ?? []), ...(data?.scenarios.fx_vol ?? [])]}
                        lines={[
                            { dataKey: 'revenue', stroke: '#2774FF', name: 'Baseline' },
                            { dataKey: 'revenue', stroke: '#FF6F59', name: 'Rev -20%' },
                            { dataKey: 'revenue', stroke: '#7C3AED', name: 'FX Vol' }
                        ]}
                        height="100%"
                        loading={loading}
                    />
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Expenses — Baseline vs Scenarios</h2>
                <div className="h-72">
                    <RechartsLineChart 
                        data={[...(data?.baseline ?? []), ...(data?.scenarios.exp_up_15 ?? []), ...(data?.scenarios.fx_vol ?? [])]}
                        lines={[
                            { dataKey: 'expenses', stroke: '#2774FF', name: 'Baseline' },
                            { dataKey: 'expenses', stroke: '#FF6F59', name: 'Exp +15%' },
                            { dataKey: 'expenses', stroke: '#7C3AED', name: 'FX Vol' }
                        ]}
                        height="100%"
                        loading={loading}
                    />
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
