import { NextRequest, NextResponse } from 'next/server';
import {
  getClientsByConsultant,
  getDocuments,
  getReports, 
  getTickets,
  updateDocumentStatus,
  updateDocument,
  uploadDocument,
  createReport,
  updateReport,
  updateReportStatus,
  createTicket,
  updateTicket,
  updateTicketStatus,
  addTicketComment
} from '@shared/api/localDb';
import {
  getDocumentById,
  getReportById,
  getTicketById,
  addDocumentComment,
  addReportComment
} from '@shared/api/localDb';
import { getDocumentComments, getReportComments, getTicketComments } from '@shared/api/localDb';
import { getUser as getLocalUser } from '@shared/api/localDb';

// GET /api/local/clients?consultantId=<id>&action=<action> OR companyId=<id>&action=<action>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const consultantId = searchParams.get('consultantId');
  const action = searchParams.get('action');
  const companyId = searchParams.get('companyId');
  
  try {
    switch (action) {
      case 'clients':
        if (!consultantId) {
          return NextResponse.json({ error: 'Consultant ID required for clients action' }, { status: 400 });
        }
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
      case 'documentComments': {
        const documentId = searchParams.get('documentId');
        if (!documentId) {
          return NextResponse.json({ error: 'documentId required' }, { status: 400 });
        }
        const comments = getDocumentComments(documentId).map(c => ({
          ...c,
          author_name: getLocalUser(c.author_id)?.full_name || undefined
        }));
        return NextResponse.json({ comments });
      }
      case 'reportComments': {
        const reportId = searchParams.get('reportId');
        if (!reportId) {
          return NextResponse.json({ error: 'reportId required' }, { status: 400 });
        }
        const comments = getReportComments(reportId).map(c => ({
          ...c,
          author_name: getLocalUser(c.author_id)?.full_name || undefined
        }));
        return NextResponse.json({ comments });
      }
      case 'ticketComments': {
        const ticketId = searchParams.get('ticketId');
        if (!ticketId) {
          return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
        }
        const comments = getTicketComments(ticketId).map(c => ({
          ...c,
          author_name: getLocalUser(c.author_id)?.full_name || undefined
        }));
        return NextResponse.json({ comments });
      }
        
      default:
        if (!consultantId) {
          return NextResponse.json({ error: 'Consultant ID required for default action' }, { status: 400 });
        }
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
    // Minimal user context: for demo, accept userId/role in payload when needed
    const currentUserId: string | undefined = (data.userId as string) || undefined;
    const currentUser = currentUserId ? getLocalUser(currentUserId) : null;
    
    switch (action) {
      case 'uploadDocument': {
        const created = uploadDocument(data);
        return NextResponse.json({ document: created });
      }
      case 'updateDocument': {
        const { documentId, patch } = data;
        // Restrict updates to owner (uploaded_by) only; others must comment
        const doc = getDocumentById(documentId);
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (!currentUser || currentUser.id !== doc.uploaded_by) {
          return NextResponse.json({ error: 'Forbidden: Only uploader can edit document. Add a comment instead.' }, { status: 403 });
        }
        const updated = updateDocument(documentId, patch);
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ document: updated });
      }
      case 'reviewDocument':
        const { documentId, status, reviewedBy, reviewNotes } = data;
        const success = updateDocumentStatus(documentId, status, reviewedBy, reviewNotes);
        return NextResponse.json({ success });
      case 'addDocumentComment': {
        const { documentId: dId, authorId, message, isInternal } = data;
        const comment = addDocumentComment(dId, authorId, message, isInternal || false);
        return NextResponse.json({ comment });
      }
        
      case 'createReport':
        const newReport = createReport(data);
        return NextResponse.json({ report: newReport });
      case 'updateReport': {
        const { reportId, patch } = data;
        // Restrict updates to report creator only; others must comment
        const rep = getReportById(reportId);
        if (!rep) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (!currentUser || currentUser.id !== rep.created_by) {
          return NextResponse.json({ error: 'Forbidden: Only creator can edit report. Add a comment instead.' }, { status: 403 });
        }
        const updated = updateReport(reportId, patch);
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ report: updated });
      }
        
      case 'updateReportStatus':
        const { reportId, status: reportStatus, approvedBy, rejectionReason } = data;
        const reportSuccess = updateReportStatus(reportId, reportStatus, approvedBy, rejectionReason);
        return NextResponse.json({ success: reportSuccess });
      case 'addReportComment': {
        const { reportId: rId, authorId, message, isInternal } = data;
        const comment = addReportComment(rId, authorId, message, isInternal || false);
        return NextResponse.json({ comment });
      }
        
      case 'createTicket': {
        const created = createTicket(data);
        return NextResponse.json({ ticket: created });
      }
      case 'updateTicket': {
        const { ticketId, patch } = data;
        // Restrict updates to ticket creator only; others should comment
        const t = getTicketById(ticketId);
        if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (!currentUser || currentUser.id !== t.created_by) {
          return NextResponse.json({ error: 'Forbidden: Only creator can edit ticket. Add a comment instead.' }, { status: 403 });
        }
        const updated = updateTicket(ticketId, patch);
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ticket: updated });
      }
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