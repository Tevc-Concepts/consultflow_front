import { NextRequest, NextResponse } from 'next/server';

type Point = { date: string; revenue: number; expenses: number };
type ScenarioKey = 'baseline' | 'rev_down_20' | 'exp_up_15' | 'fx_vol';
type ForecastResponse = { horizonMonths: number; baseline: Point[]; scenarios: Record<ScenarioKey, Point[]>; ai: { summary: string; insights: string[] } };

function genBaseline(months = 12): Point[] {
    const now = new Date();
    const arr: Point[] = [];
    let lastRev = 6000000; let lastExp = 2800000;
    for (let i = 1; i <= months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const seasonal = [0.96, 0.98, 1.0, 1.03, 1.05, 1.08, 1.1, 1.12, 1.15, 1.2, 1.3, 1.4][d.getMonth()];
        lastRev = Math.round(lastRev * (1 + 0.015) * seasonal);
        lastExp = Math.round(lastExp * (1 + 0.012));
        arr.push({ date: d.toISOString().slice(0, 10), revenue: lastRev, expenses: lastExp });
    }
    return arr;
}

function clone(points: Point[], f: (p: Point, idx: number) => Point): Point[] { return points.map(f); }

export async function GET(req: NextRequest) {
    const months = Number(new URL(req.url).searchParams.get('months') || 12);
    const baseline = genBaseline(months);
    const scenarios: Record<ScenarioKey, Point[]> = {
        baseline,
        rev_down_20: clone(baseline, (p) => ({ ...p, revenue: Math.round(p.revenue * 0.8) })),
        exp_up_15: clone(baseline, (p) => ({ ...p, expenses: Math.round(p.expenses * 1.15) })),
        fx_vol: clone(baseline, (p, i) => ({ ...p, revenue: Math.round(p.revenue * (i % 2 === 0 ? 0.94 : 1.06)), expenses: Math.round(p.expenses * (i % 2 === 0 ? 1.06 : 0.94)) }))
    };
    const ai = {
        summary: 'Baseline shows steady growth; stress scenarios reveal sensitivity to revenue shocks and FX volatility.',
        insights: [
            'Revenue -20% reduces net by ~30–40%; prioritize pipeline and pricing.',
            'Expenses +15% compresses margins; evaluate discretionary spend.',
            'FX volatility swings widen; hedge USD-linked costs where feasible.'
        ]
    };
    const res: ForecastResponse = { horizonMonths: months, baseline, scenarios, ai };
    await new Promise(r => setTimeout(r, 300));
    return NextResponse.json(res);
}
