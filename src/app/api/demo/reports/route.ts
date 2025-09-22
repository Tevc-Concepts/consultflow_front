import { NextRequest, NextResponse } from 'next/server';

type ExchangePoint = { month: string; usd: number; cfa: number };
type TimeseriesPoint = { date: string; revenue: number; cogs: number; expenses: number; cash: number };

function iso(d: Date) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10); }
function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function genMonths24(): { months: string[]; dates: string[] } {
    const now = new Date(); const months: string[] = []; const dates: string[] = [];
    for (let i = 23; i >= 0; i--) { const d = new Date(now); d.setMonth(d.getMonth() - i); months.push(ym(d)); dates.push(iso(d)); }
    return { months, dates };
}
function genExchange24(months: string[]): ExchangePoint[] {
    return months.map((m, i) => {
        const [y, mm] = m.split('-').map(Number); const monthIdx = mm - 1;
        let usd = 450, cfa = 0.75; if (y >= 2023) { usd = 450 + i * 12; if (y === 2023 && monthIdx >= 5) usd += 200; if (y >= 2024) usd = 900 + i * 8; cfa = 0.75 + i * 0.002; }
        return { month: m, usd, cfa };
    });
}
function genCompanySeries(companyId: string, dates: string[]): TimeseriesPoint[] {
    let cash = 8_500_000; const arr: TimeseriesPoint[] = [];
    for (let i = 0; i < dates.length; i++) {
        const d = new Date(dates[i]); const month = d.getMonth();
        const seasonal = [0.95, 0.92, 0.98, 1.02, 1.05, 1.07, 1.1, 1.12, 1.15, 1.25, 1.35, 1.5][month];
        const baseRevenue = 5_000_000; const growth = 1 + i * 0.01; const inflation = i > 6 ? 1.02 : 1;
        let revenue = Math.round(baseRevenue * seasonal * growth * inflation);
        if (companyId === 'accra') revenue = Math.round(revenue * 0.6);
        if (companyId === 'abuja') revenue = Math.round(revenue * 0.8);
        const cogs = Math.round(revenue * (0.4 + Math.sin(i) * 0.02));
        const expenses = Math.round(revenue * 0.45 * (1 + i / 100));
        cash += (revenue - cogs - expenses);
        arr.push({ date: dates[i], revenue, cogs, expenses, cash });
    }
    return arr;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || undefined;
    const currency = (searchParams.get('currency') as any) || 'NGN';
    const range = (searchParams.get('range') as any) || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    await new Promise((r) => setTimeout(r, 200));

    const { months, dates } = genMonths24();
    const exchangeRates = genExchange24(months);
    const companies = [
        { id: 'lagos', name: 'Lagos Retail Ltd', currency: 'NGN' as const },
        { id: 'accra', name: 'Accra Foods Ltd', currency: 'CFA' as const },
        { id: 'abuja', name: 'Abuja Tech Ltd', currency: 'USD' as const },
    ];
    const entities = [
        { id: 'e1', name: 'Lagos Retail HQ', companyId: 'lagos' },
        { id: 'e2', name: 'Lagos Retail Ikeja', companyId: 'lagos' },
        { id: 'e3', name: 'Accra Foods HQ', companyId: 'accra' },
        { id: 'e4', name: 'Abuja Tech HQ', companyId: 'abuja' }
    ];
    const sel = (company ? company.split(',').map(s => s.trim()).filter(Boolean) : ['lagos']);
    const perCompany: Record<string, TimeseriesPoint[]> = {
        lagos: genCompanySeries('lagos', dates),
        accra: genCompanySeries('accra', dates),
        abuja: genCompanySeries('abuja', dates),
    };
    const seriesArr = perCompany[sel[0]].map((_, idx) => {
        const sum = { date: dates[idx], revenue: 0, cogs: 0, expenses: 0, cash: 0 };
        for (const id of sel) { const it = perCompany[id][idx]; sum.revenue += it.revenue; sum.cogs += it.cogs; sum.expenses += it.expenses; sum.cash += it.cash; }
        return sum;
    });
    let series = seriesArr;
    if (range === '30') series = series.slice(-1);
    else if (range === '90') series = series.slice(-3);
    else if (range === 'custom' && from && to) series = series.filter(p => p.date >= from && p.date <= to);

    const last = series[series.length - 1];
    const ar = Math.round((last?.revenue ?? 0) * 0.3);
    const inv = Math.round((last?.cogs ?? 0) * 0.2);
    const totalAssets = (last?.cash ?? 0) + ar + inv;
    const ap = Math.round((last?.cogs ?? 0) * 0.1);
    const accr = Math.round((last?.expenses ?? 0) * 0.1);
    const debt = Math.round(totalAssets * 0.15);
    const totalLiab = ap + accr + debt;
    const equity = totalAssets - totalLiab;
    const balanceSheet = {
        asOf: last?.date ?? dates[dates.length - 1], lines: [
            { key: 'cash', label: 'Cash & Cash Equivalents', amount: last?.cash ?? 0 },
            { key: 'ar', label: 'Accounts Receivable', amount: ar },
            { key: 'inv', label: 'Inventory', amount: inv },
            { key: 'ta', label: 'Total Assets', amount: totalAssets },
            { key: 'ap', label: 'Accounts Payable', amount: -ap },
            { key: 'accr', label: 'Accruals', amount: -accr },
            { key: 'debt', label: 'Debt', amount: -debt },
            { key: 'tl', label: 'Total Liabilities', amount: -totalLiab },
            { key: 'eq', label: 'Equity', amount: equity },
        ]
    };

    const sum = (f: (p: TimeseriesPoint) => number) => series.reduce((s, p) => s + f(p), 0);
    const rev = sum(p => p.revenue), cogs = sum(p => p.cogs), opex = sum(p => p.expenses);
    const netIncome = (rev - cogs) - opex;
    const operating = netIncome + Math.round(cogs * 0.1) - Math.round(rev * 0.05);
    const investing = -Math.round(rev * 0.08);
    const financing = Math.round(rev * 0.03) - Math.round(rev * 0.02);
    const netChange = operating + investing + financing;
    const cashflow = {
        from: series[0]?.date ?? dates[0], to: series[series.length - 1]?.date ?? dates[dates.length - 1], lines: [
            { key: 'op', label: 'Net Cash from Operating Activities', amount: operating },
            { key: 'inv', label: 'Net Cash from Investing Activities', amount: investing },
            { key: 'fin', label: 'Net Cash from Financing Activities', amount: financing },
            { key: 'net', label: 'Net Change in Cash', amount: netChange },
        ], netChange
    };

    const prev = series[series.length - 2] ?? last;
    const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100);
    const kpis = [
        { key: 'revenue', label: 'Revenue', value: last?.revenue ?? 0, delta: Number(pct(last?.revenue ?? 0, prev?.revenue ?? 0).toFixed(1)) },
        { key: 'grossProfit', label: 'Gross Profit', value: (last?.revenue ?? 0) - (last?.cogs ?? 0), delta: Number(pct(((last?.revenue ?? 0) - (last?.cogs ?? 0)), ((prev?.revenue ?? 0) - (prev?.cogs ?? 0))).toFixed(1)) },
        { key: 'netIncome', label: 'Net Income', value: ((last?.revenue ?? 0) - (last?.cogs ?? 0) - (last?.expenses ?? 0)), delta: Number(pct(((last?.revenue ?? 0) - (last?.cogs ?? 0) - (last?.expenses ?? 0)), ((prev?.revenue ?? 0) - (prev?.cogs ?? 0) - (prev?.expenses ?? 0))).toFixed(1)) },
        { key: 'cashBalance', label: 'Cash Balance', value: last?.cash ?? 0, delta: Number(pct(last?.cash ?? 0, prev?.cash ?? 0).toFixed(1)) },
        { key: 'burnRate', label: 'Burn Rate', value: -Math.max(0, (last?.expenses ?? 0) - ((last?.revenue ?? 0) - (last?.cogs ?? 0))), delta: Number(pct(((prev?.expenses ?? 0) - ((prev?.revenue ?? 0) - (prev?.cogs ?? 0))), ((last?.expenses ?? 0) - ((last?.revenue ?? 0) - (last?.cogs ?? 0)))).toFixed(1)) }
    ];

    const insights = [
        { id: 'i1', title: 'Q4 seasonal lift', detail: 'Revenue spikes in Nov-Dec driven by retail peak season.', severity: 'medium' as const },
        { id: 'i2', title: 'Inflationary pressure 2023', detail: 'Operating expenses increased post mid-2023 due to inflation.', severity: 'high' as const },
        { id: 'i3', title: 'Cash position improving', detail: 'Net positive months increased, extending runway.', severity: 'low' as const },
    ];

    return NextResponse.json({ companies, entities, currency, exchangeRates, series, balanceSheet, cashflow, kpis, insights });
}
