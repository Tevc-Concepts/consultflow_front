'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useParams } from 'next/navigation';
import { accountingRepository, buildCoATree, validateCoA } from '@shared/repositories/accountingRepository';
import { parseCoAFromExcel } from '@shared/utils/uploadParsers';
import type { ChartOfAccount } from '@entities/accounting/types';
import CSVTemplateDownload from '@shared/components/CSVTemplateDownload';

function Tree({ nodes }: { nodes: (ChartOfAccount & { children?: ChartOfAccount[] })[] }) {
  return (
    <ul className="pl-3 border-l border-medium/60">
      {nodes.map(n => (
        <li key={n.id} className="py-1">
          <div className="flex items-center justify-between">
            <div className="text-sm"><span className="text-deep-navy/60 mr-2">{n.accountCode}</span>{n.accountName} <span className="ml-2 text-xs text-deep-navy/60">({n.accountType})</span></div>
          </div>
          {n.children && n.children.length > 0 && (<Tree nodes={n.children as any} />)}
        </li>
      ))}
    </ul>
  );
}

export default function CoAPage() {
  const params = useParams();
  const companyId = String(params?.id);
  const [coa, setCoa] = React.useState<ChartOfAccount[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [currency, setCurrency] = React.useState<'NGN' | 'USD' | 'CFA' | 'KES' | 'ZAR' | 'GHS' | 'MAD'>('NGN');

  React.useEffect(() => {
    accountingRepository.seedDemo();
    setCoa(accountingRepository.listCoA(companyId));
  }, [companyId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const items = await parseCoAFromExcel(file, companyId, currency);
    const v = validateCoA(items);
    setErrors(v.errors);
    if (v.ok) {
      accountingRepository.upsertCoA(companyId, items);
      setCoa(items);
    }
  };

  const tree = React.useMemo(() => buildCoATree(coa), [coa]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="text-sm" />
          <select className="border rounded-xl px-3 py-2 text-sm" value={currency} onChange={e => setCurrency(e.target.value as any)}>
            {['NGN','USD','CFA','KES','ZAR','GHS','MAD'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button onClick={() => { accountingRepository.seedDemo(); setCoa(accountingRepository.listCoA(companyId)); }}>Load Demo CoA</Button>
          <CSVTemplateDownload className="ml-auto" />
        </div>
        {errors.length > 0 && (
          <div className="mt-3 text-sm text-coral">{errors.map((e, i) => <div key={i}>• {e}</div>)}</div>
        )}
      </Card>
      <Card>
        <div className="hidden md:block">
          <Tree nodes={tree as any} />
        </div>
        <div className="md:hidden space-y-2">
          {coa.sort((a,b)=>a.accountCode.localeCompare(b.accountCode)).map(acc => (
            <div key={acc.id} className="rounded-xl border p-2">
              <div className="text-sm font-medium">{acc.accountCode} — {acc.accountName}</div>
              <div className="text-xs text-deep-navy/60">{acc.accountType}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
