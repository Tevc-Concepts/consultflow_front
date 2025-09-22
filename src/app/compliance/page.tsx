'use client';

import * as React from 'react';
import getApi from '@shared/api/client';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';

type TaxSummary = {
    vat?: { totalPayable?: number; taxableSales?: number; inputVAT?: number; outputVAT?: number };
    paye?: { total?: number; employees?: number };
    wht?: { total?: number };
};

type Reminder = { id: string; title: string; date: string; kind: 'VAT' | 'PAYE' | 'WHT' };

const REM_KEY = 'consultflow:compliance:reminders:v1';

function useReminders() {
    const [enabled, setEnabled] = React.useState<Record<string, boolean>>({});
    React.useEffect(() => {
        try { const raw = localStorage.getItem(REM_KEY); if (raw) setEnabled(JSON.parse(raw)); } catch { }
    }, []);
    React.useEffect(() => {
        try { localStorage.setItem(REM_KEY, JSON.stringify(enabled)); } catch { }
    }, [enabled]);
    return { enabled, setEnabled } as const;
}

function nextMonthlyDate(day: number, from = new Date()) {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    const thisMonth = new Date(d.getFullYear(), d.getMonth(), day);
    if (d <= thisMonth) return thisMonth;
    return new Date(d.getFullYear(), d.getMonth() + 1, day);
}

function genDeadlines(): Reminder[] {
    const today = new Date();
    const fmt = (x: Date) => x.toISOString().slice(0, 10);
    const items: Reminder[] = [];
    // Nigeria (demo): PAYE due 10th monthly; VAT/WHT due 21st monthly
    const vat1 = nextMonthlyDate(21, today); const paye1 = nextMonthlyDate(10, today); const wht1 = nextMonthlyDate(21, today);
    const vat2 = new Date(vat1.getFullYear(), vat1.getMonth() + 1, 21);
    const paye2 = new Date(paye1.getFullYear(), paye1.getMonth() + 1, 10);
    const wht2 = new Date(wht1.getFullYear(), wht1.getMonth() + 1, 21);
    items.push({ id: `VAT-${fmt(vat1)}`, title: 'VAT return due', date: fmt(vat1), kind: 'VAT' });
    items.push({ id: `PAYE-${fmt(paye1)}`, title: 'PAYE remittance due', date: fmt(paye1), kind: 'PAYE' });
    items.push({ id: `WHT-${fmt(wht1)}`, title: 'WHT remittance due', date: fmt(wht1), kind: 'WHT' });
    items.push({ id: `VAT-${fmt(vat2)}`, title: 'VAT return due', date: fmt(vat2), kind: 'VAT' });
    items.push({ id: `PAYE-${fmt(paye2)}`, title: 'PAYE remittance due', date: fmt(paye2), kind: 'PAYE' });
    items.push({ id: `WHT-${fmt(wht2)}`, title: 'WHT remittance due', date: fmt(wht2), kind: 'WHT' });
    return items;
}

export default function CompliancePage() {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [tax, setTax] = React.useState<TaxSummary>({});
    const { enabled, setEnabled } = useReminders();

    // VAT form state
    const [vatSales, setVatSales] = React.useState<number>(0);
    const [vatInput, setVatInput] = React.useState<number>(0);
    const [vatOutput, setVatOutput] = React.useState<number>(0);
    const vatPayable = Math.max(0, Math.round((vatOutput - vatInput)));

    // PAYE form state
    const [payeEmployees, setPayeEmployees] = React.useState<number>(0);
    const [payeTotal, setPayeTotal] = React.useState<number>(0);

    // WHT form state
    const [whtTotal, setWhtTotal] = React.useState<number>(0);

    React.useEffect(() => {
        (async () => {
            setLoading(true); setError(null);
            try {
                const api = getApi();
                const res = await api.get<TaxSummary>('/api/demo/tax-summary');
                const t = res.data ?? {};
                setTax(t);
                // Prefill VAT
                setVatSales(Math.round(t.vat?.taxableSales ?? 0));
                setVatInput(Math.round(t.vat?.inputVAT ?? 0));
                if (t.vat?.outputVAT != null) setVatOutput(Math.round(t.vat.outputVAT));
                else if (t.vat?.totalPayable != null) setVatOutput(Math.round((t.vat.totalPayable) + (t.vat.inputVAT ?? 0)));
                // Prefill PAYE
                setPayeEmployees(Math.round(t.paye?.employees ?? 0));
                setPayeTotal(Math.round(t.paye?.total ?? 0));
                // Prefill WHT (if absent, default 0)
                setWhtTotal(Math.round(t.wht?.total ?? 0));
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load tax summary');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function numberInput(v: number, set: (n: number) => void) {
        return (e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value || 0));
    }

    function toastValidate(msg: string) { alert(msg); }

    async function downloadPdf(kind: 'VAT' | 'PAYE' | 'WHT') {
        const [{ jsPDF }] = await Promise.all([import('jspdf')]);
        const pdf = new jsPDF('p', 'pt', 'a4');
        pdf.setFontSize(14);
        pdf.text(`Consultflow — ${kind} Form`, 40, 40);
        pdf.setFontSize(11);
        const y0 = 70;
        if (kind === 'VAT') {
            pdf.text(`Taxable Sales: ₦${vatSales.toLocaleString()}`, 40, y0);
            pdf.text(`Input VAT: ₦${vatInput.toLocaleString()}`, 40, y0 + 18);
            pdf.text(`Output VAT: ₦${vatOutput.toLocaleString()}`, 40, y0 + 36);
            pdf.text(`VAT Payable: ₦${vatPayable.toLocaleString()}`, 40, y0 + 54);
        }
        if (kind === 'PAYE') {
            pdf.text(`Employees: ${payeEmployees}`, 40, y0);
            pdf.text(`PAYE Total: ₦${payeTotal.toLocaleString()}`, 40, y0 + 18);
        }
        if (kind === 'WHT') {
            pdf.text(`WHT Total: ₦${whtTotal.toLocaleString()}`, 40, y0);
        }
        pdf.save(`${kind.toLowerCase()}_form.pdf`);
    }

    // Validation (basic rules)
    function validateVAT() {
        const issues: string[] = [];
        if (vatSales < 0) issues.push('Taxable sales cannot be negative');
        if (vatInput < 0 || vatOutput < 0) issues.push('VAT amounts cannot be negative');
        if (vatPayable < 0) issues.push('Payable VAT computed negative');
        toastValidate(issues.length ? `VAT issues:\n- ${issues.join('\n- ')}` : 'VAT looks good.');
    }
    function validatePAYE() {
        const issues: string[] = [];
        if (payeEmployees < 0) issues.push('Employees cannot be negative');
        if (payeTotal < 0) issues.push('PAYE total cannot be negative');
        toastValidate(issues.length ? `PAYE issues:\n- ${issues.join('\n- ')}` : 'PAYE looks good.');
    }
    function validateWHT() {
        const issues: string[] = [];
        if (whtTotal < 0) issues.push('WHT total cannot be negative');
        toastValidate(issues.length ? `WHT issues:\n- ${issues.join('\n- ')}` : 'WHT looks good.');
    }

    const deadlines = React.useMemo(() => genDeadlines(), []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-semibold text-deep-navy">Tax Compliance</h1>
                    <p className="text-deep-navy/70">Prefilled demo forms and a simple calendar to track key deadlines.</p>
                </div>

                <Card>
                    <h2 className="text-lg font-semibold mb-3">VAT (Value Added Tax)</h2>
                    {loading ? (
                        <div className="text-sm text-deep-navy/70">Loading…</div>
                    ) : error ? (
                        <div className="text-sm text-coral">{error}</div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-deep-navy/70">Taxable Sales</label>
                                <input type="number" value={vatSales} onChange={numberInput(vatSales, setVatSales)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-deep-navy/70">Input VAT</label>
                                <input type="number" value={vatInput} onChange={numberInput(vatInput, setVatInput)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-deep-navy/70">Output VAT</label>
                                <input type="number" value={vatOutput} onChange={numberInput(vatOutput, setVatOutput)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-deep-navy/70">VAT Payable</label>
                                <div className="rounded-xl border border-medium/60 px-3 py-2 text-sm bg-medium/20">₦{vatPayable.toLocaleString()}</div>
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                                <Button size="sm" onClick={validateVAT}>Validate</Button>
                                <Button size="sm" variant="ghost" onClick={() => downloadPdf('VAT')}>Download PDF</Button>
                            </div>
                        </div>
                    )}
                </Card>

                <Card>
                    <h2 className="text-lg font-semibold mb-3">PAYE (Pay As You Earn)</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-deep-navy/70">Employees</label>
                            <input type="number" value={payeEmployees} onChange={numberInput(payeEmployees, setPayeEmployees)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-deep-navy/70">PAYE Total</label>
                            <input type="number" value={payeTotal} onChange={numberInput(payeTotal, setPayeTotal)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <Button size="sm" onClick={validatePAYE}>Validate</Button>
                            <Button size="sm" variant="ghost" onClick={() => downloadPdf('PAYE')}>Download PDF</Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-lg font-semibold mb-3">WHT (Withholding Tax)</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-deep-navy/70">WHT Total</label>
                            <input type="number" value={whtTotal} onChange={numberInput(whtTotal, setWhtTotal)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <Button size="sm" onClick={validateWHT}>Validate</Button>
                            <Button size="sm" variant="ghost" onClick={() => downloadPdf('WHT')}>Download PDF</Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-lg font-semibold mb-3">Compliance Calendar</h2>
                    <div className="space-y-2">
                        {deadlines.map(d => (
                            <div key={d.id} className="flex items-center justify-between rounded-xl border border-medium/60 p-2">
                                <div>
                                    <div className="text-sm font-medium">{d.title}</div>
                                    <div className="text-xs text-deep-navy/70">{d.date} • {d.kind}</div>
                                </div>
                                <label className="inline-flex items-center gap-2 text-xs">
                                    <input type="checkbox" checked={!!enabled[d.id]} onChange={(e) => setEnabled(s => ({ ...s, [d.id]: e.target.checked }))} />
                                    Reminder
                                </label>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Side panel: NAT 2025 key points */}
            <Card className="lg:sticky lg:top-4 h-max">
                <h2 className="text-lg font-semibold mb-2">NAT 2025 — Key Points</h2>
                <p className="text-sm text-deep-navy/80">A quick primer for upcoming digital tax compliance in 2025. This is demo guidance, not legal advice.</p>
                <ul className="mt-3 list-disc pl-5 text-sm space-y-1">
                    <li>E-filing standardization across VAT, PAYE, and WHT.</li>
                    <li>E-invoicing with TIN verification for input VAT claims.</li>
                    <li>Timelines unchanged (monthly: PAYE 10th; VAT/WHT 21st).</li>
                    <li>Penalties streamlined; automated reminders encouraged.</li>
                    <li>Audit trail: retain PDFs and payment receipts.</li>
                </ul>
                <h3 className="mt-4 text-sm font-semibold">Checklist</h3>
                <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    <li>Confirm TIN and e-filing portal access.</li>
                    <li>Reconcile invoices; compute VAT correctly.</li>
                    <li>Validate PAYE payroll and remittances.</li>
                    <li>Apply correct WHT rates and remit on time.</li>
                    <li>Archive submitted forms as PDF.</li>
                </ul>
            </Card>
        </div>
    );
}
