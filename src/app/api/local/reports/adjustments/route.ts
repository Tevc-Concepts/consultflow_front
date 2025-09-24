import { NextRequest } from 'next/server';
import { seedIfEmpty, listAdjustmentsLocal, insertAdjustment, deleteAdjustmentLocal } from '@shared/api/localDb';

export async function GET(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const companies = (searchParams.get('companies') || '').split(',').map(s => s.trim()).filter(Boolean);
    const rows = listAdjustmentsLocal(companies.length ? companies : undefined) as any[];
    const items = rows.map(r => ({
        id: r.id,
        companies: String(r.companies || '').split(',').filter((s: string) => !!s),
        date: r.date,
        field: r.field,
        delta: Number(r.delta || 0),
        note: r.note ?? undefined,
        createdAt: r.created_at ?? r.createdAt
    }));
    return new Response(JSON.stringify({ items }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: NextRequest) {
    seedIfEmpty();
    const body = await req.json();
    const inserted = insertAdjustment({
        companies: Array.isArray(body.companies) ? body.companies : [],
        date: body.date,
        field: body.field,
        delta: Number(body.delta || 0),
        note: body.note
    });
    const item = {
        id: inserted.id,
        companies: inserted.companies,
        date: inserted.date,
        field: inserted.field,
        delta: inserted.delta,
        note: inserted.note,
        createdAt: new Date().toISOString()
    };
    return new Response(JSON.stringify({ ok: true, item }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function DELETE(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const ok = id ? deleteAdjustmentLocal(id) : false;
    return new Response(JSON.stringify({ ok }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
