// Demo ERPNext adapter stub. Replace with real HTTP calls later.
export type ERPNextConfig = { baseUrl: string; apiKey?: string; apiSecret?: string };
export async function fetchData(cfg: ERPNextConfig) {
    // Simulate latency
    await new Promise(r => setTimeout(r, 200));
    return {
        companies: [{ id: 'erp-1', name: 'ERPNext Co', currency: 'NGN' }],
        transactions: [
            { date: '2025-06-01', description: 'Invoice ERPN-1001', amount: 350000, type: 'Revenue' }
        ],
        meta: { source: 'ERPNext', baseUrl: cfg.baseUrl }
    } as const;
}

const adapter = { fetchData };
export default adapter;
