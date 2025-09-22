import { NextRequest, NextResponse } from 'next/server';

type AIRequest = {
    prompt?: string;
    question?: string; // legacy support
    companyId?: string;
    timeframe?: string; // e.g., 'last_90_days'
};

type AIResponse = {
    summary: string;
    bullets: string[];
    suggestions: string[];
    slideNotes: string[];
};

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => ({}))) as AIRequest;
    const prompt = body.prompt ?? body.question ?? '';
    const companyId = body.companyId ?? 'c1';
    const timeframe = body.timeframe ?? 'last_30_days';
    await new Promise((r) => setTimeout(r, 400));

    const base = `Company ${companyId}, timeframe ${timeframe}`;
    const trimmed = prompt.trim().slice(0, 160);

    const res: AIResponse = {
        summary: `Demo AI summary for: "${trimmed || 'N/A'}". ${base}. Revenue is trending up while expenses reflect inflation pressure in 2023.`,
        bullets: [
            'Revenue shows seasonal peaks in Q4; expenses elevated post mid-2023.',
            'Gross margin stable ~60% with slight variance due to COGS drift.',
            'Cash balance improving on reduced burn and steady collections.'
        ],
        suggestions: [
            'Optimize pricing to offset FX-driven costs.',
            'Negotiate supplier terms; phase imports to reduce FX exposure.',
            'Increase upsell to top 20% customers and improve receivables days.'
        ],
        slideNotes: [
            'Slide 1: Overview — call out Q4 seasonality and inflation impact.',
            'Slide 2: Profitability — highlight margin resilience and cost controls.',
            'Slide 3: Cash — runway extended; focus on working capital.'
        ]
    };

    return NextResponse.json(res);
}
