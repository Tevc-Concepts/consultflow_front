/**
 * Vercel-Compatible Companies API
 * Provides in-memory company data for serverless deployment
 */

import { NextRequest, NextResponse } from 'next/server';

const DEMO_COMPANIES = [
  {
    id: 'lagos-ng',
    name: 'TechFlow Nigeria Ltd',
    currency: 'NGN',
    country: 'Nigeria',
    sector: 'Technology',
    established: 2018,
    is_active: 1,
    description: 'Leading fintech startup in Lagos with mobile payment solutions',
    employees: 45,
    revenue_2023: 180_000_000 // NGN
  },
  {
    id: 'nairobi-ke',
    name: 'East Africa Logistics Co',
    currency: 'KES',
    country: 'Kenya',
    sector: 'Logistics',
    established: 2016,
    is_active: 1,
    description: 'Cross-border logistics and supply chain management',
    employees: 120,
    revenue_2023: 85_000_000 // KES
  },
  {
    id: 'cape-town-za',
    name: 'Southern Mining Corp',
    currency: 'ZAR',
    country: 'South Africa',
    sector: 'Mining',
    established: 2015,
    is_active: 1,
    description: 'Precious metals mining and processing operation',
    employees: 85,
    revenue_2023: 18_500_000 // ZAR
  },
  {
    id: 'accra-gh',
    name: 'Ghana AgriTech Solutions',
    currency: 'GHS',
    country: 'Ghana',
    sector: 'Agriculture',
    established: 2020,
    is_active: 1,
    description: 'Smart farming and agricultural technology solutions',
    employees: 32,
    revenue_2023: 2_100_000 // GHS
  },
  {
    id: 'casablanca-ma',
    name: 'Maghreb Trading SARL',
    currency: 'MAD',
    country: 'Morocco',
    sector: 'Trading',
    established: 2017,
    is_active: 1,
    description: 'International trade and import/export services',
    employees: 28,
    revenue_2023: 8_200_000 // MAD
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('active') !== 'false';
  
  try {
    let companies = [...DEMO_COMPANIES];
    
    if (activeOnly) {
      companies = companies.filter(c => c.is_active === 1);
    }
    
    // Add computed fields
    companies = companies.map(company => ({
      ...company,
      age_years: new Date().getFullYear() - company.established,
      size_category: company.employees < 25 ? 'Small' : 
                   company.employees < 100 ? 'Medium' : 'Large'
    }));
    
    return NextResponse.json({
      success: true,
      companies,
      meta: {
        total: companies.length,
        active: companies.filter(c => c.is_active === 1).length,
        countries: [...new Set(companies.map(c => c.country))].sort(),
        sectors: [...new Set(companies.map(c => c.sector))].sort(),
        currencies: [...new Set(companies.map(c => c.currency))].sort()
      }
    });
    
  } catch (error) {
    console.error('Demo companies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo companies data' },
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
        // Simulate company creation
        const newCompany = {
          id: `company-${Date.now()}`,
          ...data,
          is_active: 1,
          created_at: new Date().toISOString()
        };
        
        return NextResponse.json({
          success: true,
          company: newCompany,
          message: 'Company created successfully (demo mode)'
        });
        
      case 'update':
        // Simulate company update
        const existingCompany = DEMO_COMPANIES.find(c => c.id === data.id);
        if (!existingCompany) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          );
        }
        
        const updatedCompany = {
          ...existingCompany,
          ...data,
          updated_at: new Date().toISOString()
        };
        
        return NextResponse.json({
          success: true,
          company: updatedCompany,
          message: 'Company updated successfully (demo mode)'
        });
        
      case 'delete':
        // Simulate company deletion (soft delete)
        const companyToDelete = DEMO_COMPANIES.find(c => c.id === data.id);
        if (!companyToDelete) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Company deleted successfully (demo mode)'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Demo companies POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process company operation' },
      { status: 500 }
    );
  }
}