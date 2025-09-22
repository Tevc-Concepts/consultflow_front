import { NextResponse } from 'next/server';

export type KPIKey = 'revenue' | 'grossProfit' | 'netIncome' | 'cashBalance' | 'burnRate';

export type KPI = {
    key: KPIKey;
    label: string;
    value: number;
    delta: number; // percentage change
};

export type TimeseriesPoint = {
    date: string; // ISO date (YYYY-MM-DD)
    revenue: number;
    cogs: number;
    expenses: number;
    cash: number;
};

export type Insight = {
    id: string;
    title: string;
    detail: string;
    severity: 'low' | 'medium' | 'high';
};

export type ExchangePoint = { month: string; usd: number };

export type ReportsResponse = {
    companies: Array<{ id: string; name: string }>;
    entities: Array<{ id: string; name: string; companyId: string }>;
    currency: 'NGN';
    exchangeRates: ExchangePoint[]; // monthly USD->NGN for last 24 months
    kpis: KPI[];
    series: TimeseriesPoint[]; // last 24 months
    insights: Insight[];
};

function generateDemoData(): ReportsResponse {
    // Companies & entities
    const companies = [
        { id: 'c1', name: 'Lagos Retail Ltd' },
        { id: 'c2', name: 'Abuja Services Co' }
    ];
    const entities = [
        { id: 'e1', name: 'Lagos Retail HQ', companyId: 'c1' },
        { id: 'e2', name: 'Lagos Retail Ikeja', companyId: 'c1' },
        { id: 'e3', name: 'Abuja Services HQ', companyId: 'c2' }
    ];

    const currency: 'NGN' = 'NGN';

    // Exchange rates (USD->NGN), showing 2023 spike
    const now = new Date();
    const exchangeRates: ExchangePoint[] = Array.from({ length: 24 }).map((_, i) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (23 - i));
        // base curve with spike in 2023
        const year = d.getFullYear();
        let usd = 450; // early 2023 ~450 NGN/USD
        if (year >= 2023) {
            usd = 450 + (i * 12); // drifting up
            if (year === 2023 && d.getMonth() >= 5) usd += 200; // mid-2023 spike
            if (year >= 2024) usd = 900 + (i * 8); // 2024-2025 high range
        }
        return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, usd };
    });

    // Revenue model: seasonality + growth + inflationary effects
    const series: TimeseriesPoint[] = [];
    let cash = 8500000; // NGN starting cash
    for (let i = 0; i < 24; i++) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (23 - i));
        const month = d.getMonth();

        // seasonality (e.g., holidays Q4 boost, slower Q1)
        const seasonal = [0.95, 0.92, 0.98, 1.02, 1.05, 1.07, 1.1, 1.12, 1.15, 1.25, 1.35, 1.5][month];
        const baseRevenue = 5000000; // 5m NGN base monthly
        const growth = 1 + i * 0.01; // 1% monthly growth
        const inflation = i > 6 ? 1.02 : 1; // inflation impact post mid-2023
        const revenue = Math.round(baseRevenue * seasonal * growth * inflation);

        // COGS ~ 40% of revenue with noise
        const cogs = Math.round(revenue * (0.4 + (Math.sin(i) * 0.02)));
        // Expenses ~ 45% of revenue plus inflationary drift
        const expenses = Math.round(revenue * 0.45 * (1 + (i / 100)));

        // Cash accumulation
        const net = revenue - cogs - expenses;
        cash += net;

        series.push({
            date: d.toISOString().slice(0, 10),
            revenue,
            cogs,
            expenses,
            cash
        });
    }

    // KPIs based on last month
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100);
    const kpis: KPI[] = [
        { key: 'revenue', label: 'Revenue', value: last.revenue, delta: Number(pct(last.revenue, prev.revenue).toFixed(1)) },
        { key: 'grossProfit', label: 'Gross Profit', value: last.revenue - last.cogs, delta: Number(pct(last.revenue - last.cogs, prev.revenue - prev.cogs).toFixed(1)) },
        { key: 'netIncome', label: 'Net Income', value: last.revenue - last.cogs - last.expenses, delta: Number(pct(last.revenue - last.cogs - last.expenses, prev.revenue - prev.cogs - prev.expenses).toFixed(1)) },
        { key: 'cashBalance', label: 'Cash Balance', value: last.cash, delta: Number(pct(last.cash, prev.cash).toFixed(1)) },
        { key: 'burnRate', label: 'Burn Rate', value: -(Math.max(0, last.expenses - (last.revenue - last.cogs))), delta: Number(pct(prev.expenses - (prev.revenue - prev.cogs), last.expenses - (last.revenue - last.cogs)).toFixed(1)) }
    ];

    const insights: Insight[] = [
        { id: 'i1', title: 'Q4 seasonal lift', detail: 'Revenue spikes in Nov-Dec driven by retail peak season.', severity: 'medium' },
        { id: 'i2', title: 'Inflationary pressure 2023', detail: 'Operating expenses increased post mid-2023 due to inflation.', severity: 'high' },
        { id: 'i3', title: 'Cash position improving', detail: 'Net positive months increased, extending runway.', severity: 'low' }
    ];

    return { companies, entities, currency, exchangeRates, kpis, series, insights };
}

export async function GET() {
    // Simulate latency for skeleton demo
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(generateDemoData());
}
