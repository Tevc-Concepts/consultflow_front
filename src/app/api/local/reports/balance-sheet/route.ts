import { NextRequest } from 'next/server';
import { query, seedIfEmpty } from '@shared/api/localDb';

export async function GET(req: NextRequest) {
    seedIfEmpty();
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || 'lagos-ng';
    const consolidated = searchParams.get('consolidated') === 'true';
    const as_on_date = searchParams.get('as_on_date') || '2025-09-01';

    // Generate balance sheet data from local database
    let whereClause: string;
    let params: any[];
    
    if (consolidated) {
        whereClause = 'WHERE posting_date <= ?';
        params = [as_on_date];
    } else {
        whereClause = 'WHERE company_id = ? AND posting_date <= ?';
        params = [company, as_on_date];
    }

    const rows = query(`
        SELECT account_code, account_name, SUM(debit - credit) as balance 
        FROM general_ledger 
        ${whereClause}
        GROUP BY account_code, account_name
        HAVING ABS(balance) > 0.01
        ORDER BY account_code
    `, params) as any[];

    // Group accounts by category
    const assets = rows.filter(r => r.account_code.startsWith('1'));
    const liabilities = rows.filter(r => r.account_code.startsWith('2'));
    const equity = rows.filter(r => r.account_code.startsWith('3'));
    
    // Calculate totals
    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum - l.balance, 0); // Liabilities have negative balances
    const totalEquity = equity.reduce((sum, e) => sum - e.balance, 0); // Equity has negative balances

    // Structure as Balance Sheet report
    const result = [
        // Assets
        {
            account_name: 'ASSETS',
            balance: 0,
            indent: 0,
            is_group: true
        },
        {
            account_name: 'Current Assets',
            balance: assets.filter(a => ['1000', '1100', '1200'].includes(a.account_code)).reduce((sum, a) => sum + a.balance, 0),
            indent: 1
        },
        ...assets.filter(a => ['1000', '1100', '1200'].includes(a.account_code)).map(a => ({
            account_name: a.account_name,
            balance: Math.round(a.balance),
            indent: 2
        })),
        {
            account_name: 'Fixed Assets',
            balance: assets.filter(a => a.account_code === '1500').reduce((sum, a) => sum + a.balance, 0),
            indent: 1
        },
        ...assets.filter(a => a.account_code === '1500').map(a => ({
            account_name: a.account_name,
            balance: Math.round(a.balance),
            indent: 2
        })),
        {
            account_name: 'Total Assets',
            balance: Math.round(totalAssets),
            indent: 0,
            is_total: true
        },
        // Liabilities & Equity
        {
            account_name: 'LIABILITIES & EQUITY',
            balance: 0,
            indent: 0,
            is_group: true
        },
        {
            account_name: 'Current Liabilities',
            balance: Math.round(liabilities.filter(l => ['2000', '2100'].includes(l.account_code)).reduce((sum, l) => sum - l.balance, 0)),
            indent: 1
        },
        ...liabilities.filter(l => ['2000', '2100'].includes(l.account_code)).map(l => ({
            account_name: l.account_name,
            balance: Math.round(-l.balance),
            indent: 2
        })),
        ...liabilities.filter(l => l.account_code === '2500').map(l => ({
            account_name: l.account_name,
            balance: Math.round(-l.balance),
            indent: 1
        })),
        {
            account_name: 'Equity',
            balance: Math.round(totalEquity),
            indent: 1
        },
        ...equity.map(e => ({
            account_name: e.account_name,
            balance: Math.round(-e.balance),
            indent: 2
        })),
        {
            account_name: 'Total Liabilities & Equity',
            balance: Math.round(totalLiabilities + totalEquity),
            indent: 0,
            is_total: true
        }
    ];

    const report = {
        company: consolidated ? 'All Companies' : company,
        as_on_date,
        result: result.filter(item => item.balance !== 0 || (item as any).is_group || (item as any).is_total)
    };

    return Response.json(report);
}