/**
 * Vercel-Compatible Authentication API
 * Uses proper ConsultFlow database schema for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { vercelConsultFlowDB } from '@shared/api/vercelConsultFlowDB';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, username, password, role } = body;
    
    if (action === 'login') {
      const db = vercelConsultFlowDB;
      let authenticatedUser = null;
      
      // Try SuperAdmin authentication
      if (username === 'admin' || email?.includes('admin')) {
        const superAdmin = db.authenticateSuperAdmin(username || email, password);
        if (superAdmin) {
          authenticatedUser = {
            ...superAdmin,
            displayName: 'Super Administrator',
            role: 'superadmin'
          };
        }
      }
      
      // Try Consultant authentication
      if (!authenticatedUser && email) {
        const consultant = db.authenticateConsultant(email, password);
        if (consultant) {
          const subscriptionPlans = db.getSubscriptionPlans();
          const plan = subscriptionPlans.find(p => p.id === consultant.subscriptionPlanId);
          
          authenticatedUser = {
            ...consultant,
            displayName: consultant.name,
            role: 'consultant',
            subscriptionPlan: plan?.name || 'Unknown',
            clientsCount: consultant.clients.length
          };
        }
      }
      
      // Try Client authentication
      if (!authenticatedUser && email) {
        const client = db.authenticateClient(email, password);
        if (client) {
          authenticatedUser = {
            ...client,
            displayName: client.name,
            role: 'client',
            companiesCount: client.companies.length,
            ticketsCount: client.tickets.length
          };
        }
      }
      
      if (authenticatedUser) {
        // Create session token (for demo)
        const sessionToken = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return NextResponse.json({
          success: true,
          user: authenticatedUser,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          message: 'Authentication successful'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid credentials'
        }, { status: 401 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication failed'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Return demo credentials for testing
  const db = vercelConsultFlowDB;
  const allData = db.getAllData();
  
  return NextResponse.json({
    success: true,
    demoCredentials: {
      superAdmin: {
        username: allData.superAdmins[0].username,
        password: allData.superAdmins[0].password
      },
      consultants: allData.consultants.map(c => ({
        email: c.email,
        password: c.password,
        name: c.name
      })),
      clients: allData.clients.map(c => ({
        email: c.email,
        password: c.password,
        name: c.name
      }))
    }
  });
}