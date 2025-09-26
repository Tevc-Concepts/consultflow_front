/**
 * Vercel-Compatible Companies API
 * Uses proper ConsultFlow database schema with entity relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { vercelConsultFlowDB } from '@shared/api/vercelConsultFlowDB';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('active') !== 'false';
  const clientId = searchParams.get('clientId');
  
  try {
    const db = vercelConsultFlowDB;
    
    if (clientId) {
      // Get companies for specific client
      const companies = db.getClientCompanies(clientId);
      return NextResponse.json({
        success: true,
        companies: companies.map(company => ({
          ...company,
          reports: db.getCompanyReports(company.id),
          documents: db.getCompanyDocuments(company.id)
        })),
        meta: {
          total: companies.length,
          clientId
        }
      });
    }
    
    // Get all companies
    const allData = db.getAllData();
    const companies = allData.companies;
    
    return NextResponse.json({
      success: true,
      companies: companies.map(company => ({
        ...company,
        client: allData.clients.find(c => c.id === company.clientId),
        reportsCount: company.financialReports.length,
        documentsCount: db.getCompanyDocuments(company.id).length
      })),
      meta: {
        total: companies.length,
        currencies: [...new Set(companies.map(c => c.currency))].sort(),
        industries: [...new Set(companies.map(c => c.industry))].sort(),
        countries: [...new Set(companies.map(c => c.country))].filter(Boolean).sort()
      }
    });
    
  } catch (error) {
    console.error('Vercel companies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    
    // For demo purposes, simulate CRUD operations
    switch (action) {
      case 'create':
        return NextResponse.json({
          success: true,
          company: {
            id: `company-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString()
          },
          message: 'Company created successfully (demo mode)'
        });
        
      case 'update':
        return NextResponse.json({
          success: true,
          company: {
            ...data,
            updatedAt: new Date().toISOString()
          },
          message: 'Company updated successfully (demo mode)'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Vercel companies POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process company operation' },
      { status: 500 }
    );
  }
}