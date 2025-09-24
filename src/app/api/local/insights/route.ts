import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
import { listInsights, upsertInsight, updateInsight, deactivateInsight, seedIfEmpty } from '@shared/api/localDb';

export async function GET(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const companies = searchParams.get('companies');
    const limit = Number(searchParams.get('limit') || 10);
    const list = listInsights(companies ? companies.split(',').map(s => s.trim()).filter(Boolean) : undefined, limit);
    return Response.json({ items: list });
}

export async function POST(req: NextRequest) {
    seedIfEmpty();
    const body = await req.json().catch(() => ({}));
    if (!body?.title || !body?.detail || !body?.severity) {
        return Response.json({ error: 'title, detail, severity are required' }, { status: 400 });
    }
    const item = upsertInsight({ id: body.id, company_id: body.company_id ?? null, title: body.title, detail: body.detail, severity: body.severity });
    return Response.json({ ok: true, item });
}

export async function PATCH(req: NextRequest) {
    seedIfEmpty();
    const body = await req.json().catch(() => ({}));
    if (!body?.id) return Response.json({ error: 'id is required' }, { status: 400 });
    const next = updateInsight(String(body.id), body);
    if (!next) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ ok: true, item: next });
}

export async function DELETE(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
    const ok = deactivateInsight(id);
    return Response.json({ ok });
}
