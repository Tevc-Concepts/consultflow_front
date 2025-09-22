import { NextResponse } from 'next/server';

type TaxCalc = {
    period: string; // e.g., 2025-Q2
    companyId: string;
    currency: 'NGN';
    VAT: {
        outputVAT: number; // VAT on sales
        inputVAT: number; // VAT on purchases
        netVAT: number; // payable (positive) or refundable (negative)
    };
    PAYE: {
        employees: number;
        grossPayroll: number;
        taxWithheld: number;
    };
    CIT: {
        taxableProfit: number;
        rate: number; // 20% SME band for demo
        payable: number;
        basisYear: number;
    };
};

type NATPrefilled = {
    form: 'NAT-2025';
    company: { id: string; name: string; tin: string };
    period: string;
    sections: Array<{
        key: string;
        label: string;
        fields: Array<{ name: string; label: string; value: string | number }>;
    }>;
};

export async function GET() {
    // Demo assumes 2025-Q2 as last period
    const period = '2025-Q2';
    const company = { id: 'c1', name: 'Lagos Retail Ltd', tin: '12345678-0001' };

    // Demo numbers
    const VAT_output = 1250000; // VAT on sales
    const VAT_input = 430000; // VAT on purchases
    const netVAT = VAT_output - VAT_input; // payable

    const employees = 42;
    const grossPayroll = 23500000; // NGN
    const payeWithheld = 3700000; // NGN

    const taxableProfit = 68000000; // NGN
    const citRate = 0.20; // SME band
    const citPayable = Math.round(taxableProfit * citRate);

    const calc: TaxCalc = {
        period,
        companyId: company.id,
        currency: 'NGN',
        VAT: { outputVAT: VAT_output, inputVAT: VAT_input, netVAT },
        PAYE: { employees, grossPayroll, taxWithheld: payeWithheld },
        CIT: { taxableProfit, rate: 20, payable: citPayable, basisYear: 2024 }
    };

    const nat: NATPrefilled = {
        form: 'NAT-2025',
        company,
        period,
        sections: [
            {
                key: 'vat',
                label: 'Value Added Tax',
                fields: [
                    { name: 'output_vat', label: 'Output VAT', value: VAT_output },
                    { name: 'input_vat', label: 'Input VAT', value: VAT_input },
                    { name: 'net_vat', label: 'Net VAT Payable', value: netVAT }
                ]
            },
            {
                key: 'paye',
                label: 'PAYE Summary',
                fields: [
                    { name: 'employees', label: 'Employees', value: employees },
                    { name: 'gross_payroll', label: 'Gross Payroll', value: grossPayroll },
                    { name: 'paye_withheld', label: 'PAYE Withheld', value: payeWithheld }
                ]
            },
            {
                key: 'cit',
                label: 'Company Income Tax',
                fields: [
                    { name: 'taxable_profit', label: 'Taxable Profit', value: taxableProfit },
                    { name: 'rate', label: 'Rate (%)', value: 20 },
                    { name: 'payable', label: 'CIT Payable', value: citPayable },
                    { name: 'basis_year', label: 'Basis Year', value: 2024 }
                ]
            }
        ]
    };

    return NextResponse.json({ calc, nat });
}
