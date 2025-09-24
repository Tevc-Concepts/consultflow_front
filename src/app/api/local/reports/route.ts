import { NextRequest } from 'next/server';
import { query, seedIfEmpty, listCompanies, listInsights } from '@shared/api/localDb';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || '';
    const companies = (company ? company.split(',').map(s => s.trim()).filter(Boolean) : listCompanies(true).map(c => c.id));
    const range = searchParams.get('range');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    // Aggregate series across companies (sqlite seed currently contains only 'lagos')
    const series = companies.flatMap(id => (query('SELECT date, revenue, cogs, expenses, cash FROM series WHERE company_id = ? AND is_active = 1 ORDER BY date ASC', [id]) as any[]).map((r: any) => ({ ...r, company_id: id })));
    // Merge by date (first-of-month ISO). We will adjust later with manual adjustments.
    const map = new Map<string, { date: string; revenue: number; cogs: number; expenses: number; cash: number }>();
    for (const row of series) {
        const k = row.date;
        const cur = map.get(k) || { date: row.date, revenue: 0, cogs: 0, expenses: 0, cash: 0 };
        cur.revenue += row.revenue; cur.cogs += row.cogs; cur.expenses += row.expenses; cur.cash += row.cash;
        map.set(k, cur);
    }
    // Apply adjustments for the selected companies, grouping by month (YYYY-MM)
    const adjRows = query('SELECT date, companies, field, delta FROM adjustments ORDER BY created_at ASC') as any[];
    if (adjRows && adjRows.length) {
        const compSet = new Set(companies);
        for (const a of adjRows) {
            const targets = String(a.companies || '').split(',').map((s: string) => s.trim()).filter(Boolean);
            // Apply only if any of the selected companies is targeted
            if (!targets.some((c: string) => compSet.has(c))) continue;
            const month = (a.date || '').toString().slice(0, 7); // YYYY-MM
            if (!month) continue;
            // Find an entry in map with same month; series dates are first-of-month YYYY-MM-01
            let keyForMonth: string | undefined;
            for (const k of map.keys()) {
                if (k.slice(0, 7) === month) { keyForMonth = k; break; }
            }
            if (!keyForMonth) {
                // Create an empty month on the first day of that month
                const [y, m] = month.split('-').map((x: string) => Number(x));
                const dt = new Date(Date.UTC(y, (m - 1), 1)).toISOString().slice(0, 10);
                map.set(dt, { date: dt, revenue: 0, cogs: 0, expenses: 0, cash: 0 });
                keyForMonth = dt;
            }
            const rec = map.get(keyForMonth)!;
            if (a.field === 'revenue') rec.revenue += Number(a.delta || 0);
            else if (a.field === 'cogs') rec.cogs += Number(a.delta || 0);
            else if (a.field === 'expenses') rec.expenses += Number(a.delta || 0);
            // cash will be implicitly affected via KPI/BalSheet computation below
            map.set(keyForMonth, rec);
        }
    }
    const merged = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    // Date filtering (optional). If from/to provided, filter inclusive.
    const filtered = (() => {
        if (from || to) {
            const fromD = from ? new Date(from) : null;
            const toD = to ? new Date(to) : null;
            return merged.filter(r => {
                const d = new Date(r.date);
                if (fromD && d < fromD) return false;
                if (toD && d > toD) return false;
                return true;
            });
        }
        // For simple ranges '30' or '90', keep all for now (series is monthly). UI will still behave.
        return merged;
    })();
    // Basic KPIs similar to demoDb
    const last = filtered[filtered.length - 1] || merged[merged.length - 1];
    const prev = (filtered.length >= 2 ? filtered[filtered.length - 2] : undefined) || merged[merged.length - 2] || last;
    const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100);
    const kpis = [
        { key: 'revenue', label: 'Revenue', value: last?.revenue ?? 0, delta: Number(pct(last?.revenue ?? 0, prev?.revenue ?? 0).toFixed(1)) },
        { key: 'grossProfit', label: 'Gross Profit', value: (last?.revenue ?? 0) - (last?.cogs ?? 0), delta: Number(pct((last?.revenue ?? 0) - (last?.cogs ?? 0), (prev?.revenue ?? 0) - (prev?.cogs ?? 0)).toFixed(1)) },
        { key: 'netIncome', label: 'Net Income', value: (last?.revenue ?? 0) - (last?.cogs ?? 0) - (last?.expenses ?? 0), delta: Number(pct(((last?.revenue ?? 0) - (last?.cogs ?? 0) - (last?.expenses ?? 0)), ((prev?.revenue ?? 0) - (prev?.cogs ?? 0) - (prev?.expenses ?? 0))).toFixed(1)) },
        { key: 'cashBalance', label: 'Cash Balance', value: last?.cash ?? 0, delta: Number(pct(last?.cash ?? 0, prev?.cash ?? 0).toFixed(1)) },
        { key: 'burnRate', label: 'Burn Rate', value: -Math.max(0, (last?.expenses ?? 0) - ((last?.revenue ?? 0) - (last?.cogs ?? 0))), delta: 0 }
    ];
    // Minimal balances/cashflow like demo
    const cash = last?.cash ?? 0;
    const ar = Math.round((last?.revenue ?? 0) * 0.3);
    const inv = Math.round((last?.cogs ?? 0) * 0.2);
    const totalAssets = cash + ar + inv;
    const ap = Math.round((last?.cogs ?? 0) * 0.1);
    const accr = Math.round((last?.expenses ?? 0) * 0.1);
    const debt = Math.round(totalAssets * 0.15);
    const totalLiab = ap + accr + debt;
    const equity = totalAssets - totalLiab;
    const companyRecords = listCompanies(true).filter(c => companies.includes(c.id));
    const payload = {
        companies: companyRecords.map(c => ({ id: c.id, name: c.name, currency: c.currency as 'NGN' | 'USD' | 'CFA' })),
        entities: [],
        currency: 'NGN',
        exchangeRates: [],
        kpis,
        series: filtered,
        balanceSheet: {
            asOf: last?.date || '', lines: [
                { key: 'cash', label: 'Cash & Cash Equivalents', amount: cash },
                { key: 'ar', label: 'Accounts Receivable', amount: ar },
                { key: 'inv', label: 'Inventory', amount: inv },
                { key: 'ta', label: 'Total Assets', amount: totalAssets },
                { key: 'ap', label: 'Accounts Payable', amount: -ap },
                { key: 'accr', label: 'Accruals', amount: -accr },
                { key: 'debt', label: 'Debt', amount: -debt },
                { key: 'tl', label: 'Total Liabilities', amount: -totalLiab },
                { key: 'eq', label: 'Equity', amount: equity },
            ]
        },
        cashflow: { from: merged[0]?.date || '', to: last?.date || '', lines: [], netChange: 0 },
        insights: listInsights(companies, 10)
    };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
