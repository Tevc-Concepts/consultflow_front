import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
import { seedIfEmpty, upsertSeriesRows, query, listCompanies } from '@shared/api/localDb';

async function readBodyAsText(req: NextRequest): Promise<string> {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const json = await req.json().catch(() => ({}));
        return typeof json === 'string' ? json : JSON.stringify(json);
    } else if (contentType.includes('multipart/form-data')) {
        const form = await req.formData().catch(() => undefined);
        const file = form?.get('file') as any;
        if (file && typeof file.arrayBuffer === 'function') {
            const buf = Buffer.from(await file.arrayBuffer());
            return buf.toString('utf-8');
        }
        const txt = form?.get('text');
        return (typeof txt === 'string') ? txt : '';
    } else {
        return await req.text().catch(() => '');
    }
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string): string[] => {
        const out: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
                else inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                out.push(cur.trim()); cur = '';
            } else {
                cur += ch;
            }
        }
        out.push(cur.trim());
        return out.map(s => s.replace(/^"|"$/g, ''));
    };
    const headers = parseLine(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).map(parseLine);
    return { headers, rows };
}

function suggestMappings(headers: string[]) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const wanted: Record<string, string[]> = {
        date: ['date', 'month', 'period'],
        revenue: ['revenue', 'sales', 'income'],
        cogs: ['cogs', 'costofgoods', 'costs'],
        expenses: ['expenses', 'opex', 'operatingexpenses'],
        cash: ['cash', 'cashbalance']
    };
    return headers.map(h => {
        const n = norm(h);
        let best: string | null = null; let conf = 0;
        for (const [field, keys] of Object.entries(wanted)) {
            for (const k of keys) {
                if (n === k) { best = field; conf = 0.99; break; }
                if (n.includes(k)) { best = field; conf = Math.max(conf, 0.7); }
            }
        }
        return { column: h, suggestedField: best ?? '', confidence: conf };
    });
}

export async function POST(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || listCompanies(true)[0]?.id || 'lagos';
    const text = await readBodyAsText(req);
    const { headers, rows } = parseCSV(text);
    const mappings = suggestMappings(headers);
    const idx = (name: string) => {
        const m = mappings.find(m => m.suggestedField === name);
        return m ? headers.findIndex(h => h === m.column) : -1;
    };
    const di = idx('date');
    const ri = idx('revenue');
    const ci = idx('cogs');
    const ei = idx('expenses');
    const cashi = idx('cash');
    const last: any = query('SELECT cash FROM series WHERE company_id = ? AND is_active = 1 ORDER BY date DESC LIMIT 1', [company]);
    let prevCash = last?.cash ?? 0;
    const toUpsert: Array<{ company_id: string; date: string; revenue: number; cogs: number; expenses: number; cash: number; is_active: number }> = [];
    for (const r of rows) {
        if (di < 0) continue;
        const dateRaw = r[di];
        if (!dateRaw) continue;
        const date = new Date(dateRaw).toISOString().slice(0, 10);
        const revenue = ri >= 0 ? Number(r[ri] || 0) : 0;
        const cogs = ci >= 0 ? Number(r[ci] || 0) : 0;
        const expenses = ei >= 0 ? Number(r[ei] || 0) : 0;
        let cash = cashi >= 0 ? Number(r[cashi] || 0) : (prevCash + revenue - cogs - expenses);
        if (!isFinite(cash)) cash = 0;
        prevCash = cash;
        toUpsert.push({ company_id: company, date, revenue, cogs, expenses, cash, is_active: 1 });
    }
    if (toUpsert.length) upsertSeriesRows(toUpsert);
    const previewRows = rows.slice(0, 10).map((arr) => Object.fromEntries(headers.map((h, i) => [h, arr[i]])));
    const preview = { rows: previewRows, headers, mappings };
    return new Response(JSON.stringify({ preview }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
