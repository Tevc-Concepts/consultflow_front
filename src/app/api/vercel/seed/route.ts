/**
 * Vercel-Compatible Seed API
 * Initializes demo data for serverless deployment
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Simulate database seeding for Vercel deployment
    const seedData = {
      companies: 5,
      users: 7,
      financial_records: 120, // 24 months × 5 companies
      documents: 20,
      reports: 20,
      tickets: 15,
      exchange_rates: 24 // months
    };
    
    // Simulate seeding delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      success: true,
      message: 'Demo database initialized successfully (in-memory)',
      data: seedData,
      timestamp: new Date().toISOString(),
      environment: 'vercel-serverless'
    });
    
  } catch (error) {
    console.error('Demo seed API error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize demo database' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Return seed status
  return NextResponse.json({
    success: true,
    status: 'Demo data ready',
    environment: 'vercel-serverless',
    message: 'In-memory demo data is always available',
    timestamp: new Date().toISOString()
  });
}