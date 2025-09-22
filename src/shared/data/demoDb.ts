'use client';

// Lightweight local demo DB for PWA/offline. All values are base NGN; consumers convert via FX.

export type Currency = 'NGN' | 'USD' | 'CFA';
export type ExchangePoint = { month: string; usd: number; cfa: number }; // NGN per USD/CFA
export type TimeseriesPoint = { date: string; revenue: number; cogs: number; expenses: number; cash: number };
export type KPIKey = 'revenue' | 'grossProfit' | 'netIncome' | 'cashBalance' | 'burnRate';
export type KPI = { key: KPIKey; label: string; value: number; delta: number };

export type ReportsData = {
    companies: Array<{ id: string; name: string; currency: Currency }>;
    entities: Array<{ id: string; name: string; companyId: string }>;
    currency: Currency;
    exchangeRates: ExchangePoint[];
    kpis: KPI[];
    series: TimeseriesPoint[];
    balanceSheet: { asOf: string; lines: Array<{ key: string; label: string; amount: number }> };
    cashflow: { from: string; to: string; lines: Array<{ key: string; label: string; amount: number }>; netChange: number };
    insights: Array<{ id: string; title: string; detail: string; severity: 'low' | 'medium' | 'high' }>;
};

const KEY = 'consultflow:demodb:v1';
const ADJ_KEY = 'consultflow:demodb:adjustments:v1';

type DB = {
    version: number;
    months: string[]; // YYYY-MM sequence (24 months ending current month)
    companies: Array<{ id: string; name: string; currency: Currency }>;
    entities: Array<{ id: string; name: string; companyId: string }>;
    exchangeRates: ExchangePoint[];
    perCompanySeries: Record<string, TimeseriesPoint[]>; // values in NGN
};

function save(db: DB) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { } }
function load(): DB | null { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as DB : null; } catch { return null; } }
type Adjustment = { id: string; companies: string[]; date: string; field: 'revenue' | 'cogs' | 'expenses'; delta: number; note?: string; createdAt: string };
type AdjStore = { version: number; items: Adjustment[] };
function loadAdj(): AdjStore { try { const raw = localStorage.getItem(ADJ_KEY); if (!raw) return { version: 1, items: [] }; const obj = JSON.parse(raw) as AdjStore; return { version: 1, items: obj.items || [] }; } catch { return { version: 1, items: [] }; } }
function saveAdj(store: AdjStore) { try { localStorage.setItem(ADJ_KEY, JSON.stringify(store)); } catch { } }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function iso(d: Date) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10); }

function genMonths24(): { months: string[]; dates: string[] } {
    const now = new Date();
    const months: string[] = []; const dates: string[] = [];
    for (let i = 23; i >= 0; i--) { const d = new Date(now); d.setMonth(d.getMonth() - i); months.push(ym(d)); dates.push(iso(d)); }
    return { months, dates };
}

function genExchange24(months: string[]): ExchangePoint[] {
    return months.map((m, i) => {
        const [y, mm] = m.split('-').map(Number); const monthIdx = mm - 1;
        let usd = 450, cfa = 0.75;
        if (y >= 2023) {
            usd = 450 + i * 12; if (y === 2023 && monthIdx >= 5) usd += 200; if (y >= 2024) usd = 900 + i * 8; cfa = 0.75 + i * 0.002;
        }
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

function seed(): DB {
    const { months, dates } = genMonths24();
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
    const exchangeRates = genExchange24(months);
    const perCompanySeries: Record<string, TimeseriesPoint[]> = {
        lagos: genCompanySeries('lagos', dates),
        accra: genCompanySeries('accra', dates),
        abuja: genCompanySeries('abuja', dates)
    };
    const db: DB = { version: 1, months, companies, entities, exchangeRates, perCompanySeries } as any;
    save(db); return db;
}

function ensure(): DB { return load() ?? seed(); }

export type ReportQuery = { company?: string; currency?: Currency; range?: '30' | '90' | 'custom'; from?: string; to?: string };

function monthOf(dateIso: string) { return dateIso.slice(0, 7); }

function applyAdjustments(db: DB, compSel: string[]): Record<string, TimeseriesPoint[]> {
    // deep clone relevant series first
    const clone: Record<string, TimeseriesPoint[]> = {};
    for (const id of compSel) clone[id] = db.perCompanySeries[id].map(p => ({ ...p }));
    const store = loadAdj();
    if (store.items.length === 0) return clone;
    // Precompute initial base cash for each company to recalc cash later
    const baseCash: Record<string, number> = {};
    for (const id of compSel) {
        const s = db.perCompanySeries[id];
        if (s.length) baseCash[id] = s[0].cash - (s[0].revenue - s[0].cogs - s[0].expenses);
        else baseCash[id] = 0;
    }
    // Apply deltas by month match
    for (const adj of store.items) {
        const targets = adj.companies.filter(c => compSel.includes(c));
        if (targets.length === 0) continue;
        for (const id of targets) {
            const arr = clone[id];
            const m = monthOf(adj.date);
            for (let i = 0; i < arr.length; i++) {
                if (monthOf(arr[i].date) === m) {
                    (arr[i] as any)[adj.field] = Math.max(0, (arr[i] as any)[adj.field] + adj.delta);
                    break;
                }
            }
        }
    }
    // Recalculate cash per company from baseCash and adjusted nets
    for (const id of compSel) {
        const arr = clone[id];
        let c0 = baseCash[id] ?? 0;
        for (let i = 0; i < arr.length; i++) {
            const net = arr[i].revenue - arr[i].cogs - arr[i].expenses;
            c0 = c0 + net;
            arr[i].cash = c0;
        }
    }
    return clone;
}

export function getReports(q: ReportQuery = {}): ReportsData {
    const db = ensure();
    const compSel = (q.company ? q.company.split(',').map(s => s.trim()).filter(Boolean) : ['lagos']);
    // Apply adjustments to selected companies
    const adjSeries = applyAdjustments(db, compSel);
    const seriesArr = adjSeries[compSel[0]]?.map((_, idx) => {
        const items = compSel.map(id => adjSeries[id][idx]);
        const sum = { date: db.perCompanySeries[compSel[0]][idx].date, revenue: 0, cogs: 0, expenses: 0, cash: 0 };
        for (const it of items) { sum.revenue += it.revenue; sum.cogs += it.cogs; sum.expenses += it.expenses; sum.cash += it.cash; }
        return sum;
    }) ?? [];

    // Range filtering (coarse): 30->last 1, 90->last 3 months; custom by date if provided
    let series = seriesArr;
    if (q.range === '30') series = series.slice(-1);
    else if (q.range === '90') series = series.slice(-3);
    else if (q.range === 'custom' && q.from && q.to) {
        const from = q.from; const to = q.to;
        series = series.filter(p => p.date >= from && p.date <= to);
    }

    const last = series[series.length - 1]; const prev = series[series.length - 2] ?? series[series.length - 1];
    const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100);
    const kpis: KPI[] = [
        { key: 'revenue', label: 'Revenue', value: last?.revenue ?? 0, delta: Number(pct(last?.revenue ?? 0, prev?.revenue ?? 0).toFixed(1)) },
        { key: 'grossProfit', label: 'Gross Profit', value: (last?.revenue ?? 0) - (last?.cogs ?? 0), delta: Number(pct((last?.revenue ?? 0) - (last?.cogs ?? 0), (prev?.revenue ?? 0) - (prev?.cogs ?? 0)).toFixed(1)) },
        { key: 'netIncome', label: 'Net Income', value: (last?.revenue ?? 0) - (last?.cogs ?? 0) - (last?.expenses ?? 0), delta: Number(pct(((last?.revenue ?? 0) - (last?.cogs ?? 0) - (last?.expenses ?? 0)), ((prev?.revenue ?? 0) - (prev?.cogs ?? 0) - (prev?.expenses ?? 0))).toFixed(1)) },
        { key: 'cashBalance', label: 'Cash Balance', value: last?.cash ?? 0, delta: Number(pct(last?.cash ?? 0, prev?.cash ?? 0).toFixed(1)) },
        { key: 'burnRate', label: 'Burn Rate', value: -(Math.max(0, (last?.expenses ?? 0) - ((last?.revenue ?? 0) - (last?.cogs ?? 0)))), delta: Number(pct((prev?.expenses ?? 0) - ((prev?.revenue ?? 0) - (prev?.cogs ?? 0)), (last?.expenses ?? 0) - ((last?.revenue ?? 0) - (last?.cogs ?? 0))).toFixed(1)) }
    ];

    // Balance Sheet (as of last point)
    const cash = last?.cash ?? 0;
    const ar = Math.round((last?.revenue ?? 0) * 0.3);
    const inv = Math.round((last?.cogs ?? 0) * 0.2);
    const totalAssets = cash + ar + inv;
    const ap = Math.round((last?.cogs ?? 0) * 0.1);
    const accr = Math.round((last?.expenses ?? 0) * 0.1);
    const debt = Math.round(totalAssets * 0.15);
    const totalLiab = ap + accr + debt;
    const equity = totalAssets - totalLiab;
    const balanceSheet = {
        asOf: last?.date ?? db.perCompanySeries[compSel[0]][0].date, lines: [
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
    };

    // Cash Flow (window sum)
    const sum = (f: (p: TimeseriesPoint) => number) => series.reduce((s, p) => s + f(p), 0);
    const rev = sum(p => p.revenue), cogs = sum(p => p.cogs), opex = sum(p => p.expenses);
    const netIncome = (rev - cogs) - opex;
    const operating = netIncome + Math.round(cogs * 0.1) - Math.round(rev * 0.05);
    const investing = -Math.round(rev * 0.08);
    const financing = Math.round(rev * 0.03) - Math.round(rev * 0.02);
    const netChange = operating + investing + financing;
    const cashflow = {
        from: series[0]?.date ?? db.perCompanySeries[compSel[0]][0].date, to: last?.date ?? '', lines: [
            { key: 'op', label: 'Net Cash from Operating Activities', amount: operating },
            { key: 'inv', label: 'Net Cash from Investing Activities', amount: investing },
            { key: 'fin', label: 'Net Cash from Financing Activities', amount: financing },
            { key: 'net', label: 'Net Change in Cash', amount: netChange },
        ], netChange
    };

    const insights = [
        { id: 'i1', title: 'Q4 seasonal lift', detail: 'Revenue spikes in Nov-Dec driven by retail peak season.', severity: 'medium' as const },
        { id: 'i2', title: 'Inflationary pressure 2023', detail: 'Operating expenses increased post mid-2023 due to inflation.', severity: 'high' as const },
        { id: 'i3', title: 'Cash position improving', detail: 'Net positive months increased, extending runway.', severity: 'low' as const },
    ];

    return {
        companies: db.companies,
        entities: db.entities,
        currency: (q.currency ?? 'NGN') as Currency,
        exchangeRates: db.exchangeRates,
        kpis, series, balanceSheet, cashflow, insights
    };
}

export function getForecast(months = 12) {
    const db = ensure();
    const base = db.perCompanySeries['lagos'];
    const last = base[base.length - 1];
    const mk = (idx: number) => {
        const d = new Date(last.date); d.setMonth(d.getMonth() + idx + 1);
        const seasonal = [0.95, 0.92, 0.98, 1.02, 1.05, 1.07, 1.1, 1.12, 1.15, 1.25, 1.35, 1.5][d.getMonth()];
        const revenue = Math.round((last.revenue * (1 + (idx + 1) * 0.015)) * seasonal);
        const expenses = Math.round((last.expenses * (1 + (idx + 1) * 0.01)) * (0.98 + (idx % 5) / 100));
        return { date: iso(d), revenue, expenses };
    };
    const baseline = Array.from({ length: months }).map((_, i) => mk(i));
    const scenarios = {
        rev_down_20: baseline.map(p => ({ ...p, revenue: Math.round(p.revenue * 0.8) })),
        exp_up_15: baseline.map(p => ({ ...p, expenses: Math.round(p.expenses * 1.15) })),
        fx_vol: baseline.map((p, i) => ({ ...p, revenue: Math.round(p.revenue * (0.98 + (i % 6) / 100)), expenses: Math.round(p.expenses * (1.02 - (i % 4) / 200)) }))
    };
    const ai = { summary: 'Baseline shows steady growth; downside risk reduces revenue by ~20%; expenses sensitivity increases burn by ~15%.', insights: ['Maintain 6+ months runway.', 'Reduce COGS via supplier renegotiation.', 'Hedge FX exposure for imports.'] };
    return { horizonMonths: months, baseline, scenarios, ai };
}

export function getTaxSummary() {
    // Rough demo numbers derived from last months
    const r = getReports({});
    const sales = Math.round(r.kpis.find(k => k.key === 'revenue')?.value ?? 0);
    const outputVAT = Math.round(sales * 0.075);
    const inputVAT = Math.round(sales * 0.015);
    const totalPayable = Math.max(0, outputVAT - inputVAT);
    return { vat: { totalPayable, taxableSales: sales, inputVAT, outputVAT }, paye: { total: Math.round(sales * 0.03), employees: 42 }, wht: { total: Math.round(sales * 0.01) } };
}

export function getAI(prompt: string) {
    return {
        summary: `Demo AI: ${prompt} — Cash stable; growth driven by Q4.`,
        bullets: ['Revenue up 8% QoQ.', 'COGS stable at 42-45%.', 'Runway ~9 months.'],
        suggestions: ['Trim opex by 5%.', 'Prioritize high-margin SKUs.', 'Automate AR collections.'],
        slideNotes: ['Use these in the board pack.']
    };
}

// Adjustments CRUD (public API)
export type AdjustmentInput = { companies: string[]; date: string; field: 'revenue' | 'cogs' | 'expenses'; delta: number; note?: string };
export function listAdjustments(companies?: string[]) {
    const store = loadAdj();
    if (!companies || companies.length === 0) return store.items;
    const set = new Set(companies);
    return store.items.filter(a => a.companies.some(c => set.has(c)));
}
export function addAdjustment(input: AdjustmentInput) {
    const store = loadAdj();
    const item: Adjustment = { id: uid(), companies: input.companies, date: input.date, field: input.field, delta: input.delta, note: input.note, createdAt: new Date().toISOString() };
    store.items.push(item); saveAdj(store); return item;
}
export function deleteAdjustment(id: string) {
    const store = loadAdj();
    const idx = store.items.findIndex(x => x.id === id);
    if (idx >= 0) { store.items.splice(idx, 1); saveAdj(store); return true; }
    return false;
}
