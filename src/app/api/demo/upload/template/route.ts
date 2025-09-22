import { NextRequest } from 'next/server';

type TemplateKind = 'transactions' | 'invoices' | 'payroll';

const templates: Record<TemplateKind, { filename: string; csv: string }> = {
    transactions: {
        filename: 'transactions_template.csv',
        csv: [
            'date,description,amount,currency,reference,account,debit,credit',
            '2025-06-01,POS Purchase - Ikeja,-15000,NGN,REF-1001,Expenses:POS,15000,',
            '2025-06-02,Transfer from Customer,250000,NGN,REF-1002,Income:Sales,,250000'
        ].join('\n')
    },
    invoices: {
        filename: 'invoices_template.csv',
        csv: [
            'invoice_number,issue_date,due_date,customer,description,quantity,unit_price,currency,tax_rate',
            'INV-001,2025-06-01,2025-06-15,Acme Ltd,Monthly retainer,1,300000,NGN,7.5',
            'INV-002,2025-06-03,2025-06-20,Globex Inc,Implementation hours,10,25000,NGN,7.5'
        ].join('\n')
    },
    payroll: {
        filename: 'payroll_template.csv',
        csv: [
            'employee_id,full_name,month,gross_pay,paye,pension,nhf,other_deductions,bank_account',
            'E-001,Jane Doe,2025-06,500000,50000,37500,25000,0,0123456789',
            'E-002,John Smith,2025-06,420000,42000,31500,21000,0,1234567890'
        ].join('\n')
    }
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const kind = (searchParams.get('type') as TemplateKind) || 'transactions';
    const tpl = templates[kind] ?? templates.transactions;

    return new Response(tpl.csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename=${tpl.filename}`,
            'Cache-Control': 'no-store'
        }
    });
}
