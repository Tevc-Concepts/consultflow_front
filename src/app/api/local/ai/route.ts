import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt || body.question || '';
    const data = {
        summary: `Local AI (stub): ${prompt} — Cash stable; growth driven by Q4.`,
        bullets: ['Revenue up 8% QoQ.', 'COGS stable at 42-45%.', 'Runway ~9 months.'],
        suggestions: ['Trim opex by 5%.', 'Prioritize high-margin SKUs.', 'Automate AR collections.'],
        slideNotes: ['Use these in the board pack.']
    };
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
