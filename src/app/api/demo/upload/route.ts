import { NextRequest, NextResponse } from 'next/server';

type Mapping = {
    column: string;
    suggestedField: string;
    confidence: number; // 0..1
};

type UploadPreview = {
    rows: Array<Record<string, string>>; // first N rows
    headers: string[];
    mappings: Mapping[];
};

function guessField(name: string): string {
    const n = name.toLowerCase();
    if (/(date|txn\s*date|posted)/.test(n)) return 'date';
    if (/(amount|amt|value)/.test(n)) return 'amount';
    if (/(desc|narration|details)/.test(n)) return 'description';
    if (/(ref|id|reference)/.test(n)) return 'reference';
    if (/(debit)/.test(n)) return 'debit';
    if (/(credit)/.test(n)) return 'credit';
    return 'unknown';
}

function parseCSV(text: string, maxRows = 10): UploadPreview {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { rows: [], headers: [], mappings: [] };
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
        const cols = lines[i].split(',');
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = (cols[idx] ?? '').trim();
        });
        rows.push(row);
    }
    const mappings: Mapping[] = headers.map((h) => {
        const suggestedField = guessField(h);
        const confidence = suggestedField === 'unknown' ? 0.3 : 0.85;
        return { column: h, suggestedField, confidence };
    });
    return { rows, headers, mappings };
}

export async function POST(req: NextRequest) {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
        return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
    }
    const text = await file.text();
    const preview = parseCSV(text);
    return NextResponse.json({ preview });
}
