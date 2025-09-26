import { NextRequest } from 'next/server';
import { query, run } from '@shared/api/localDb';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const rates = query('SELECT * FROM exchange_rates ORDER BY month DESC LIMIT 12') as any[];
        return Response.json({
            success: true,
            rates: rates.map(rate => ({
                month: rate.month,
                rates: {
                    NGN_USD: rate.ngn_usd,
                    KES_USD: rate.kes_usd,
                    ZAR_USD: rate.zar_usd, 
                    GHS_USD: rate.ghs_usd,
                    MAD_USD: rate.mad_usd,
                    NGN_ZAR: rate.ngn_zar,
                    KES_NGN: rate.kes_ngn,
                    GHS_MAD: rate.ghs_mad
                }
            }))
        });
    } catch (error: any) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { month, rates } = body;
        
        if (!month || !rates) {
            return Response.json({ 
                success: false, 
                error: 'Month and rates are required' 
            }, { status: 400 });
        }

        // Update the exchange rates for the specified month
        run(`INSERT OR REPLACE INTO exchange_rates 
            (month, ngn_usd, kes_usd, zar_usd, ghs_usd, mad_usd, ngn_zar, kes_ngn, ghs_mad) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                month,
                rates.NGN_USD || 950,
                rates.KES_USD || 135,
                rates.ZAR_USD || 18.5,
                rates.GHS_USD || 15.2,
                rates.MAD_USD || 10.1,
                rates.NGN_ZAR || (rates.NGN_USD || 950) / (rates.ZAR_USD || 18.5),
                rates.KES_NGN || (rates.KES_USD || 135) / (rates.NGN_USD || 950),
                rates.GHS_MAD || (rates.GHS_USD || 15.2) / (rates.MAD_USD || 10.1)
            ]
        );

        return Response.json({ 
            success: true, 
            message: 'Exchange rates updated successfully' 
        });
    } catch (error: any) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}