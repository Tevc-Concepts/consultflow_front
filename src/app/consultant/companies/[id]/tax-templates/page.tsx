'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useParams } from 'next/navigation';
import { accountingRepository } from '@shared/repositories/accountingRepository';
import type { TaxTemplate, TaxTemplateType } from '@entities/accounting/types';

export default function TaxTemplatesPage() {
  const params = useParams();
  const companyId = String(params?.id);
  const [items, setItems] = React.useState<TaxTemplate[]>([]);
  const [name, setName] = React.useState('Nigeria VAT 7.5%');
  const [type, setType] = React.useState<TaxTemplateType>('VAT');
  const [rate, setRate] = React.useState<number>(7.5);

  React.useEffect(() => {
    accountingRepository.seedDemo();
    setItems(accountingRepository.listTaxTemplates(companyId));
  }, [companyId]);

  const addTemplate = () => {
    const now = new Date().toISOString();
    const t: TaxTemplate[] = [...items, { id: `${companyId}-tax-${Date.now()}`, companyId, name, type, rate, rules: {}, createdAt: now, updatedAt: now }];
    accountingRepository.upsertTaxTemplates(companyId, t);
    setItems(t);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tax Templates</h1>
      <Card>
        <div className="grid sm:grid-cols-[1fr_140px_120px_auto] gap-2 items-center">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="rounded-xl border px-3 py-2 text-sm" />
          <select value={type} onChange={e => setType(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm">
            {['VAT','PAYE','WHT','CIT'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} className="rounded-xl border px-3 py-2 text-sm" />
          <Button onClick={addTemplate}>Add Template</Button>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left">Type</th>
                <th className="text-right">Rate %</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-2">{i.name}</td>
                  <td>{i.type}</td>
                  <td className="text-right">{i.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
