import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'transactions';
    const csv = type === 'payroll'
        ? 'employee_id,name,month,gross,net\n1,Jane Doe,2025-08,500000,420000\n'
        : type === 'invoices'
            ? 'invoice_no,date,customer,amount\nINV-001,2025-08-01,Acme Ltd,250000\n'
            : type === 'coa'
                ? 'accountCode,accountName,accountType,parentAccountCode\n1000,Cash and Bank,Asset,\n1100,Accounts Receivable,Asset,\n1200,Inventory,Asset,\n2000,Accounts Payable,Liability,\n3000,Share Capital,Equity,\n4000,Revenue,Revenue,\n5000,Cost of Goods Sold,Expense,\n6000,Operating Expenses,Expense,\n'
                : type === 'trial_balance'
                    ? 'accountCode,name,debit,credit,currency\n1000,Cash and Bank,5000000,0,NGN\n4000,Revenue,0,8000000,NGN\n5000,Cost of Goods Sold,3000000,0,NGN\n6000,Operating Expenses,1500000,0,NGN\n'
                    : 'date,accountCode,description,debit,credit,currency\n2025-08-01,4000,Online order,0,100000,NGN\n';
    return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${type}_template.csv` } });
}
