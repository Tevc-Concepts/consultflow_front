import { Slide } from './types';

// Demo templates for the Report Builder
export const demoSlides: Slide[] = [
    {
        id: 's-1',
        name: 'Executive KPIs',
        blocks: [
            {
                id: 'b-1',
                kind: 'kpis',
                data: {
                    items: [
                        { label: 'Revenue', value: 1250000, delta: 8.4 },
                        { label: 'Gross Profit', value: 540000, delta: 5.1 },
                        { label: 'Net Income', value: 180000, delta: 3.7 },
                        { label: 'Cash Balance', value: 720000, delta: -2.3 },
                    ]
                }
            },
            {
                id: 'b-2',
                kind: 'narrative',
                data: {
                    title: 'Summary',
                    body: 'Revenue increased by 8.4% this quarter, driven by strong performance in our core products. Gross profit margin remains healthy at 43.2%.'
                }
            }
        ]
    },
    {
        id: 's-2',
        name: 'Financial Trends',
        blocks: [
            {
                id: 'b-3',
                kind: 'chart',
                data: {
                    type: 'line',
                    title: 'Revenue vs Expenses',
                    series: [
                        {
                            name: 'Revenue',
                            data: [980000, 1120000, 1050000, 1250000, 1180000, 1350000],
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                        },
                        {
                            name: 'Expenses',
                            data: [720000, 840000, 780000, 920000, 850000, 950000],
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                        }
                    ]
                }
            }
        ]
    },
    {
        id: 's-3',
        name: 'P&L Summary',
        blocks: [
            {
                id: 'b-4',
                kind: 'table',
                data: {
                    headers: ['Account', 'Current', 'Prior', 'Variance'],
                    rows: [
                        { Account: 'Revenue', Current: '1,250,000', Prior: '1,150,000', Variance: '8.7%' },
                        { Account: 'Cost of Goods', Current: '710,000', Prior: '680,000', Variance: '4.4%' },
                        { Account: 'Gross Profit', Current: '540,000', Prior: '470,000', Variance: '14.9%' },
                        { Account: 'Operating Expenses', Current: '360,000', Prior: '350,000', Variance: '2.9%' },
                        { Account: 'Net Income', Current: '180,000', Prior: '120,000', Variance: '50.0%' }
                    ]
                }
            }
        ]
    }
];

export const templateBlocks = {
    kpis: {
        id: '',
        kind: 'kpis' as const,
        binding: 'none',
        data: {
            items: [
                { label: 'Metric 1', value: 0, delta: 0 },
                { label: 'Metric 2', value: 0, delta: 0 }
            ]
        }
    },
    chart: {
        id: '',
        kind: 'chart' as const,
        binding: 'none',
        data: {
            type: 'line',
            title: 'Chart Title',
            series: [{
                name: 'Series 1',
                data: [10, 20, 30, 40],
                labels: ['Q1', 'Q2', 'Q3', 'Q4']
            }]
        }
    },
    narrative: {
        id: '',
        kind: 'narrative' as const,
        binding: 'none',
        data: {
            title: 'Section Title',
            body: 'Add your narrative text here...'
        }
    },
    table: {
        id: '',
        kind: 'table' as const,
        binding: 'none',
        data: {
            headers: ['Column 1', 'Column 2'],
            rows: [
                { 'Column 1': 'Row 1', 'Column 2': 'Data' },
                { 'Column 1': 'Row 2', 'Column 2': 'Data' }
            ]
        }
    },
    raw: {
        id: '',
        kind: 'raw' as const,
        binding: 'none',
        data: {
            content: 'Raw HTML or markdown content'
        }
    }
};