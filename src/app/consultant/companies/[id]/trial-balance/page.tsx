'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useParams } from 'next/navigation';
import { accountingRepository } from '@shared/repositories/accountingRepository';
import { parseTBFromExcel, parseTBFromCsv } from '@shared/utils/uploadParsers';
import type { ChartOfAccount } from '@entities/accounting/types';
import type { TrialBalance, TrialBalanceEntry } from '@entities/accounting/types';
import CSVTemplateDownload from '@shared/components/CSVTemplateDownload';

function fuzzyMatch(query: string, choices: { code: string; name: string }[]): string | '' {
  const q = query.toLowerCase();
  let best: { code: string; score: number } | null = null;
  for (const c of choices) {
    const n = c.name.toLowerCase();
    const code = c.code.toLowerCase();
    let score = 0;
    if (code === q) score += 100;
    if (n === q) score += 80;
    if (n.includes(q)) score += 40;
    if (q.includes(n)) score += 20;
    if (score > (best?.score ?? -1)) best = { code: c.code, score };
  }
  return (best && best.score >= 40) ? best.code : '';
}

export default function TrialBalancePage() {
  const params = useParams();
  const companyId = String(params?.id);
  const [entries, setEntries] = React.useState<TrialBalanceEntry[]>([]);
  const [tbs, setTbs] = React.useState<TrialBalance[]>([]);
  const [coa, setCoa] = React.useState<ChartOfAccount[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({}); // srcCode -> mappedCode
  const [periodStart, setPeriodStart] = React.useState('');
  const [periodEnd, setPeriodEnd] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | TrialBalance['status']>('all');

  React.useEffect(() => {
    accountingRepository.seedDemo();
    setTbs(accountingRepository.listTB(companyId));
    setCoa(accountingRepository.listCoA(companyId));
    setMapping(accountingRepository.getSavedMapping(companyId));
  }, [companyId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      const list = parseTBFromCsv(text);
      setEntries(list);
    } else {
      const list = await parseTBFromExcel(file);
      setEntries(list);
    }
    // Initialize mapping (auto-match by accountCode)
    setTimeout(() => {
      setMapping(prev => {
        const next = { ...prev };
        const choices = coa.map(c => ({ code: c.accountCode, name: c.accountName }));
        entries.forEach(e => {
          if (!next[e.accountCode]) {
            const direct = coa.find(c => c.accountCode === e.accountCode)?.accountCode || '';
            const byName = e.name ? fuzzyMatch(e.name, choices) : '';
            next[e.accountCode] = direct || byName || '';
          }
        });
        return next;
      });
    }, 0);
  };

  const saveTB = () => {
    if (!periodStart || !periodEnd || entries.length === 0) return;
    const now = new Date().toISOString();
    // Apply mapping (fallback to original if not provided)
    const mappedEntries: TrialBalanceEntry[] = entries.map(e => ({ ...e, accountCode: mapping[e.accountCode] || e.accountCode }));
    // Save user mapping preferences for next time
    const learned: Record<string, string> = {};
    mappedEntries.forEach(e => { if (mapping[e.accountCode]) learned[e.accountCode] = mapping[e.accountCode]; });
    accountingRepository.saveMapping(companyId, learned);
    const tb: TrialBalance = { id: `${companyId}-tb-${periodStart}-${Date.now()}`, companyId, periodStart, periodEnd, entries: mappedEntries, uploadedBy: 'consultant-1', uploadedAt: now, status: 'pending_approval' };
    accountingRepository.addTB(companyId, tb);
    setTbs(accountingRepository.listTB(companyId));
    setEntries([]);
  };

  const filtered = tbs.filter(t => statusFilter === 'all' ? true : t.status === statusFilter);
  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Trial Balance Upload & Mapping</h1>
      <Card>
        <div className="grid sm:grid-cols-2 gap-3 items-center">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-sm" />
          <div className="flex items-center gap-2">
            <label className="text-sm">Period</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
            <span className="text-deep-navy/40">→</span>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <Button onClick={saveTB} disabled={entries.length === 0 || !periodStart || !periodEnd}>Save Trial Balance</Button>
            <div className="text-xs text-deep-navy/60">Debits: {totalDebit.toLocaleString()} • Credits: {totalCredit.toLocaleString()} {Math.abs(totalDebit - totalCredit) < 1e-2 ? '✓ Balanced' : '⚠︎ Unbalanced'}</div>
            <div className="ml-auto"><CSVTemplateDownload /></div>
          </div>
        </div>
      </Card>

      {entries.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Account Code</th>
                  <th className="text-left">Mapped Account</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1">{e.accountCode}</td>
                    <td>
                      {coa.find(c => c.accountCode === (mapping[e.accountCode] || e.accountCode)) ? (
                        <span className="text-xs text-green-700">✓ {coa.find(c => c.accountCode === (mapping[e.accountCode] || e.accountCode))?.accountName}</span>
                      ) : (
                        <select
                          className="border rounded-lg px-2 py-1 text-xs"
                          value={mapping[e.accountCode] || ''}
                          onChange={(ev) => setMapping(m => ({ ...m, [e.accountCode]: ev.target.value }))}
                        >
                          <option value="">Select account…</option>
                          {coa.map(a => (
                            <option key={a.id} value={a.accountCode}>{a.accountCode} — {a.accountName}</option>
                          ))}
                        </select>
                      )}
                      {!mapping[e.accountCode] && (
                        <div className="text-[10px] text-coral">Unresolved mapping</div>
                      )}
                    </td>
                    <td className="text-right">{e.debit?.toLocaleString()}</td>
                    <td className="text-right">{e.credit?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm">Filter:</label>
          <select className="border rounded-xl px-3 py-1.5 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Period</th>
                <th className="text-left">Status</th>
                <th className="text-right">Entries</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tb => (
                <tr key={tb.id} className="border-b last:border-0">
                  <td className="py-2">{tb.periodStart} → {tb.periodEnd}</td>
                  <td>{tb.status}</td>
                  <td className="text-right">{tb.entries.length}</td>
                  <td className="text-right">
                    {tb.status !== 'locked' && (
                      <Button size="sm" variant="ghost" onClick={() => { accountingRepository.updateTBStatus(companyId, tb.id, 'approved'); setTbs(accountingRepository.listTB(companyId)); }}>Approve</Button>
                    )}
                    {tb.status === 'approved' && (
                      <Button size="sm" variant="ghost" onClick={() => { accountingRepository.updateTBStatus(companyId, tb.id, 'locked'); setTbs(accountingRepository.listTB(companyId)); }}>Lock</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
