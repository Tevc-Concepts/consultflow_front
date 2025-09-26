import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
import { listCompanies, upsertCompany, updateCompany, deactivateCompany, seedIfEmpty } from '@shared/api/localDb';

export async function GET() {
    seedIfEmpty();
    const companies = listCompanies(false);
    
    // Transform to match the expected format for the frontend
    const items = companies.map(company => ({
        id: company.id,
        name: company.name, 
        currency: company.currency,
        fiscal_year_start: '2024-01-01',
        fiscal_year_end: '2024-12-31',
        is_active: company.is_active === 1
    }));
    
    return Response.json({ items });
}

export async function POST(req: NextRequest) {
    seedIfEmpty();
    const body = await req.json().catch(() => ({}));
    if (!body?.id || !body?.name || !body?.currency) {
        return Response.json({ error: 'id, name, currency are required' }, { status: 400 });
    }
    const item = upsertCompany({ id: String(body.id), name: String(body.name), currency: String(body.currency), is_active: body.is_active ?? 1 });
    return Response.json({ ok: true, item });
}

export async function PATCH(req: NextRequest) {
    seedIfEmpty();
    const body = await req.json().catch(() => ({}));
    if (!body?.id) return Response.json({ error: 'id is required' }, { status: 400 });
    const next = updateCompany(String(body.id), body);
    if (!next) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ ok: true, item: next });
}

export async function DELETE(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
    const ok = deactivateCompany(id);
    return Response.json({ ok });
}
