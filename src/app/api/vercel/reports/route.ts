/**
 * Vercel-Compatible Demo Data API
 * Provides in-memory demo data for serverless deployment
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory demo data for Vercel deployment
const DEMO_COMPANIES = [
  { id: 'lagos-ng', name: 'TechFlow Nigeria Ltd', currency: 'NGN', country: 'Nigeria', sector: 'Technology', established: 2018 },
  { id: 'nairobi-ke', name: 'East Africa Logistics Co', currency: 'KES', country: 'Kenya', sector: 'Logistics', established: 2016 },
  { id: 'cape-town-za', name: 'Southern Mining Corp', currency: 'ZAR', country: 'South Africa', sector: 'Mining', established: 2015 },
  { id: 'accra-gh', name: 'Ghana AgriTech Solutions', currency: 'GHS', country: 'Ghana', sector: 'Agriculture', established: 2020 },
  { id: 'casablanca-ma', name: 'Maghreb Trading SARL', currency: 'MAD', country: 'Morocco', sector: 'Trading', established: 2017 },
];

const DEMO_SERIES_DATA = generateDemoSeriesData();

function generateDemoSeriesData() {
  const data: any[] = [];
  const now = new Date();
  
  // Generate 24 months of data for each company
  for (let monthsAgo = 23; monthsAgo >= 0; monthsAgo--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - monthsAgo);
    const formattedDate = date.toISOString().slice(0, 10);
    
    DEMO_COMPANIES.forEach((company, index) => {
      // Base values per company (realistic for each currency)
      const baseValues: Record<string, { revenue: number; cogs: number; expenses: number; cash: number }> = {
        'lagos-ng': { revenue: 25_000_000, cogs: 15_000_000, expenses: 8_000_000, cash: 45_000_000 },
        'nairobi-ke': { revenue: 8_500_000, cogs: 5_500_000, expenses: 2_200_000, cash: 2_800_000 },
        'cape-town-za': { revenue: 1_800_000, cogs: 1_300_000, expenses: 350_000, cash: 850_000 },
        'accra-gh': { revenue: 180_000, cogs: 120_000, expenses: 45_000, cash: 95_000 },
        'casablanca-ma': { revenue: 850_000, cogs: 600_000, expenses: 180_000, cash: 420_000 }
      };
      
      const base = baseValues[company.id] || baseValues['lagos-ng'];
      
      // Add seasonal variation and growth
      const seasonalFactor = 1 + 0.15 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
      const growthFactor = 1 + (0.05 * (23 - monthsAgo) / 23); // 5% annual growth
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% randomness
      
      const revenue = Math.round(base.revenue * seasonalFactor * growthFactor * randomFactor);
      const cogs = Math.round(base.cogs * seasonalFactor * growthFactor * randomFactor);
      const expenses = Math.round(base.expenses * randomFactor);
      const cash = Math.round(base.cash * (1 + (revenue - cogs - expenses) / base.revenue * 0.3));
      
      data.push({
        company_id: company.id,
        posting_date: formattedDate,
        revenue,
        cogs,
        expenses,
        net_income: revenue - cogs - expenses,
        cash,
        created_at: now.toISOString()
      });
    });
  }
  
  return data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companies = searchParams.get('company')?.split(',') || [];
  const range = parseInt(searchParams.get('range') || '30');
  const currency = searchParams.get('currency') || 'NGN';
  
  try {
    // Filter data based on requested companies
    let filteredData = DEMO_SERIES_DATA;
    
    if (companies.length > 0) {
      filteredData = filteredData.filter(item => companies.includes(item.company_id));
    }
    
    // Limit to requested range
    filteredData = filteredData.slice(-range);
    
    // Mock exchange rates for multi-currency support
    const exchangeRates: Record<string, number> = {
      'NGN': 1,
      'USD': 0.00105, // 1 NGN = 0.00105 USD
      'KES': 0.007, // 1 NGN = 0.007 KES
      'ZAR': 0.0195, // 1 NGN = 0.0195 ZAR
      'GHS': 0.0126, // 1 NGN = 0.0126 GHS
      'MAD': 0.0106, // 1 NGN = 0.0106 MAD
      'CFA': 0.62 // 1 NGN = 0.62 CFA
    };
    
    const rate = exchangeRates[currency] || 1;
    
    // Convert currency if needed
    if (currency !== 'NGN') {
      filteredData = filteredData.map(item => ({
        ...item,
        revenue: Math.round(item.revenue * rate),
        cogs: Math.round(item.cogs * rate),
        expenses: Math.round(item.expenses * rate),
        net_income: Math.round(item.net_income * rate),
        cash: Math.round(item.cash * rate)
      }));
    }
    
    // Generate summary stats
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCogs = filteredData.reduce((sum, item) => sum + item.cogs, 0);
    const totalExpenses = filteredData.reduce((sum, item) => sum + item.expenses, 0);
    const avgCash = filteredData.length > 0 ? 
      Math.round(filteredData.reduce((sum, item) => sum + item.cash, 0) / filteredData.length) : 0;
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      meta: {
        companies: companies.length > 0 ? companies : DEMO_COMPANIES.map(c => c.id),
        currency,
        range,
        summary: {
          totalRevenue,
          totalCogs,
          totalExpenses,
          netIncome: totalRevenue - totalCogs - totalExpenses,
          avgCash,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCogs - totalExpenses) / totalRevenue) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Demo reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo reports data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Handle demo data refresh
  return NextResponse.json({
    success: true,
    message: 'Demo data refreshed (in-memory)',
    timestamp: new Date().toISOString()
  });
}