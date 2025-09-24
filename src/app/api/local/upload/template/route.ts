import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'transactions';
    const csv = type === 'payroll'
        ? 'employee_id,name,month,gross,net\n1,Jane Doe,2025-08,500000,420000\n'
        : type === 'invoices'
            ? 'invoice_no,date,customer,amount\nINV-001,2025-08-01,Acme Ltd,250000\n'
            : 'date,account,description,amount\n2025-08-01,Sales,Online order,100000\n';
    return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${type}_template.csv` } });
}
