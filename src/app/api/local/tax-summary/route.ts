import { NextRequest } from 'next/server';
import { query, seedIfEmpty } from '@shared/api/localDb';

export async function GET(_req: NextRequest) {
    seedIfEmpty();
    const series = query('SELECT revenue FROM series WHERE company_id = ? ORDER BY date DESC LIMIT 1', ['lagos']) as any[];
    const sales = Math.round((series[0]?.revenue ?? 5_000_000));
    const outputVAT = Math.round(sales * 0.075);
    const inputVAT = Math.round(sales * 0.015);
    const totalPayable = Math.max(0, outputVAT - inputVAT);
    const payload = { vat: { totalPayable, taxableSales: sales, inputVAT, outputVAT }, paye: { total: Math.round(sales * 0.03), employees: 42 }, wht: { total: Math.round(sales * 0.01) } };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
