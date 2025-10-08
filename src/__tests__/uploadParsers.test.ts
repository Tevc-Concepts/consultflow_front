import { parseTBFromCsv, parseTransactionsFromCsv } from '../shared/utils/uploadParsers';

describe('uploadParsers', () => {
  test('parses trial balance with currency columns', () => {
    const csv = 'accountCode,name,debit,credit,currency\n1000,Cash,100,0,USD\n4000,Revenue,0,250,USD\n';
    const entries = parseTBFromCsv(csv);
    expect(entries).toHaveLength(2);
    expect(entries[0].accountCode).toBe('1000');
    expect(entries[0].currency).toBe('USD');
    expect(entries[0].originalDebit).toBe(100);
  });

  test('parses transactions with debit/credit', () => {
    const csv = 'date,accountCode,description,debit,credit,currency\n2025-01-01,4000,Sale,0,500,USD\n2025-01-02,5000,COGS,300,0,USD\n';
    const txns = parseTransactionsFromCsv(csv, 'demo-co', 'USD');
    expect(txns).toHaveLength(2);
    expect(txns[0].accountCode).toBe('4000');
    expect(txns[1].debit).toBe(300);
  });

  test('ignores empty rows', () => {
    const csv = 'accountCode,name,debit,credit,currency\n\n1000,Cash,50,0,NGN\n';
    const entries = parseTBFromCsv(csv);
    expect(entries.filter(e => e.accountCode)).toHaveLength(1);
  });
});
