// Demo Sage adapter stub. Replace with real HTTP calls later.
export type SageConfig = { tenantId: string; token?: string };
export async function fetchData(cfg: SageConfig) {
    await new Promise(r => setTimeout(r, 200));
    return {
        companies: [{ id: 'sage-1', name: 'Sage Foods Ltd', currency: 'USD' }],
        transactions: [
            { date: '2025-06-03', description: 'Sage INV-77', amount: 12000, type: 'Revenue' }
        ],
        meta: { source: 'Sage', tenantId: cfg.tenantId }
    } as const;
}

const adapter = { fetchData };
export default adapter;
