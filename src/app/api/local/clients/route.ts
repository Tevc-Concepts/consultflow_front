import { NextRequest, NextResponse } from 'next/server';
import {
  getClientsByConsultant,
  getDocuments,
  getReports, 
  getTickets,
  updateDocumentStatus,
  createReport,
  updateReportStatus,
  updateTicketStatus,
  addTicketComment
} from '@shared/api/localDb';

// GET /api/local/clients?consultantId=<id>&action=<action>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const consultantId = searchParams.get('consultantId');
  const action = searchParams.get('action');
  const companyId = searchParams.get('companyId');
  
  if (!consultantId) {
    return NextResponse.json({ error: 'Consultant ID required' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'clients':
        const clientRelations = getClientsByConsultant(consultantId);
        return NextResponse.json({ clients: clientRelations });
        
      case 'documents':
        if (!companyId) {
          return NextResponse.json({ error: 'Company ID required for documents' }, { status: 400 });
        }
        const documents = getDocuments(companyId);
        return NextResponse.json({ documents });
        
      case 'reports':
        if (!companyId) {
          return NextResponse.json({ error: 'Company ID required for reports' }, { status: 400 });
        }
        const reports = getReports(companyId);
        return NextResponse.json({ reports });
        
      case 'tickets':
        if (!companyId) {
          return NextResponse.json({ error: 'Company ID required for tickets' }, { status: 400 });
        }
        const tickets = getTickets(companyId);
        return NextResponse.json({ tickets });
        
      default:
        // Return all client data for consultant
        const relations = getClientsByConsultant(consultantId);
        return NextResponse.json({ relations });
    }
  } catch (error: any) {
    console.error('Failed to fetch client data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/local/clients - Handle client data updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'reviewDocument':
        const { documentId, status, reviewedBy, reviewNotes } = data;
        const success = updateDocumentStatus(documentId, status, reviewedBy, reviewNotes);
        return NextResponse.json({ success });
        
      case 'createReport':
        const newReport = createReport(data);
        return NextResponse.json({ report: newReport });
        
      case 'updateReportStatus':
        const { reportId, status: reportStatus, approvedBy, rejectionReason } = data;
        const reportSuccess = updateReportStatus(reportId, reportStatus, approvedBy, rejectionReason);
        return NextResponse.json({ success: reportSuccess });
        
      case 'updateTicketStatus':
        const { ticketId, status: ticketStatus } = data;
        const ticketSuccess = updateTicketStatus(ticketId, ticketStatus);
        return NextResponse.json({ success: ticketSuccess });
        
      case 'addTicketComment':
        const { ticketId: commentTicketId, authorId, message, isInternal } = data;
        const comment = addTicketComment(commentTicketId, authorId, message, isInternal || false);
        return NextResponse.json({ comment });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Failed to update client data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/local/clients - Alias for POST
export async function PUT(req: NextRequest) {
  return POST(req);
}