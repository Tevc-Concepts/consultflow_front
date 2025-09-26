'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import getApi from '@shared/api/client';
import { useAppStore, type AppState } from '@shared/state/app';

type Company = { id: string; name: string };
type Adjustment = { id: string; companies: string[]; date: string; field: 'revenue' | 'cogs' | 'expenses'; delta: number; note?: string; createdAt?: string };

export default function AdjustmentsPanel() {
    const consolidated = useAppStore((s: AppState) => s.consolidated);
    const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [selCompanies, setSelCompanies] = React.useState<string[]>([]);
    const [items, setItems] = React.useState<Adjustment[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Form state
    const [date, setDate] = React.useState<string>('');
    const [field, setField] = React.useState<'revenue' | 'cogs' | 'expenses'>('revenue');
    const [delta, setDelta] = React.useState<string>('');
    const [note, setNote] = React.useState<string>('');

    const dataSource = useAppStore((s: AppState) => s.dataSource);
    const demoMode = useAppStore((s: AppState) => s.demoMode);
    // Memoize API instance so effects/callbacks don't re-create on every render
    const api = React.useMemo(() => getApi(), [dataSource, demoMode]);

    const loadCompanies = React.useCallback(async () => {
        try {
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const reportsEndpoint = dataSource === 'demo' ? '/api/demo/reports' : 
                                  dataSource === 'localDb' ? '/api/local/reports' : 
                                  '/api/reports';
            const res = await api.get<any>(reportsEndpoint, { params: { range: '30' } });
            setCompanies((res.data?.companies ?? []).map((c: any) => ({ id: c.id, name: c.name })));
            // default selected companies from store
            if (consolidated && selectedCompanyIds.length > 0) {
                setSelCompanies(prev => (prev.join(',') === selectedCompanyIds.join(',')) ? prev : selectedCompanyIds);
            } else if (res.data?.companies?.length) {
                const first = res.data.companies[0].id as string;
                setSelCompanies(prev => (prev.length === 1 && prev[0] === first) ? prev : [first]);
            }
        } catch { }
    }, [api, consolidated, selectedCompanyIds]);

    const loadItems = React.useCallback(async (companyList?: string[]) => {
        setLoading(true); setError(null);
        try {
            const comp = (companyList ?? selCompanies);
            const params = comp.length ? { companies: comp.join(',') } : {};
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const adjustmentsEndpoint = dataSource === 'demo' ? '/api/demo/reports/adjustments' : 
                                       dataSource === 'localDb' ? '/api/local/reports/adjustments' : 
                                       '/api/reports/adjustments';
            const res = await api.get<{ items: Adjustment[] }>(adjustmentsEndpoint, { params });
            setItems(prev => {
                const next = res.data?.items ?? [];
                if (prev.length === next.length && prev.every((p, i) => p.id === next[i]?.id)) return prev;
                return next;
            });
        } catch (e: any) { setError(e?.message ?? 'Failed to load adjustments'); }
        finally { setLoading(false); }
    }, [api, selCompanies]);

    React.useEffect(() => { loadCompanies(); }, [loadCompanies]);
    React.useEffect(() => { loadItems(selCompanies); }, [loadItems, selCompanies]);

    async function onAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!date || !delta || selCompanies.length === 0) return;
        const payload = { companies: selCompanies, date, field, delta: Number(delta), note };
        try {
            setLoading(true);
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const adjustmentsEndpoint = dataSource === 'demo' ? '/api/demo/reports/adjustments' : 
                                       dataSource === 'localDb' ? '/api/local/reports/adjustments' : 
                                       '/api/reports/adjustments';
            await api.post(adjustmentsEndpoint, payload);
            setDate(''); setDelta(''); setNote('');
            await loadItems();
        } catch (e: any) { setError(e?.message ?? 'Failed to add'); }
        finally { setLoading(false); }
    }

    async function onDelete(id: string) {
        try { 
            setLoading(true); 
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const adjustmentsEndpoint = dataSource === 'demo' ? '/api/demo/reports/adjustments' : 
                                       dataSource === 'localDb' ? '/api/local/reports/adjustments' : 
                                       '/api/reports/adjustments';
            await api.delete(adjustmentsEndpoint, { params: { id } }); 
            await loadItems(); 
        }
        catch (e: any) { setError(e?.message ?? 'Failed to delete'); }
        finally { setLoading(false); }
    }

    function toggleCompany(id: string) {
        setSelCompanies(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Adjustments (Demo)</h2>
            </div>
            <div className="grid md:grid-cols-[2fr_3fr] gap-4">
                <form onSubmit={onAdd} className="space-y-3">
                    <div>
                        <div className="text-xs text-deep-navy/80 mb-1">Companies</div>
                        <div className="flex flex-wrap gap-2">
                            {companies.map(c => (
                                <label key={c.id} className={["inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs cursor-pointer", selCompanies.includes(c.id) ? 'bg-medium/60 border-medium/60' : 'border-medium/60 hover:bg-medium/40'].join(' ')}>
                                    <input type="checkbox" className="sr-only" checked={selCompanies.includes(c.id)} onChange={() => toggleCompany(c.id)} />
                                    <span>{c.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-deep-navy/80" htmlFor="adj-date">Date</label>
                            <input id="adj-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-deep-navy/80" htmlFor="adj-field">Field</label>
                            <select id="adj-field" value={field} onChange={e => setField(e.target.value as any)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm">
                                <option value="revenue">Revenue</option>
                                <option value="cogs">COGS</option>
                                <option value="expenses">Expenses</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-deep-navy/80" htmlFor="adj-delta">Delta (NGN)</label>
                            <input id="adj-delta" type="number" inputMode="numeric" value={delta} onChange={e => setDelta(e.target.value)} className="w-36 rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-deep-navy/80" htmlFor="adj-note">Note</label>
                        <input id="adj-note" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason (optional)" className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={loading}>Add Adjustment</Button>
                        {error && <span className="text-xs text-coral">{error}</span>}
                    </div>
                </form>

                <div className="max-h-[320px] overflow-auto rounded-2xl border border-medium/60">
                    <div role="table" className="w-full">
                        <div role="row" className="sticky top-0 z-10 grid grid-cols-[120px_1fr_110px_100px_80px] bg-white/95 backdrop-blur px-3 py-2 text-xs uppercase text-deep-navy/80">
                            <div>Date</div><div>Companies</div><div>Field</div><div>Delta</div><div>Action</div>
                        </div>
                        {loading ? (
                            <div className="px-3 py-4 text-sm text-deep-navy/80">Loading…</div>
                        ) : items.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-deep-navy/80">No adjustments</div>
                        ) : items.map(it => (
                            <div key={it.id} role="row" className="grid grid-cols-[120px_1fr_110px_100px_80px] items-center px-3 py-2 border-t border-medium/60">
                                <div className="text-sm">{it.date}</div>
                                {(() => {
                                    const comps = Array.isArray((it as any).companies)
                                        ? (it as any).companies
                                        : String((it as any).companies || '').split(',').filter(Boolean);
                                    const label = comps.join(', ');
                                    return <div className="text-sm truncate" title={label}>{label}</div>;
                                })()}
                                <div className="text-sm">{it.field}</div>
                                <div className="text-sm">{Number(it.delta).toLocaleString()}</div>
                                <div><Button size="sm" variant="ghost" onClick={() => onDelete(it.id)}>Delete</Button></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}

export { AdjustmentsPanel };
