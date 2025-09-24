'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import CSVTemplateDownload from '@shared/components/CSVTemplateDownload';
import Skeleton from '@shared/components/Skeleton';

type Preview = {
    preview?: {
        rows: Array<Record<string, string>>;
        headers: string[];
        mappings: Array<{ column: string; suggestedField: string; confidence: number }>;
    };
    error?: string;
};

export default function UploadPage() {
    const [file, setFile] = React.useState<File | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<Preview | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        setLoading(true);
        setData(null);
        try {
            const res = await fetch('/api/local/upload', { method: 'POST', body: form });
            const json = (await res.json()) as Preview;
            setData(json);
        } catch (err: any) {
            setData({ error: err?.message ?? 'Upload failed' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container py-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1>Upload</h1>
            </div>

            <Card>
                <div className="space-y-4">
                    <p className="text-sm text-deep-navy/80">
                        Use the CSV templates to format your data before uploading. This improves mapping accuracy and reduces errors.
                    </p>
                    <CSVTemplateDownload />

                    <hr className="border-medium/60" />

                    <form onSubmit={onSubmit} className="space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <label htmlFor="file" className="text-sm text-deep-navy/80">Choose CSV file</label>
                            <input
                                id="file"
                                name="file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                            />
                            <Button type="submit" variant="primary" size="sm" disabled={!file || loading}>
                                {loading ? 'Uploading…' : 'Upload'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            <Card header={<h3 className="text-lg font-semibold">Required fields & common pitfalls</h3>}>
                <ul className="list-disc pl-6 text-sm text-deep-navy/90 space-y-1">
                    <li>
                        Transactions: date, description, amount or debit/credit, currency. Prefer ISO date (YYYY-MM-DD) and NGN currency.
                    </li>
                    <li>
                        Invoices: invoice_number, issue_date, due_date, customer, description, quantity, unit_price, currency.
                    </li>
                    <li>
                        Payroll: employee_id, full_name, month (YYYY-MM), gross_pay, paye, pension, nhf.
                    </li>
                    <li>
                        Pitfalls: wrong date format, thousand separators in numeric fields, mixed debit/credit with signed amount, extra hidden columns, header misspellings.
                    </li>
                    <li>
                        Tip: remove currency symbols (₦) and keep amounts as plain numbers; use UTF-8 encoding.
                    </li>
                </ul>
            </Card>

            <Card header={<h3 className="text-lg font-semibold">Preview & Mappings</h3>}>
                {loading ? (
                    <Skeleton className="h-24" />
                ) : data?.error ? (
                    <p className="text-sm text-coral">{data.error}</p>
                ) : data?.preview ? (
                    <div className="space-y-3 overflow-x-auto">
                        <div>
                            <h4 className="text-sm font-medium">Headers</h4>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {data.preview.headers.map((h) => (
                                    <span key={h} className="rounded-full bg-medium/50 px-2 py-0.5 text-xs">{h}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium">Suggested mappings</h4>
                            <ul className="text-sm">
                                {data.preview.mappings.map((m) => (
                                    <li key={m.column} className="flex items-center gap-2">
                                        <span className="font-mono">{m.column}</span>
                                        <span className="opacity-70">→</span>
                                        <span>{m.suggestedField}</span>
                                        <span className="text-xs opacity-70">({Math.round(m.confidence * 100)}%)</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium">First rows</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr>
                                            {data.preview.headers.map((h) => (
                                                <th key={h} className="text-left px-2 py-1 border-b border-medium/60">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.preview.rows.map((r, idx) => (
                                            <tr key={idx}>
                                                {data.preview!.headers.map((h) => (
                                                    <td key={h} className="px-2 py-1 border-b border-medium/40">{r[h]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-deep-navy/70">No preview yet. Select a CSV and click Upload.</p>
                )}
            </Card>
        </div>
    );
}
