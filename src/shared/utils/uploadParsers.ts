import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ChartOfAccount, TrialBalanceEntry, AccountType, JournalTransaction } from '@entities/accounting/types';

export function parseCoAFromCsv(content: string, companyId: string, currency: string): ChartOfAccount[] {
  const now = new Date().toISOString();
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  const rows = (parsed.data as any[]);
  type Raw = { accountCode: string; accountName: string; accountType: AccountType; parentAccountCode?: string };
  const raw: Raw[] = rows.map((row) => ({
    accountCode: String(row.accountCode || row.code || row.Code || '').trim(),
    accountName: String(row.accountName || row.name || row.Name || '').trim(),
    accountType: (row.accountType || row.type || 'Asset') as AccountType,
    parentAccountCode: String(row.parentAccountCode || row.parent || '').trim() || undefined
  })).filter(r => r.accountCode && r.accountName);
  const codeToId = new Map(raw.map(r => [r.accountCode, `${companyId}-${r.accountCode}`] as const));
  const out: ChartOfAccount[] = raw.map(r => ({
    id: codeToId.get(r.accountCode)!,
    companyId,
    accountCode: r.accountCode,
    accountName: r.accountName,
    accountType: r.accountType,
    parentAccountId: r.parentAccountCode ? codeToId.get(r.parentAccountCode) : undefined,
    currency: currency as any,
    isActive: true,
    createdAt: now,
    updatedAt: now
  }));
  return out;
}

export function parseCoAFromExcel(file: File, companyId: string, currency: string): Promise<ChartOfAccount[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
        const now = new Date().toISOString();
        type Raw = { accountCode: string; accountName: string; accountType: AccountType; parentAccountCode?: string };
        const raw: Raw[] = (json as any[]).map(row => ({
          accountCode: String(row.accountCode || row.code || row.Code || '').trim(),
          accountName: String(row.accountName || row.name || row.Name || '').trim(),
          accountType: (row.accountType || row.type || 'Asset') as AccountType,
          parentAccountCode: String(row.parentAccountCode || row.parent || '').trim() || undefined
        })).filter(r => r.accountCode && r.accountName);
        const codeToId = new Map(raw.map(r => [r.accountCode, `${companyId}-${r.accountCode}`] as const));
        const out: ChartOfAccount[] = raw.map(r => ({
          id: codeToId.get(r.accountCode)!,
          companyId,
          accountCode: r.accountCode,
          accountName: r.accountName,
          accountType: r.accountType,
          parentAccountId: r.parentAccountCode ? codeToId.get(r.parentAccountCode) : undefined,
          currency: currency as any,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }));
        resolve(out);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function parseTBFromCsv(content: string): TrialBalanceEntry[] {
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  const rows = (parsed.data as any[]);
  return rows.map(row => {
    const accountCode = String(row.accountCode || row.code || row.Code || '').trim();
    const debit = Number(row.debit || row.Debit || 0);
    const credit = Number(row.credit || row.Credit || 0);
    const currency = (row.currency || row.Currency || '').trim() || undefined;
    return { accountCode, debit, credit, currency, originalDebit: currency ? debit : undefined, originalCredit: currency ? credit : undefined } as TrialBalanceEntry;
  });
}

export function parseTBFromExcel(file: File): Promise<TrialBalanceEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
        const out: TrialBalanceEntry[] = json.map((row) => {
          const accountCode = String(row.accountCode || row.code || row.Code).trim();
          const debit = Number(row.debit || row.Debit || 0);
            const credit = Number(row.credit || row.Credit || 0);
            const currency = (row.currency || row.Currency || '').trim() || undefined;
            return { accountCode, debit, credit, currency, originalDebit: currency ? debit : undefined, originalCredit: currency ? credit : undefined } as TrialBalanceEntry;
        });
        resolve(out);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Generic journal transactions (supports debit/credit OR amount+type style if extended later)
export function parseTransactionsFromCsv(content: string, companyId: string, defaultCurrency: string): JournalTransaction[] {
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  const rows = (parsed.data as any[]);
  const now = new Date().toISOString();
  return rows.filter(r => r.accountCode || r.account).map((row, idx) => {
    const accountCode = String(row.accountCode || row.account || '').trim();
    const debit = Number(row.debit || row.Debit || 0);
    const credit = Number(row.credit || row.Credit || 0);
    const currency = (row.currency || row.Currency || defaultCurrency).trim();
    return {
      id: `txn-${Date.now()}-${idx}`,
      companyId,
      date: (row.date || row.Date || new Date().toISOString().slice(0,10)),
      accountCode,
      description: row.description || row.memo || row.Memo || '',
      debit,
      credit,
      currency: currency as any,
      source: 'upload',
      reference: row.reference || row.ref || '',
      createdAt: now,
      createdBy: 'consultant-1'
    } as JournalTransaction;
  });
}

export function parseTransactionsFromExcel(file: File, companyId: string, defaultCurrency: string): Promise<JournalTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
        const now = new Date().toISOString();
        const out: JournalTransaction[] = json.filter(r => r.accountCode || r.account).map((row, idx) => {
          const accountCode = String(row.accountCode || row.account || '').trim();
          const debit = Number(row.debit || row.Debit || 0);
          const credit = Number(row.credit || row.Credit || 0);
          const currency = (row.currency || row.Currency || defaultCurrency).trim();
          return {
            id: `txn-${Date.now()}-${idx}`,
            companyId,
            date: (row.date || row.Date || new Date().toISOString().slice(0,10)),
            accountCode,
            description: row.description || row.memo || row.Memo || '',
            debit,
            credit,
            currency: currency as any,
            source: 'upload',
            reference: row.reference || row.ref || '',
            createdAt: now,
            createdBy: 'consultant-1'
          } as JournalTransaction;
        });
        resolve(out);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
