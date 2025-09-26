/**
 * Vercel-Compatible Clients API
 * Uses proper ConsultFlow database schema with entity relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { vercelConsultFlowDB } from '@shared/api/vercelConsultFlowDB';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const consultantId = searchParams.get('consultantId');
  const action = searchParams.get('action');
  const companyId = searchParams.get('companyId');
  const clientId = searchParams.get('clientId');
  
  try {
    const db = vercelConsultFlowDB;
    
    switch (action) {
      case 'clients':
        if (!consultantId) {
          return NextResponse.json({ error: 'Consultant ID required for clients action' }, { status: 400 });
        }
        const clients = db.getConsultantClients(consultantId);
        const enrichedClients = clients.map(client => ({
          ...client,
          companies: db.getClientCompanies(client.id),
          ticketCount: client.tickets.length,
          documentCount: client.documents.length
        }));
        return NextResponse.json({ 
          success: true,
          clients: enrichedClients 
        });
        
      case 'documents':
        if (!companyId) {
          return NextResponse.json({ error: 'Company ID required for documents' }, { status: 400 });
        }
        const documents = db.getCompanyDocuments(companyId);
        return NextResponse.json({ 
          success: true,
          documents 
        });
        
      case 'reports':
        if (!companyId) {
          return NextResponse.json({ error: 'Company ID required for reports' }, { status: 400 });
        }
        const reports = db.getCompanyReports(companyId);
        return NextResponse.json({ 
          success: true,
          reports 
        });
        
      case 'tickets':
        if (clientId) {
          const clientTickets = db.getClientTickets(clientId);
          return NextResponse.json({ 
            success: true,
            tickets: clientTickets 
          });
        } else if (consultantId) {
          const consultantTickets = db.getConsultantTickets(consultantId);
          return NextResponse.json({ 
            success: true,
            tickets: consultantTickets 
          });
        } else {
          return NextResponse.json({ error: 'Client ID or Consultant ID required for tickets' }, { status: 400 });
        }
        
      default:
        if (!consultantId) {
          return NextResponse.json({ error: 'Consultant ID required for default action' }, { status: 400 });
        }
        // Return all client data for consultant
        const allClients = db.getConsultantClients(consultantId);
        return NextResponse.json({ 
          success: true,
          relations: allClients 
        });
    }
  } catch (error: any) {
    console.error('Failed to fetch client data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'reviewDocument':
        return NextResponse.json({
          success: true,
          message: 'Document reviewed successfully (demo mode)',
          timestamp: new Date().toISOString()
        });
        
      case 'createReport':
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
        
      case 'updateReportStatus':
        return NextResponse.json({
          success: true,
          message: 'Report status updated successfully (demo mode)',
          timestamp: new Date().toISOString()
        });
        
      case 'updateTicketStatus':
        return NextResponse.json({
          success: true,
          message: 'Ticket status updated successfully (demo mode)',
          timestamp: new Date().toISOString()
        });
        
      case 'addTicketComment':
        return NextResponse.json({
          success: true,
          comment: {
            id: `comment-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString()
          },
          message: 'Comment added successfully (demo mode)'
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Failed to update client data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}