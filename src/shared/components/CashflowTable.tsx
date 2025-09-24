'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import getApi from '@shared/api/client';
import { useAppStore, type AppState, convertAmount, formatCurrency } from '@shared/state/app';

type ReportsResp = {
    series: Array<{ date: string; revenue: number; cogs?: number; expenses: number; cash?: number }>;
    exchangeRates?: Array<{ month: string; usd: number; cfa: number }>;
    cashflow?: { from: string; to: string; lines: Array<{ key: string; label: string; amount: number }>; netChange: number };
};

type Row = { key: string; label: string; amount: number };

export default function CashflowTable() {
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const consolidated = useAppStore((s: AppState) => s.consolidated);
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const dataSource = useAppStore((s: AppState) => s.dataSource);
    const demoMode = useAppStore((s: AppState) => s.demoMode);
    const api = React.useMemo(() => getApi(), [dataSource, demoMode]);
    const [company, setCompany] = React.useState<string>('');
    const [range, setRange] = React.useState<'30' | '90' | 'custom'>('90');
    const [from, setFrom] = React.useState('');
    const [to, setTo] = React.useState('');

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [rows, setRows] = React.useState<Row[]>([]);

    const [fxLast, setFxLast] = React.useState<{ month: string; usd: number; cfa: number } | null>(null);
    const fmt = React.useCallback((n: number) => formatCurrency(convertAmount(n, reportingCurrency, fxLast ? { month: fxLast.month, NGN_USD: fxLast.usd, NGN_CFA: fxLast.cfa } : undefined), reportingCurrency), [reportingCurrency, fxLast]);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true); setError(null);
            try {
                const companyParam = consolidated && selectedCompanyIds.length > 0 ? selectedCompanyIds.join(',') : company;
                const res = await api.get<ReportsResp>('/api/demo/reports', { params: { company: companyParam, range, from, to, currency: reportingCurrency } });
                if (!alive) return;
                const series = (res.data as any).series as ReportsResp['series'];
                const ex = (res.data as any).exchangeRates as ReportsResp['exchangeRates'];
                if (ex && ex.length) setFxLast(ex[ex.length - 1]!);
                const cf = (res.data as any).cashflow as ReportsResp['cashflow'];
                if (cf?.lines?.length) {
                    setRows(cf.lines);
                } else {
                    // Fallback compute from series
                    const rev = series.reduce((s, p) => s + (p.revenue ?? 0), 0);
                    const cogs = series.reduce((s, p) => s + (p.cogs ?? Math.round((p.revenue ?? 0) * 0.45)), 0);
                    const opex = series.reduce((s, p) => s + (p.expenses ?? 0), 0);
                    const netIncome = (rev - cogs) - opex;
                    const operating = netIncome + Math.round(cogs * 0.1) - Math.round(rev * 0.05);
                    const investing = -Math.round(rev * 0.08);
                    const financing = Math.round(rev * 0.03) - Math.round(rev * 0.02);
                    const netChange = operating + investing + financing;
                    setRows([
                        { key: 'op', label: 'Net Cash from Operating Activities', amount: operating },
                        { key: 'inv', label: 'Net Cash from Investing Activities', amount: investing },
                        { key: 'fin', label: 'Net Cash from Financing Activities', amount: financing },
                        { key: 'net', label: 'Net Change in Cash', amount: netChange },
                    ]);
                }
            } catch (e: any) { if (alive) setError(e?.message ?? 'Failed to load'); } finally { if (alive) setLoading(false); }
        })();
        return () => { alive = false; };
    }, [api, company, consolidated, selectedCompanyIds, range, from, to, reportingCurrency]);

    function exportCsv() {
        const headers = ['line', 'label', 'amount'];
        const lines = [headers.join(',')].concat(rows.map((r, i) => [i + 1, r.label, r.amount].join(',')));
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = 'cashflow.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    return (
        <Card>
            <div className="mb-2 flex items-center gap-2">
                <div className="inline-flex rounded-full border border-medium/60 p-0.5">
                    {(['30', '90', 'custom'] as const).map(r => (
                        <button key={r} onClick={() => setRange(r)} className={['px-3 py-1.5 text-xs rounded-full', range === r ? 'bg-medium/60 text-deep-navy font-medium' : 'text-deep-navy/90 hover:bg-medium/40'].join(' ')} aria-pressed={range === r}>{r === '30' ? 'Last 30' : r === '90' ? 'Last 90' : 'Custom'}</button>
                    ))}
                </div>
                {range === 'custom' && (
                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="cf-from">From</label>
                        <input id="cf-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                        <label className="sr-only" htmlFor="cf-to">To</label>
                        <input id="cf-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                    </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={exportCsv}>Export CSV</Button>
                </div>
            </div>
            <div className="max-h-[520px] overflow-auto rounded-2xl border border-medium/60">
                <div role="table" aria-label="Cash Flow" className="w-full">
                    <div role="rowgroup">
                        <div role="row" className="sticky top-0 z-10 grid grid-cols-[1fr_160px] px-3 py-2 text-xs uppercase text-deep-navy/80 bg-white/95 backdrop-blur">
                            <div>Line</div>
                            <div className="text-right">Amount</div>
                        </div>
                    </div>
                    <div role="rowgroup">
                        {loading ? (<div className="px-3 py-6 text-sm text-deep-navy/80">Loading…</div>) : error ? (<div className="px-3 py-6 text-sm text-coral">{error}</div>) : (
                            rows.map(r => (
                                <div key={r.key} role="row" className="grid grid-cols-[1fr_160px] items-center px-3 py-2 border-t border-medium/60">
                                    <div className="font-medium">{r.label}</div>
                                    <div className="text-right font-semibold">{fmt(r.amount)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

export { CashflowTable };
