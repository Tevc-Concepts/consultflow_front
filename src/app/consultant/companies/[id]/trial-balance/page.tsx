'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useParams } from 'next/navigation';
import { accountingRepository } from '@shared/repositories/accountingRepository';
import { parseTBFromExcel, parseTBFromCsv } from '@shared/utils/uploadParsers';
import type { ChartOfAccount } from '@entities/accounting/types';
import type { TrialBalance, TrialBalanceEntry, TrialBalanceAdjustment } from '@entities/accounting/types';
import CSVTemplateDownload from '@shared/components/CSVTemplateDownload';
import AdjustmentModal from '@shared/components/AdjustmentModal';

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
  const [showAdjModal, setShowAdjModal] = React.useState(false);
  const [activeTBForAdj, setActiveTBForAdj] = React.useState<TrialBalance | null>(null);
  const [undoStack, setUndoStack] = React.useState<any[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [editingAdj, setEditingAdj] = React.useState<TrialBalanceAdjustment | null>(null);
  const [fxFallbackUsed, setFxFallbackUsed] = React.useState(false);

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
    const baseCurrency = coa[0]?.currency;
    let fallback = false;
    const parentCodes = new Set(coa.filter(a => coa.some(c => c.parentAccountId === a.id)).map(a => a.accountCode));
    const mappedEntries: TrialBalanceEntry[] = entries.map(e => {
      const accountCode = mapping[e.accountCode] || e.accountCode;
      if (e.currency && baseCurrency && e.currency !== baseCurrency) {
        const rateRec = accountingRepository.findRate(companyId, e.currency as any, periodEnd || periodStart);
        const rate = rateRec?.rate || 1;
        if (!rateRec) fallback = true;
        return { ...e, accountCode, originalDebit: e.debit, originalCredit: e.credit, fxRateToBase: rate, debit: Math.round(e.debit * rate * 100)/100, credit: Math.round(e.credit * rate * 100)/100, currency: baseCurrency };
      }
      return { ...e, accountCode };
    });
    setFxFallbackUsed(fallback);
    // Save user mapping preferences for next time
    const learned: Record<string, string> = {};
    mappedEntries.forEach(e => { if (mapping[e.accountCode]) learned[e.accountCode] = mapping[e.accountCode]; });
    accountingRepository.saveMapping(companyId, learned);
    // filter zero and parent account postings
    const filtered = mappedEntries.filter(e => (e.debit !== 0 || e.credit !== 0) && !parentCodes.has(e.accountCode));
    if (filtered.length !== mappedEntries.length) {
      alert('Removed zero-amount or parent-account lines.');
    }
    const tb: TrialBalance = { id: `${companyId}-tb-${periodStart}-${Date.now()}`, companyId, periodStart, periodEnd, entries: filtered, uploadedBy: 'consultant-1', uploadedAt: now, status: 'draft', currency: baseCurrency };
    accountingRepository.addTB(companyId, tb);
    setTbs(accountingRepository.listTB(companyId));
    setEntries([]);
  };

  const openAdjModal = (tb: TrialBalance) => { setActiveTBForAdj(tb); setShowAdjModal(true); };
  const handleSaveAdjustment = (payload: Omit<TrialBalanceAdjustment, 'id' | 'createdAt'>) => {
    if (!activeTBForAdj) return;
    const now = new Date().toISOString();
    if (editingAdj) {
      // replace existing
      accountingRepository.deleteTBAdjustment(companyId, activeTBForAdj.id, editingAdj.id);
    }
    const adj: TrialBalanceAdjustment = { id: editingAdj ? editingAdj.id : `adj-${Date.now()}`, createdAt: editingAdj ? editingAdj.createdAt : now, ...payload, tbId: activeTBForAdj.id } as TrialBalanceAdjustment;
    accountingRepository.addTBAdjustment(companyId, activeTBForAdj.id, adj);
    setUndoStack(stack => [...stack, { type: editingAdj ? 'editAdjustment' : 'addAdjustment', tbId: activeTBForAdj.id, adjId: adj.id, prev: editingAdj }]);
    setEditingAdj(null);
    setTbs(accountingRepository.listTB(companyId));
    setShowAdjModal(false);
  };
  const undoLast = () => {
    const last = undoStack.pop(); if (!last) return;
    if (last.type === 'addAdjustment') {
      accountingRepository.deleteTBAdjustment(companyId, last.tbId, last.adjId);
      setTbs(accountingRepository.listTB(companyId));
    } else if (last.type === 'editAdjustment') {
      // revert to previous version
      if (last.prev) {
        accountingRepository.deleteTBAdjustment(companyId, last.tbId, last.adjId);
        accountingRepository.addTBAdjustment(companyId, last.tbId, last.prev);
        setTbs(accountingRepository.listTB(companyId));
      }
    } else if (last.type === 'deleteAdjustment') {
      // re-add deleted adjustment
      if (last.deleted) {
        accountingRepository.addTBAdjustment(companyId, last.tbId, last.deleted);
        setTbs(accountingRepository.listTB(companyId));
      }
    }
    setUndoStack([...undoStack]);
  };

  const filtered = tbs.filter(t => statusFilter === 'all' ? true : t.status === statusFilter);
  // Drill-down state for transactions
  const [drill, setDrill] = React.useState<{ account: string; name?: string; start: string; end: string } | null>(null);
  const [drillTx, setDrillTx] = React.useState<any[]>([]);
  const [drillStart, setDrillStart] = React.useState<string>('');
  const [drillEnd, setDrillEnd] = React.useState<string>('');
  const [drillSource, setDrillSource] = React.useState<string>('all');
  const openDrill = (tb: TrialBalance, accountCode: string) => {
    const tx = accountingRepository.listTransactions(companyId).filter(t => t.accountCode === accountCode && t.date >= tb.periodStart && t.date <= tb.periodEnd);
    setDrill({ account: accountCode, start: tb.periodStart, end: tb.periodEnd });
    setDrillTx(tx.sort((a,b)=> b.date.localeCompare(a.date)));
    setDrillStart(tb.periodStart);
    setDrillEnd(tb.periodEnd);
    setDrillSource('all');
  };
  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Trial Balance Upload & Mapping</h1>
      {fxFallbackUsed && (
        <div className="rounded-lg bg-coral/10 border border-coral/40 px-4 py-2 text-xs text-coral">
          One or more foreign currency lines used a fallback FX rate of 1.0 (missing configured rate). Please add proper exchange rates.
        </div>
      )}
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
                    <td className="text-right">
                      <input
                        type="number"
                        value={e.debit}
                        onChange={(ev) => setEntries(prev => prev.map((row, idx) => idx === i ? { ...row, debit: Number(ev.target.value) } : row))}
                        className="w-28 text-right border rounded px-1 py-0.5 text-xs"
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        value={e.credit}
                        onChange={(ev) => setEntries(prev => prev.map((row, idx) => idx === i ? { ...row, credit: Number(ev.target.value) } : row))}
                        className="w-28 text-right border rounded px-1 py-0.5 text-xs"
                      />
                    </td>
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
              {filtered.map(tb => {
                const totals = accountingRepository.computeAdjustedTotals ? accountingRepository.computeAdjustedTotals(tb) : { netDebit: 0, netCredit: 0, originalDebit: 0, originalCredit: 0, adjDebit: 0, adjCredit: 0 } as any;
                const balanced = Math.abs(totals.netDebit - totals.netCredit) < 1e-2;
                return (
                  <React.Fragment key={tb.id}>
                  <tr className="border-b last:border-0 cursor-pointer" onClick={() => setExpanded(expanded === tb.id ? null : tb.id)}>
                    <td className="py-2">{tb.periodStart} → {tb.periodEnd}<div className="text-[10px] text-deep-navy/60">{totals.netDebit.toLocaleString()} / {totals.netCredit.toLocaleString()} {balanced ? '✓' : '⚠︎'}</div></td>
                    <td>
                      {tb.status}
                      {tb.adjustments && tb.adjustments.length > 0 && (
                        <div className="text-[10px] text-deep-navy/60">{tb.adjustments.length} adj.</div>
                      )}
                    </td>
                    <td className="text-right">{tb.entries.length}</td>
                    <td className="text-right">
                    {tb.status === 'draft' && (
                      <Button size="sm" variant="ghost" onClick={() => { accountingRepository.updateTBStatus(companyId, tb.id, 'pending_approval'); setTbs(accountingRepository.listTB(companyId)); }}>Submit</Button>
                    )}
                    {tb.status === 'pending_approval' && (
                      <Button size="sm" variant="ghost" onClick={() => { accountingRepository.updateTBStatus(companyId, tb.id, 'approved'); setTbs(accountingRepository.listTB(companyId)); }}>Approve</Button>
                    )}
                    {tb.status === 'approved' && (
                      <Button size="sm" variant="ghost" onClick={() => { accountingRepository.updateTBStatus(companyId, tb.id, 'locked'); setTbs(accountingRepository.listTB(companyId)); }}>Lock</Button>
                    )}
                    {(tb.status === 'draft' || tb.status === 'pending_approval') && (
                      <Button size="sm" variant="ghost" onClick={() => openAdjModal(tb)}>Adj</Button>
                    )}
                    </td>
                  </tr>
                  {expanded === tb.id && (
                    <tr className="bg-deep-navy/5">
                      <td colSpan={4} className="p-3">
                        <div className="text-xs font-medium mb-2 flex items-center">Adjustments
                          {(tb.status === 'draft' || tb.status === 'pending_approval') && (
                            <Button size="sm" variant="ghost" className="ml-2" onClick={(e) => { e.stopPropagation(); openAdjModal(tb); }}>Add</Button>
                          )}
                        </div>
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1">Account</th>
                              <th className="text-right">Debit</th>
                              <th className="text-right">Credit</th>
                              <th className="text-left">Reason</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(tb.adjustments || []).map(a => (
                              <tr key={a.id} className="border-b last:border-0">
                                <td className="py-1">{a.accountCode}</td>
                                <td className="text-right">{a.debit.toLocaleString()}</td>
                                <td className="text-right">{a.credit.toLocaleString()}</td>
                                <td>{a.reason}</td>
                                <td className="text-right">
                                  {(tb.status === 'draft' || tb.status === 'pending_approval') && (
                                    <>
                                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingAdj(a); setActiveTBForAdj(tb); setShowAdjModal(true); }}>Edit</Button>
                                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); accountingRepository.deleteTBAdjustment(companyId, tb.id, a.id); setUndoStack(st => [...st, { type: 'deleteAdjustment', tbId: tb.id, adjId: a.id, deleted: a }]); setTbs(accountingRepository.listTB(companyId)); }}>Del</Button>
                                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDrill(tb, a.accountCode); }}>Txns</Button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {(tb.adjustments || []).length === 0 && (
                              <tr><td colSpan={5} className="text-center py-2 text-deep-navy/50">No adjustments</td></tr>
                            )}
                          </tbody>
                        </table>
                        {/* Accounts Summary from TB entries */}
                        <div className="mt-4">
                          <div className="text-xs font-medium mb-2">Accounts</div>
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-1">Account</th>
                                <th className="text-right">Debit</th>
                                <th className="text-right">Credit</th>
                                <th className="text-right">Net</th>
                                <th className="text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from(tb.entries.reduce((map, e) => {
                                const prev = map.get(e.accountCode) || { debit: 0, credit: 0 };
                                prev.debit += e.debit || 0; prev.credit += e.credit || 0; map.set(e.accountCode, prev); return map;
                              }, new Map<string, { debit: number; credit: number }>())).map(([code, sums]) => {
                                const acc = coa.find(c => c.accountCode === code);
                                const name = acc?.accountName || code;
                                const net = (sums.debit || 0) - (sums.credit || 0);
                                return (
                                  <tr key={code} className="border-b last:border-0">
                                    <td className="py-1">{name} <span className="text-deep-navy/50">({code})</span></td>
                                    <td className="text-right">{sums.debit.toLocaleString()}</td>
                                    <td className="text-right">{sums.credit.toLocaleString()}</td>
                                    <td className={`text-right ${net >= 0 ? 'text-emerald' : 'text-coral'}`}>{net.toLocaleString()}</td>
                                    <td className="text-right"><Button size="sm" variant="ghost" onClick={(e)=>{ e.stopPropagation(); openDrill(tb, code); }}>Txns</Button></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-2 gap-2">
          <Button size="sm" variant="ghost" disabled={undoStack.length === 0} onClick={undoLast}>Undo</Button>
        </div>
      </Card>
      {showAdjModal && activeTBForAdj && (
        <AdjustmentModal
          open={showAdjModal}
          onClose={() => { setShowAdjModal(false); setEditingAdj(null); }}
          onSave={handleSaveAdjustment}
          coa={coa}
          baseCurrency={coa[0]?.currency || 'NGN'}
          editing={editingAdj}
        />
      )}

      {/* Drill-down Drawer */}
      {drill && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrill(null)}></div>
          <div className="w-full sm:w-[520px] h-full bg-white shadow-xl border-l border-medium/40 flex flex-col">
            <div className="p-4 border-b border-medium/40 flex items-center justify-between">
              <div>
                <div className="font-semibold">Transactions • {drill.account}</div>
                <div className="text-xs text-deep-navy/60">{drill.start} → {drill.end}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setDrill(null)}>✖</Button>
            </div>
            <div className="p-3 text-xs text-deep-navy/60 border-b border-medium/30 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium mb-1">Start</label>
                  <input type="date" value={drillStart} onChange={e=>setDrillStart(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1">End</label>
                  <input type="date" value={drillEnd} onChange={e=>setDrillEnd(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium mb-1">Source</label>
                  <select value={drillSource} onChange={e=>setDrillSource(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs">
                    <option value="all">All Sources</option>
                    <option value="upload">Upload</option>
                    <option value="manual">Manual</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="integration">Integration</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drillTx
                .filter(t => !drillStart || t.date >= drillStart)
                .filter(t => !drillEnd || t.date <= drillEnd)
                .filter(t => drillSource === 'all' || t.source === drillSource).length === 0 && (
                  <div className="text-sm text-deep-navy/60">No transactions found.</div>
                )}
              {drillTx
                .filter(t => !drillStart || t.date >= drillStart)
                .filter(t => !drillEnd || t.date <= drillEnd)
                .filter(t => drillSource === 'all' || t.source === drillSource)
                .map(t => (
                <div key={t.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{t.date}</div>
                    <div className="text-xs text-deep-navy/60">{t.source}</div>
                  </div>
                  <div className="text-xs text-deep-navy/70 truncate">{t.description || '—'}</div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="text-emerald">{t.debit ? t.debit.toLocaleString() : ''}</div>
                    <div className="text-coral">{t.credit ? t.credit.toLocaleString() : ''}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-medium/40 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const visible = drillTx
                    .filter(t => !drillStart || t.date >= drillStart)
                    .filter(t => !drillEnd || t.date <= drillEnd)
                    .filter(t => drillSource === 'all' || t.source === drillSource);
                  if (!visible.length) return;
                  const rows = visible.map(t => ({ id: t.id, date: t.date, account: t.accountCode, description: t.description || '', debit: t.debit, credit: t.credit, source: t.source }));
                  const header = Object.keys(rows[0]).join(',');
                  const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `tb-transactions-${drill?.account}.csv`; a.click(); URL.revokeObjectURL(url);
                }}
              >
                ⬇️ Export CSV
              </Button>
              <Button variant="primary" size="sm" onClick={() => setDrill(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
