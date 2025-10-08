"use client";
import * as React from 'react';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { ChartOfAccount, TrialBalanceAdjustment, CurrencyCode } from '@entities/accounting/types';

export interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (adj: Omit<TrialBalanceAdjustment, 'id' | 'createdAt'>) => void;
  coa: ChartOfAccount[];
  baseCurrency: CurrencyCode;
  editing?: TrialBalanceAdjustment | null;
}

export default function AdjustmentModal({ open, onClose, onSave, coa, baseCurrency, editing }: AdjustmentModalProps) {
  const [accountCode, setAccountCode] = React.useState(editing?.accountCode || '');
  const [debit, setDebit] = React.useState(editing?.debit?.toString() || '0');
  const [credit, setCredit] = React.useState(editing?.credit?.toString() || '0');
  const [reason, setReason] = React.useState(editing?.reason || '');
  const [currency, setCurrency] = React.useState<CurrencyCode>(baseCurrency);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setAccountCode(editing?.accountCode || '');
      setDebit(editing?.debit?.toString() || '0');
      setCredit(editing?.credit?.toString() || '0');
      setReason(editing?.reason || '');
      setCurrency(baseCurrency);
      setError('');
    }
  }, [open, editing, baseCurrency]);

  if (!open) return null;

  const submit = () => {
    const d = Number(debit) || 0; const c = Number(credit) || 0;
    if (!accountCode) { setError('Account required'); return; }
    if (d <= 0 && c <= 0) { setError('Provide a debit or credit amount'); return; }
    if (d > 0 && c > 0) { setError('Only one side (debit OR credit) should be entered'); return; }
    onSave({ tbId: editing?.tbId || '', accountCode, debit: d, credit: c, reason, createdBy: 'consultant-1', currency });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <Card className="w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">{editing ? 'Edit Adjustment' : 'Add Adjustment'}</h2>
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium">Account</label>
            <select value={accountCode} onChange={e => setAccountCode(e.target.value)} className="w-full border rounded-lg px-2 py-1.5">
              <option value="">Select account...</option>
              {coa.map(a => <option key={a.id} value={a.accountCode}>{a.accountCode} — {a.accountName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium">Debit</label>
              <input type="number" value={debit} onChange={e => setDebit(e.target.value)} className="w-full border rounded-lg px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-xs font-medium">Credit</label>
              <input type="number" value={credit} onChange={e => setCredit(e.target.value)} className="w-full border rounded-lg px-2 py-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)} className="w-full border rounded-lg px-2 py-1.5">
                {[baseCurrency,'USD','NGN','CFA','KES','ZAR','GHS','MAD'].filter((v,i,self)=>self.indexOf(v)===i).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium">Reason</label>
              <input value={reason} onChange={e => setReason(e.target.value)} className="w-full border rounded-lg px-2 py-1.5" />
            </div>
          </div>
          {error && <div className="text-xs text-coral">{error}</div>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit}>{editing ? 'Update' : 'Add'}</Button>
        </div>
      </Card>
    </div>
  );
}
