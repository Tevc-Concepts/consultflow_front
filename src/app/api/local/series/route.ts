import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
import { upsertSeriesRows, seedIfEmpty } from '@shared/api/localDb';

export async function POST(req: NextRequest) {
    seedIfEmpty();
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};
    if (contentType.includes('application/json')) {
        body = await req.json().catch(() => ({}));
    } else if (contentType.includes('multipart/form-data')) {
        const fd = await req.formData().catch(() => undefined);
        const json = fd?.get('json');
        try { body = typeof json === 'string' ? JSON.parse(json) : json; } catch { body = {}; }
    } else {
        try { body = JSON.parse(await req.text()); } catch { body = {}; }
    }
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return Response.json({ error: 'rows[] required' }, { status: 400 });
    // Basic shape validation
    const mapped = rows.map((r: any) => ({
        company_id: String(r.company_id),
        date: String(r.date),
        revenue: Number(r.revenue || 0),
        cogs: Number(r.cogs || 0),
        expenses: Number(r.expenses || 0),
        cash: Number(r.cash || 0),
        is_active: r.is_active == null ? 1 : Number(r.is_active)
    }));
    upsertSeriesRows(mapped);
    return Response.json({ ok: true, count: mapped.length });
}
