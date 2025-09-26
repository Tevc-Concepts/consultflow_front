import { NextRequest } from 'next/server';
import { query, seedIfEmpty } from '@shared/api/localDb';

export async function GET(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const months = Number(searchParams.get('months') || 12);
    const rows = query('SELECT date, revenue, expenses FROM series WHERE company_id = ? ORDER BY date DESC LIMIT 1', ['lagos-ng']) as any[];
    const last = rows[0] || { date: new Date().toISOString().slice(0, 10), revenue: 5000000, expenses: 2000000 };
    const mk = (idx: number) => {
        const d = new Date(last.date); d.setMonth(d.getMonth() + idx + 1);
        const seasonal = [0.95, 0.92, 0.98, 1.02, 1.05, 1.07, 1.1, 1.12, 1.15, 1.25, 1.35, 1.5][d.getMonth()];
        const revenue = Math.round((last.revenue * (1 + (idx + 1) * 0.015)) * seasonal);
        const expenses = Math.round((last.expenses * (1 + (idx + 1) * 0.01)) * (0.98 + (idx % 5) / 100));
        return { date: new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10), revenue, expenses };
    };
    const baseline = Array.from({ length: months }).map((_, i) => mk(i));
    const scenarios = {
        rev_down_20: baseline.map(p => ({ ...p, revenue: Math.round(p.revenue * 0.8) })),
        exp_up_15: baseline.map(p => ({ ...p, expenses: Math.round(p.expenses * 1.15) })),
        fx_vol: baseline.map((p, idx) => ({ 
            ...p, 
            revenue: Math.round(p.revenue * (1 + Math.sin(idx * 0.5) * 0.1)),
            expenses: Math.round(p.expenses * (1 + Math.cos(idx * 0.3) * 0.08))
        })),
    };
    const ai = { summary: 'Forecast indicates steady growth with manageable expense trends.', insights: ['Monitor expense growth', 'Consider price optimization'] };
    return new Response(JSON.stringify({ horizonMonths: months, baseline, scenarios, ai }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
