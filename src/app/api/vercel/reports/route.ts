/**
 * Vercel-Compatible Reports API
 * Uses proper ConsultFlow database schema with entity relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { vercelConsultFlowDB } from '@shared/api/vercelConsultFlowDB';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companies = searchParams.get('company')?.split(',') || [];
  const range = parseInt(searchParams.get('range') || '24');
  const currency = searchParams.get('currency') || 'NGN';
  const companyId = searchParams.get('companyId');
  const status = searchParams.get('status');
  
  try {
    const db = vercelConsultFlowDB;
    
    if (companyId) {
      // Get reports for specific company
      const reports = db.getCompanyReports(companyId);
      const filteredReports = status ? reports.filter(r => r.status === status) : reports;
      
      return NextResponse.json({
        success: true,
        reports: filteredReports,
        meta: {
          total: filteredReports.length,
          companyId,
          status
        }
      });
    }
    
    // Generate financial series data (for dashboard charts)
    const targetCompanies = companies.length > 0 ? companies : 
      db.getAllData().companies.map(c => c.id);
    
    const seriesData = db.generateFinancialSeries(targetCompanies, range);
    
    // Convert currency if needed
    const exchangeRates: Record<string, number> = {
      'NGN': 1,
      'USD': 0.00105,
      'KES': 0.007,
      'ZAR': 0.0195,
      'GHS': 0.0126,
      'MAD': 0.0106,
      'CFA': 0.62
    };
    
    const rate = exchangeRates[currency] || 1;
    const convertedData = currency !== 'NGN' ? seriesData.map(item => ({
      ...item,
      revenue: Math.round(item.revenue * rate),
      cogs: Math.round(item.cogs * rate),
      expenses: Math.round(item.expenses * rate),
      net_income: Math.round(item.net_income * rate),
      cash: Math.round(item.cash * rate)
    })) : seriesData;
    
    // Generate summary stats
    const totalRevenue = convertedData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCogs = convertedData.reduce((sum, item) => sum + item.cogs, 0);
    const totalExpenses = convertedData.reduce((sum, item) => sum + item.expenses, 0);
    const avgCash = convertedData.length > 0 ? 
      Math.round(convertedData.reduce((sum, item) => sum + item.cash, 0) / convertedData.length) : 0;
    
    return NextResponse.json({
      success: true,
      data: convertedData,
      meta: {
        companies: targetCompanies,
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
    console.error('Vercel reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'create':
        return NextResponse.json({
          success: true,
          report: {
            id: `report-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            status: 'draft'
          },
          message: 'Report created successfully (demo mode)'
        });
        
      case 'updateStatus':
        return NextResponse.json({
          success: true,
          report: {
            ...data,
            updatedAt: new Date().toISOString()
          },
          message: 'Report status updated successfully (demo mode)'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Vercel reports POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process report operation' },
      { status: 500 }
    );
  }
}