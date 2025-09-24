'use client';

import * as React from 'react';
import getApi from '@shared/api/client';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import * as XLSX from 'xlsx';
import { useAppStore, type AppState, convertAmount, formatCurrency } from '@shared/state/app';

type Txn = {
    id: string;
    date: string; // ISO
    account: 'Sales' | 'COGS' | 'Payroll' | 'Rent' | 'Marketing' | 'Other';
    description: string;
    amount: number; // NGN
    type: 'Revenue' | 'COGS' | 'Expense';
};

type PLNRow = {
    key: string;
    label: string;
    amount: number;
    type: 'Revenue' | 'COGS' | 'Expense' | 'Computed';
    account?: Txn['account'];
    expandable?: boolean;
};

export interface ReportTableProps {
    className?: string;
    companyId?: string;
    range?: '30' | '90' | 'custom';
    from?: string;
    to?: string;
}

type ReportsResp = {
    series: Array<{ date: string; revenue: number; expenses: number; cogs?: number }>;
};

function useCurrencyHelpers() {
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const fx = null; // could use last rate from API if needed in future
    return {
        reportingCurrency,
        currency: (n: number) => formatCurrency(convertAmount(n, reportingCurrency, undefined), reportingCurrency)
    } as const;
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function ReportTable({ className, companyId = '', range: initialRange = '90', from: initialFrom, to: initialTo }: ReportTableProps) {
    const { currency: fmt } = useCurrencyHelpers();
    const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
    const consolidated = useAppStore((s: AppState) => s.consolidated);
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const dataSource = useAppStore((s: AppState) => s.dataSource);
    const demoMode = useAppStore((s: AppState) => s.demoMode);
    const api = React.useMemo(() => getApi(), [dataSource, demoMode]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [rows, setRows] = React.useState<PLNRow[]>([]);
    const [txns, setTxns] = React.useState<Txn[]>([]);
    const [netIncome, setNetIncome] = React.useState<number>(0);
    const [compare, setCompare] = React.useState<boolean>(false);
    const [compareDelta, setCompareDelta] = React.useState<Record<string, number>>({});

    // filters
    const [q, setQ] = React.useState('');
    const [account, setAccount] = React.useState<string>('all');
    const [min, setMin] = React.useState<string>('');
    const [max, setMax] = React.useState<string>('');
    const [openKeys, setOpenKeys] = React.useState<Record<string, boolean>>({});

    // date range controls (30/90/custom)
    type Range = '30' | '90' | 'custom';
    const [range, setRange] = React.useState<Range>(initialRange as Range);
    const [from, setFrom] = React.useState<string>(initialFrom ?? '');
    const [to, setTo] = React.useState<string>(initialTo ?? '');

    React.useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true); setError(null);
            try {
                const companyParam = consolidated && selectedCompanyIds.length > 0 ? selectedCompanyIds.join(',') : companyId;
                const res = await api.get<ReportsResp>('/api/demo/reports', { params: { company: companyParam, range, from, to, currency: reportingCurrency } });
                if (!alive) return;
                const series = (res.data as any).series as ReportsResp['series'];
                // Aggregate demo P&L from series
                const rev = series.reduce((s, p) => s + (p.revenue ?? 0), 0);
                const cogs = series.reduce((s, p) => s + (p.cogs ?? Math.round((p.revenue ?? 0) * 0.45)), 0);
                const opexTotal = series.reduce((s, p) => s + (p.expenses ?? 0), 0);
                const payroll = Math.round(opexTotal * 0.4);
                const rent = Math.round(opexTotal * 0.2);
                const marketing = Math.round(opexTotal * 0.15);
                const other = Math.max(0, opexTotal - (payroll + rent + marketing));
                const grossProfit = rev - cogs;
                const netIncome = grossProfit - opexTotal;

                const plRows: PLNRow[] = [
                    { key: 'rev', label: 'Revenue', amount: rev, type: 'Revenue', expandable: true },
                    { key: 'cogs', label: 'Cost of Goods Sold', amount: -cogs, type: 'COGS', expandable: true },
                    { key: 'gp', label: 'Gross Profit', amount: grossProfit, type: 'Computed' },
                    { key: 'payroll', label: 'Payroll', amount: -payroll, type: 'Expense', account: 'Payroll', expandable: true },
                    { key: 'rent', label: 'Rent', amount: -rent, type: 'Expense', account: 'Rent', expandable: true },
                    { key: 'marketing', label: 'Marketing', amount: -marketing, type: 'Expense', account: 'Marketing', expandable: true },
                    { key: 'other', label: 'Other Expenses', amount: -other, type: 'Expense', account: 'Other', expandable: true },
                    { key: 'ni', label: 'Net Income', amount: netIncome, type: 'Computed' },
                ];

                // Synthesize demo transactions from series for drilldowns
                const all: Txn[] = [];
                for (const p of series) {
                    const d = p.date;
                    // revenue split across a few sales
                    const r1 = Math.round((p.revenue ?? 0) * 0.5);
                    const r2 = Math.round((p.revenue ?? 0) * 0.35);
                    const r3 = Math.max(0, (p.revenue ?? 0) - r1 - r2);
                    if (r1) all.push({ id: uid(), date: d, account: 'Sales', description: 'Customer invoice', amount: r1, type: 'Revenue' });
                    if (r2) all.push({ id: uid(), date: d, account: 'Sales', description: 'POS sale', amount: r2, type: 'Revenue' });
                    if (r3) all.push({ id: uid(), date: d, account: 'Sales', description: 'Online order', amount: r3, type: 'Revenue' });

                    // cogs
                    const c = (p.cogs ?? Math.round((p.revenue ?? 0) * 0.45));
                    const c1 = Math.round(c * 0.6);
                    const c2 = c - c1;
                    if (c1) all.push({ id: uid(), date: d, account: 'COGS', description: 'Inventory purchase', amount: -c1, type: 'COGS' });
                    if (c2) all.push({ id: uid(), date: d, account: 'COGS', description: 'Shipping & duties', amount: -c2, type: 'COGS' });

                    // expenses
                    const ex = (p.expenses ?? 0);
                    const ePayroll = Math.round(ex * 0.4);
                    const eRent = Math.round(ex * 0.2);
                    const eMkt = Math.round(ex * 0.15);
                    const eOther = Math.max(0, ex - ePayroll - eRent - eMkt);
                    if (ePayroll) all.push({ id: uid(), date: d, account: 'Payroll', description: 'Monthly payroll', amount: -ePayroll, type: 'Expense' });
                    if (eRent) all.push({ id: uid(), date: d, account: 'Rent', description: 'Office rent', amount: -eRent, type: 'Expense' });
                    if (eMkt) all.push({ id: uid(), date: d, account: 'Marketing', description: 'Ad spend', amount: -eMkt, type: 'Expense' });
                    if (eOther) all.push({ id: uid(), date: d, account: 'Other', description: 'Misc expenses', amount: -eOther, type: 'Expense' });
                }

                if (!alive) return;
                setRows(plRows);
                setTxns(all);
                setNetIncome(netIncome);

                // optional compare: compute previous equal-length series deltas
                if (compare && series.length > 0) {
                    const lastDate = new Date(series[series.length - 1].date);
                    const days = Math.max(1, series.length * 30); // rough estimate
                    const prevTo = new Date(lastDate.getTime() - 24 * 3600 * 1000);
                    const prevFrom = new Date(prevTo.getTime() - days * 24 * 3600 * 1000);
                    const fmt = (d: Date) => d.toISOString().slice(0, 10);
                    try {
                        const prev = await api.get<ReportsResp>('/api/demo/reports', { params: { company: companyParam, range: 'custom', from: fmt(prevFrom), to: fmt(prevTo), currency: reportingCurrency } });
                        if (!alive) return;
                        const pSeries = (prev.data as any).series as ReportsResp['series'];
                        const prevRev = pSeries.reduce((s, p) => s + (p.revenue ?? 0), 0);
                        const prevCogs = pSeries.reduce((s, p) => s + (p.cogs ?? Math.round((p.revenue ?? 0) * 0.45)), 0);
                        const prevOpex = pSeries.reduce((s, p) => s + (p.expenses ?? 0), 0);
                        const prevPayroll = Math.round(prevOpex * 0.4);
                        const prevRent = Math.round(prevOpex * 0.2);
                        const prevMkt = Math.round(prevOpex * 0.15);
                        const prevOther = Math.max(0, prevOpex - (prevPayroll + prevRent + prevMkt));
                        const prevNI = (prevRev - prevCogs) - prevOpex;
                        setCompareDelta({
                            rev: rev - prevRev,
                            cogs: -cogs - (-prevCogs),
                            gp: (rev - cogs) - (prevRev - prevCogs),
                            payroll: -payroll - (-prevPayroll),
                            rent: -rent - (-prevRent),
                            marketing: -marketing - (-prevMkt),
                            other: -other - (-prevOther),
                            ni: netIncome - prevNI
                        });
                    } catch { setCompareDelta({}); }
                } else {
                    setCompareDelta({});
                }
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => { alive = false; };
    }, [api, companyId, consolidated, selectedCompanyIds, range, from, to, reportingCurrency]);

    const accounts = React.useMemo(() => ['all', 'Sales', 'COGS', 'Payroll', 'Rent', 'Marketing', 'Other'], []);

    // Filtering function for transactions in drilldowns
    function filterTxns(base: Txn[]) {
        let list = base;
        if (q.trim()) {
            const t = q.trim().toLowerCase();
            list = list.filter(x => x.description.toLowerCase().includes(t) || x.account.toLowerCase().includes(t));
        }
        if (account !== 'all') list = list.filter(x => x.account === account);
        const minN = min ? Number(min) : undefined;
        const maxN = max ? Number(max) : undefined;
        if (!Number.isNaN(minN as any) && minN !== undefined) list = list.filter(x => x.amount >= (minN as number));
        if (!Number.isNaN(maxN as any) && maxN !== undefined) list = list.filter(x => x.amount <= (maxN as number));
        return list;
    }

    function onToggle(key: string) {
        setOpenKeys(s => ({ ...s, [key]: !s[key] }));
    }

    function handleKeyToggle(e: React.KeyboardEvent, key: string) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(key);
        }
    }

    function txnsForRow(r: PLNRow) {
        if (r.key === 'rev') return txns.filter(t => t.type === 'Revenue');
        if (r.key === 'cogs') return txns.filter(t => t.type === 'COGS');
        if (r.account) return txns.filter(t => t.account === r.account);
        return [];
    }

    function exportCsvForRow(r: PLNRow, drill: Txn[]) {
        const headers = ['date', 'account', 'description', 'amount'];
        const lines = [headers.join(',')].concat(
            drill.map(t => [t.date, t.account, JSON.stringify(t.description).replace(/^"|"$/g, ''), t.amount].join(','))
        );
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${r.label.replace(/\s+/g, '_').toLowerCase()}_transactions.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportFullPLCsv() {
        const headers = ['line', 'label', 'amount', 'delta'];
        const lines = [headers.join(',')].concat(
            rows.map((r, i) => [i + 1, r.label, r.amount, compareDelta[r.key] ?? 0].join(','))
        );
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'profit_and_loss.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportFullPLExcel() {
        const data = rows.map((r, i) => ({ line: i + 1, label: r.label, amount: r.amount, delta: compareDelta[r.key] ?? 0 }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'P&L');
        XLSX.writeFile(wb, 'profit_and_loss.xlsx');
    }

    return (
        <Card className={className}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex-1 min-w-[160px]">
                    <label htmlFor="pl-search" className="sr-only">Search</label>
                    <input id="pl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transactions" className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                </div>
                <div>
                    <label htmlFor="pl-account" className="sr-only">Account</label>
                    <select id="pl-account" value={account} onChange={(e) => setAccount(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                        {accounts.map(a => <option key={a} value={a}>{a === 'all' ? 'All accounts' : a}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="pl-min" className="sr-only">Min</label>
                    <input id="pl-min" type="number" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" className="w-24 rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                    <label htmlFor="pl-max" className="sr-only">Max</label>
                    <input id="pl-max" type="number" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" className="w-24 rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setQ(''); setAccount('all'); setMin(''); setMax(''); }}>Reset</Button>
            </div>

            {/* Range controls */}
            <div className="mb-2 flex items-center gap-2">
                <div className="inline-flex rounded-full border border-medium/60 p-0.5">
                    {(['30', '90', 'custom'] as Range[]).map(r => (
                        <button key={r} onClick={() => setRange(r)}
                            className={['px-3 py-1.5 text-xs rounded-full', range === r ? 'bg-medium/60 text-deep-navy font-medium' : 'text-deep-navy/90 hover:bg-medium/40'].join(' ')}
                            aria-pressed={range === r}>{r === '30' ? 'Last 30' : r === '90' ? 'Last 90' : 'Custom'}</button>
                    ))}
                </div>
                {range === 'custom' && (
                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="pl-from">From</label>
                        <input id="pl-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                        <label className="sr-only" htmlFor="pl-to">To</label>
                        <input id="pl-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                    </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-deep-navy/90">
                        <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
                        Compare vs prior period
                    </label>
                    <Button size="sm" variant="ghost" onClick={exportFullPLCsv}>Export CSV</Button>
                    <Button size="sm" variant="ghost" onClick={exportFullPLExcel}>Export Excel</Button>
                </div>
            </div>

            {/* Desktop table with sticky header and pinned footer */}
            <div className="hidden md:block">
                <div className="max-h-[520px] overflow-auto rounded-2xl border border-medium/60">
                    <div role="table" aria-label="Profit and Loss" className="w-full">
                        <div role="rowgroup">
                            <div role="row" className="sticky top-0 z-10 grid grid-cols-[1fr_140px] px-3 py-2 text-xs uppercase text-deep-navy/80 bg-white/95 backdrop-blur">
                                <div>Category</div>
                                <div className="text-right">Amount</div>
                            </div>
                        </div>
                        <div role="rowgroup">
                            {loading ? (
                                <div className="px-3 py-6 text-sm text-deep-navy/80">Loading…</div>
                            ) : error ? (
                                <div className="px-3 py-6 text-sm text-coral">{error}</div>
                            ) : (
                                rows.map((r) => {
                                    const isOpen = !!openKeys[r.key];
                                    const rowId = `row-${r.key}`;
                                    const panelId = `panel-${r.key}`;
                                    const drill = filterTxns(txnsForRow(r));
                                    return (
                                        <div key={r.key}>
                                            <div role="row" className="grid grid-cols-[1fr_140px] items-center px-3 py-2 border-t border-medium/60">
                                                <div className="flex items-center gap-2">
                                                    {r.expandable ? (
                                                        <button
                                                            type="button"
                                                            aria-expanded={isOpen}
                                                            aria-controls={panelId}
                                                            id={rowId}
                                                            onClick={() => onToggle(r.key)}
                                                            onKeyDown={(e) => handleKeyToggle(e, r.key)}
                                                            className="rounded-md px-2 py-1 text-left hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt"
                                                        >
                                                            <span className="inline-block w-4">{isOpen ? '▾' : '▸'}</span>
                                                            <span className="font-medium">{r.label}</span>
                                                        </button>
                                                    ) : (
                                                        <div className="pl-6 font-medium">{r.label}</div>
                                                    )}
                                                </div>
                                                <div className="text-right font-semibold">
                                                    <div>{fmt(r.amount)}</div>
                                                    {compare && r.key !== 'gp' && (
                                                        <div className="text-xs text-deep-navy/80">Δ {fmt(compareDelta[r.key] ?? 0)}</div>
                                                    )}
                                                </div>
                                            </div>
                                            {r.expandable && isOpen && (
                                                <div role="region" aria-labelledby={rowId} id={panelId} className="px-3 pb-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-xs text-deep-navy/80">{drill.length} transactions</div>
                                                        <Button size="sm" variant="ghost" onClick={() => exportCsvForRow(r, drill)}>Export CSV</Button>
                                                    </div>
                                                    {drill.length === 0 ? (
                                                        <div className="text-sm text-deep-navy/80">No transactions for current filters.</div>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full text-sm border border-medium/60 rounded-xl">
                                                                <thead className="bg-medium/40 text-deep-navy">
                                                                    <tr>
                                                                        <th className="px-2 py-1 text-left">Date</th>
                                                                        <th className="px-2 py-1 text-left">Account</th>
                                                                        <th className="px-2 py-1 text-left">Description</th>
                                                                        <th className="px-2 py-1 text-right">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {drill.map(t => (
                                                                        <tr key={t.id} className="odd:bg-white even:bg-medium/20">
                                                                            <td className="px-2 py-1">{t.date}</td>
                                                                            <td className="px-2 py-1">{t.account}</td>
                                                                            <td className="px-2 py-1">{t.description}</td>
                                                                            <td className="px-2 py-1 text-right">{fmt(t.amount)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {/* pinned footer */}
                        <div className="sticky bottom-0 z-10 grid grid-cols-[1fr_140px] bg-white/95 backdrop-blur px-3 py-2 border-t border-medium/60">
                            <div className="font-semibold">Net Income</div>
                            <div className="text-right font-semibold">{fmt(netIncome)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile simplified list */}
            <div className="md:hidden divide-y divide-medium/60">
                {loading ? (
                    <div className="px-3 py-6 text-sm text-deep-navy/80">Loading…</div>
                ) : error ? (
                    <div className="px-3 py-6 text-sm text-coral">{error}</div>
                ) : (
                    rows.map(r => {
                        const isOpen = !!openKeys[r.key];
                        const drill = filterTxns(txnsForRow(r));
                        return (
                            <div key={r.key} className="py-3">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between rounded-lg px-3 py-2 hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt"
                                    aria-expanded={isOpen}
                                    onClick={() => onToggle(r.key)}
                                    onKeyDown={(e) => handleKeyToggle(e, r.key)}
                                >
                                    <span className="font-medium">{r.label}</span>
                                    <span className="font-semibold">{fmt(r.amount)}</span>
                                </button>
                                {r.expandable && isOpen && (
                                    <div className="mt-2 space-y-2 px-3">
                                        {drill.length === 0 ? (
                                            <div className="text-sm text-deep-navy/90">No transactions for current filters.</div>
                                        ) : (
                                            drill.slice(0, 6).map(t => (
                                                <div key={t.id} className="flex items-center justify-between text-sm">
                                                    <div>
                                                        <div className="font-medium">{t.account}</div>
                                                        <div className="text-deep-navy/80">{t.description}</div>
                                                    </div>
                                                    <div className="text-right">{fmt(t.amount)}</div>
                                                </div>
                                            ))
                                        )}
                                        {drill.length > 6 && (
                                            <div className="text-xs text-deep-navy/80">Showing 6 of {drill.length}. Refine with filters above.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}

export { ReportTable };
