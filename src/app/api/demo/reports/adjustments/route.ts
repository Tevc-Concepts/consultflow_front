import { NextRequest, NextResponse } from 'next/server';

// Server route is thin: for demo we keep data client-side via adapter.
// Still provide shapes for future live parity.

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const companies = (searchParams.get('companies') || '').split(',').map(s => s.trim()).filter(Boolean);
    return NextResponse.json({ items: [], companies });
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ ok: true, item: { id: 'demo', ...body } });
}

export async function DELETE(req: NextRequest) {
    return NextResponse.json({ ok: true });
}
