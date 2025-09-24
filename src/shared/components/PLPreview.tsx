'use client';

import * as React from 'react';
import Link from 'next/link';

type TimeseriesPoint = {
    date: string; // YYYY-MM-DD
    revenue: number;
    cogs: number;
    expenses: number;
    cash: number;
};

type ApiResponse = {
    series: TimeseriesPoint[];
};

const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

function parsePeriodLabelToRange(period: string): { months: string[] } | null {
    // Supports: 'Apr–Jun 2025', 'Jan–Jun 2025', 'May 2025'
    try {
        const trimmed = period.trim();
        // Single month pattern: 'May 2025'
        const single = /^(\w{3,})\s+(\d{4})$/i.exec(trimmed);
        if (single) {
            const m = monthMap[single[1].slice(0, 3).toLowerCase()];
            const y = Number(single[2]);
            if (!m || !y) return null;
            return { months: [`${y}-${String(m).padStart(2, '0')}`] };
        }

        // Range pattern: 'Apr–Jun 2025' (supports hyphen or en-dash)
        const parts = trimmed.split(/\s+/);
        if (parts.length === 2 && /[–-]/.test(parts[0])) {
            const [a, b] = parts[0].split(/[–-]/);
            const y = Number(parts[1]);
            const m1 = monthMap[a.slice(0, 3).toLowerCase()];
            const m2 = monthMap[b.slice(0, 3).toLowerCase()];
            if (!m1 || !m2 || !y) return null;
            const start = Math.min(m1, m2);
            const end = Math.max(m1, m2);
            const months: string[] = [];
            for (let m = start; m <= end; m++) months.push(`${y}-${String(m).padStart(2, '0')}`);
            return { months };
        }
    } catch { }
    return null;
}

function formatNGN(n: number) {
    try {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
    } catch {
        return `₦${n.toLocaleString()}`;
    }
}

export default function PLPreview({ periodLabel, className }: { periodLabel: string; className?: string }) {
    const [data, setData] = React.useState<ApiResponse | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);

    React.useEffect(() => {
        let active = true;
        setLoading(true); setError(null);
        fetch('/api/demo/reports')
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<ApiResponse>;
            })
            .then((json) => { if (active) setData(json); })
            .catch((e) => { if (active) setError(String(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [periodLabel]);

    const range = React.useMemo(() => parsePeriodLabelToRange(periodLabel), [periodLabel]);
    const rangeDates = React.useMemo(() => {
        if (!range?.months?.length) return null;
        const first = range.months[0];
        const last = range.months[range.months.length - 1];
        const [ys, ms] = first.split('-').map(Number);
        const [ye, me] = last.split('-').map(Number);
        if (!ys || !ms || !ye || !me) return null;
        const from = `${ys}-${String(ms).padStart(2, '0')}-01`;
        const lastDay = new Date(ye, me, 0).getDate();
        const to = `${ye}-${String(me).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return { from, to };
    }, [range]);
    const agg = React.useMemo(() => {
        if (!data?.series || !range) return null;
        const monthsSet = new Set(range.months);
        const filtered = data.series.filter(p => monthsSet.has(p.date.slice(0, 7)));
        if (filtered.length === 0) return null;
        const totals = filtered.reduce((acc, p) => {
            acc.revenue += p.revenue;
            acc.cogs += p.cogs;
            acc.expenses += p.expenses;
            return acc;
        }, { revenue: 0, cogs: 0, expenses: 0 });
        const gross = totals.revenue - totals.cogs;
        const net = gross - totals.expenses;
        return { ...totals, gross, net, months: filtered.length };
    }, [data, range]);

    return (
        <div className={["rounded-xl border border-medium/60 p-3", className].filter(Boolean).join(' ')}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">P&L preview</div>
                <div className="text-xs text-deep-navy/60">{periodLabel}</div>
            </div>
            {loading && <div className="text-sm text-deep-navy/80">Loading…</div>}
            {!loading && error && <div className="text-sm text-coral">Failed to load: {error}</div>}
            {!loading && !error && !agg && (
                <div className="text-sm text-deep-navy/80">No data for selected period.</div>
            )}
            {!loading && !error && agg && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div className="rounded-lg bg-light p-2">
                            <div className="text-deep-navy/60">Revenue</div>
                            <div className="font-semibold">{formatNGN(agg.revenue)}</div>
                        </div>
                        <div className="rounded-lg bg-light p-2">
                            <div className="text-deep-navy/60">COGS</div>
                            <div className="font-semibold">{formatNGN(agg.cogs)}</div>
                        </div>
                        <div className="rounded-lg bg-light p-2">
                            <div className="text-deep-navy/60">Gross Profit</div>
                            <div className="font-semibold">{formatNGN(agg.gross)}</div>
                        </div>
                        <div className="rounded-lg bg-light p-2">
                            <div className="text-deep-navy/60">Expenses</div>
                            <div className="font-semibold">{formatNGN(agg.expenses)}</div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2 col-span-2 md:col-span-1">
                            <div className="text-deep-navy/60">Net Income</div>
                            <div className="font-semibold">{formatNGN(agg.net)}</div>
                        </div>
                    </div>
                    {rangeDates && (
                        <div className="mt-2 text-right">
                            <Link href={{ pathname: '/reports', query: { range: 'custom', from: rangeDates.from, to: rangeDates.to } }} className="text-cobalt hover:underline text-sm">
                                View full P&L
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
