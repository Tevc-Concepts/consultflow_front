"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { accountingRepository } from '@shared/repositories/accountingRepository';
import type { ExchangeRate, CurrencyCode } from '@entities/accounting/types';

const currencies: CurrencyCode[] = ['NGN','USD','CFA','KES','ZAR','GHS','MAD'];

export default function ExchangeRatesPage() {
  const params = useParams();
  const companyId = String(params?.id);
  const [rates, setRates] = React.useState<ExchangeRate[]>([]);
  const [base, setBase] = React.useState<CurrencyCode>('NGN');
  const [target, setTarget] = React.useState<CurrencyCode>('USD');
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0,10));
  const [rate, setRate] = React.useState('1');
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    const list = accountingRepository.listExchangeRates(companyId);
    setRates(list.sort((a,b) => b.date.localeCompare(a.date)));
    const coa = accountingRepository.listCoA(companyId);
    if (coa[0]?.currency) setBase(coa[0].currency as CurrencyCode);
  }, [companyId]);

  React.useEffect(() => {
    accountingRepository.seedDemo();
    refresh();
  }, [companyId, refresh]);

  const resetForm = () => { setEditingId(null); setTarget('USD'); setDate(new Date().toISOString().slice(0,10)); setRate('1'); };

  const save = () => {
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) return;
    const id = editingId || `${companyId}-${base}-${target}-${date}`;
    const rec: ExchangeRate = { id, base, target, date, rate: Number(rate), createdAt: new Date().toISOString() };
    accountingRepository.upsertExchangeRate(companyId, rec);
    refresh();
    resetForm();
  };

  const edit = (er: ExchangeRate) => {
    setEditingId(er.id); setBase(er.base); setTarget(er.target); setDate(er.date); setRate(er.rate.toString());
  };

  const remove = (er: ExchangeRate) => { accountingRepository.deleteExchangeRate(companyId, er.id); refresh(); };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Exchange Rates</h1>
      <Card>
        <div className="grid md:grid-cols-6 gap-3 items-end text-sm">
          <div>
            <label className="block text-xs font-medium mb-1">Base</label>
            <select value={base} onChange={e => setBase(e.target.value as CurrencyCode)} className="w-full border rounded-lg px-2 py-1.5">
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Target</label>
            <select value={target} onChange={e => setTarget(e.target.value as CurrencyCode)} className="w-full border rounded-lg px-2 py-1.5">
              {currencies.filter(c=>c!==base).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-2 py-1.5" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Rate</label>
            <input type="number" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} className="w-full border rounded-lg px-2 py-1.5" />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button size="sm" onClick={save}>{editingId ? 'Update' : 'Add'} Rate</Button>
            {editingId && <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>}
          </div>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left">Pair</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2">{r.date}</td>
                  <td>{r.base} / {r.target}</td>
                  <td className="text-right">{r.rate}</td>
                  <td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => edit(r)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr><td colSpan={4} className="text-center py-4 text-deep-navy/50">No rates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
