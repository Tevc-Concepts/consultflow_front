/**
 * Vercel-Compatible Seed API
 * Uses proper ConsultFlow database schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { vercelConsultFlowDB } from '@shared/api/vercelConsultFlowDB';

export async function POST(req: NextRequest) {
  try {
    const db = vercelConsultFlowDB;
    const allData = db.getAllData();
    
    // Simulate seeding delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const seedStats = {
      superAdmins: allData.superAdmins.length,
      subscriptionPlans: allData.subscriptionPlans.length,
      consultants: allData.consultants.length,
      clients: allData.clients.length,
      companies: allData.companies.length,
      financialReports: allData.financialReports.length,
      tickets: allData.tickets.length,
      documents: allData.documents.length
    };
    
    return NextResponse.json({
      success: true,
      message: 'ConsultFlow database initialized successfully (Vercel in-memory)',
      data: seedStats,
      timestamp: new Date().toISOString(),
      environment: 'vercel-serverless',
      demoCredentials: {
        superAdmin: { username: 'admin', password: 'super123' },
        sampleConsultant: { email: 'sarah@consultflow.com', password: 'consultant123' },
        sampleClient: { email: 'adebayo@techflownigeria.com', password: 'client123' }
      }
    });
    
  } catch (error: any) {
    console.error('Vercel seed API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize database',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = vercelConsultFlowDB;
    const allData = db.getAllData();
    
    return NextResponse.json({
      success: true,
      status: 'ConsultFlow database ready',
      environment: 'vercel-serverless',
      message: 'In-memory database with complete entity relationships',
      timestamp: new Date().toISOString(),
      statistics: {
        superAdmins: allData.superAdmins.length,
        consultants: allData.consultants.length,
        clients: allData.clients.length,
        companies: allData.companies.length,
        reports: allData.financialReports.length,
        tickets: allData.tickets.length,
        documents: allData.documents.length,
        subscriptionPlans: allData.subscriptionPlans.length
      }
    });
  } catch (error: any) {
    console.error('Vercel seed status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get database status'
    }, { status: 500 });
  }
}