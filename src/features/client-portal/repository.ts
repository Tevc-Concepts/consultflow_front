/**
 * Client Portal Repository Layer
 * Handles all data operations for documents, reports, and tickets with LocalStorage abstraction
 */

export type DocumentStatus = 'pending' | 'reviewed';

export type ClientDocument = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: DocumentStatus;
  companyId: string;
  fileContent?: string; // base64 for demo
  description?: string;
};

export type ReportStatus = 'draft' | 'pendingApproval' | 'approved' | 'rejected';

export type ClientReport = {
  id: string;
  title: string;
  period: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  reportType: 'P&L' | 'Balance Sheet' | 'Cash Flow' | 'Custom';
  fileUrl?: string;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
};

export type TicketStatus = 'open' | 'pending' | 'closed';

export type TicketType = 'technical' | 'report' | 'compliance';

export type TicketComment = {
  id: string;
  ticketId: string;
  author: 'client' | 'accountant';
  message: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  priority: 'low' | 'medium' | 'high';
  comments: TicketComment[];
};

const STORAGE_KEYS = {
  DOCUMENTS: 'consultflow:client:documents:v1',
  REPORTS: 'consultflow:client:reports:v1',
  TICKETS: 'consultflow:client:tickets:v1',
} as const;

class ClientRepository {
  private getFromStorage<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Documents Management
  uploadDocument(document: Omit<ClientDocument, 'id' | 'uploadedAt'>): ClientDocument {
    const newDocument: ClientDocument = {
      ...document,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date().toISOString(),
    };

    const documents = this.getFromStorage<ClientDocument>(STORAGE_KEYS.DOCUMENTS);
    documents.push(newDocument);
    this.saveToStorage(STORAGE_KEYS.DOCUMENTS, documents);
    
    return newDocument;
  }

  getDocuments(companyId: string): ClientDocument[] {
    const documents = this.getFromStorage<ClientDocument>(STORAGE_KEYS.DOCUMENTS);
    return documents.filter(doc => doc.companyId === companyId);
  }

  deleteDocument(documentId: string): boolean {
    const documents = this.getFromStorage<ClientDocument>(STORAGE_KEYS.DOCUMENTS);
    const filteredDocuments = documents.filter(doc => doc.id !== documentId);
    
    if (filteredDocuments.length === documents.length) {
      return false; // Document not found
    }

    this.saveToStorage(STORAGE_KEYS.DOCUMENTS, filteredDocuments);
    return true;
  }

  updateDocumentStatus(documentId: string, status: DocumentStatus): boolean {
    const documents = this.getFromStorage<ClientDocument>(STORAGE_KEYS.DOCUMENTS);
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    
    if (documentIndex === -1) return false;

    documents[documentIndex].status = status;
    this.saveToStorage(STORAGE_KEYS.DOCUMENTS, documents);
    return true;
  }

  // Reports Management
  getReports(companyId: string): ClientReport[] {
    const reports = this.getFromStorage<ClientReport>(STORAGE_KEYS.REPORTS);
    return reports.filter(report => report.companyId === companyId);
  }

  approveReport(reportId: string): boolean {
    const reports = this.getFromStorage<ClientReport>(STORAGE_KEYS.REPORTS);
    const reportIndex = reports.findIndex(report => report.id === reportId);
    
    if (reportIndex === -1) return false;

    reports[reportIndex].status = 'approved';
    reports[reportIndex].approvedAt = new Date().toISOString();
    reports[reportIndex].updatedAt = new Date().toISOString();
    
    this.saveToStorage(STORAGE_KEYS.REPORTS, reports);
    return true;
  }

  rejectReport(reportId: string, reason: string): boolean {
    const reports = this.getFromStorage<ClientReport>(STORAGE_KEYS.REPORTS);
    const reportIndex = reports.findIndex(report => report.id === reportId);
    
    if (reportIndex === -1) return false;

    reports[reportIndex].status = 'rejected';
    reports[reportIndex].rejectionReason = reason;
    reports[reportIndex].rejectedAt = new Date().toISOString();
    reports[reportIndex].updatedAt = new Date().toISOString();
    
    this.saveToStorage(STORAGE_KEYS.REPORTS, reports);
    return true;
  }

  // Tickets Management
  createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): SupportTicket {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };

    const tickets = this.getFromStorage<SupportTicket>(STORAGE_KEYS.TICKETS);
    tickets.push(newTicket);
    this.saveToStorage(STORAGE_KEYS.TICKETS, tickets);
    
    return newTicket;
  }

  getTickets(companyId: string): SupportTicket[] {
    const tickets = this.getFromStorage<SupportTicket>(STORAGE_KEYS.TICKETS);
    return tickets
      .filter(ticket => ticket.companyId === companyId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  updateTicketStatus(ticketId: string, status: TicketStatus): boolean {
    const tickets = this.getFromStorage<SupportTicket>(STORAGE_KEYS.TICKETS);
    const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);
    
    if (ticketIndex === -1) return false;

    tickets[ticketIndex].status = status;
    tickets[ticketIndex].updatedAt = new Date().toISOString();
    
    this.saveToStorage(STORAGE_KEYS.TICKETS, tickets);
    return true;
  }

  addTicketComment(ticketId: string, message: string, author: 'client' | 'accountant' = 'client'): boolean {
    const tickets = this.getFromStorage<SupportTicket>(STORAGE_KEYS.TICKETS);
    const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);
    
    if (ticketIndex === -1) return false;

    const newComment: TicketComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      author,
      message,
      createdAt: new Date().toISOString(),
    };

    tickets[ticketIndex].comments.push(newComment);
    tickets[ticketIndex].updatedAt = new Date().toISOString();
    
    this.saveToStorage(STORAGE_KEYS.TICKETS, tickets);
    return true;
  }

  getTicket(ticketId: string): SupportTicket | null {
    const tickets = this.getFromStorage<SupportTicket>(STORAGE_KEYS.TICKETS);
    return tickets.find(ticket => ticket.id === ticketId) || null;
  }

  // Demo data seeders
  seedDemoData(companyId: string): void {
    this.seedDemoReports(companyId);
    this.seedDemoTickets(companyId);
  }

  private seedDemoReports(companyId: string): void {
    const existingReports = this.getReports(companyId);
    if (existingReports.length > 0) return; // Already seeded

    const demoReports: Omit<ClientReport, 'id'>[] = [
      {
        title: 'Monthly P&L Statement - December 2024',
        period: 'Dec 2024',
        status: 'pendingApproval',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        companyId,
        reportType: 'P&L',
      },
      {
        title: 'Balance Sheet - Q4 2024',
        period: 'Q4 2024',
        status: 'approved',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        companyId,
        reportType: 'Balance Sheet',
        approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Cash Flow Statement - November 2024',
        period: 'Nov 2024',
        status: 'rejected',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        companyId,
        reportType: 'Cash Flow',
        rejectionReason: 'Please provide more detailed breakdown of operating activities section.',
        rejectedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const reports = this.getFromStorage<ClientReport>(STORAGE_KEYS.REPORTS);
    demoReports.forEach(report => {
      reports.push({
        ...report,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    });
    this.saveToStorage(STORAGE_KEYS.REPORTS, reports);
  }

  private seedDemoTickets(companyId: string): void {
    const existingTickets = this.getTickets(companyId);
    if (existingTickets.length > 0) return; // Already seeded

    const demoTickets: Omit<SupportTicket, 'id'>[] = [
      {
        subject: 'Unable to download December P&L report',
        description: 'When I click the download button for the December P&L report, I get a 404 error. Can you please help?',
        type: 'technical',
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        companyId,
        priority: 'medium',
        comments: [
          {
            id: 'comment_1',
            ticketId: '',
            author: 'client',
            message: 'This is preventing me from reviewing the report for our board meeting tomorrow.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'comment_2',
            ticketId: '',
            author: 'accountant',
            message: 'Thanks for reporting this issue. We are looking into it and will have a fix shortly.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ],
      },
      {
        subject: 'Question about VAT calculation method',
        description: 'I noticed the VAT calculations in our recent reports seem different from previous months. Can you explain the methodology used?',
        type: 'compliance',
        status: 'closed',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        companyId,
        priority: 'low',
        comments: [
          {
            id: 'comment_3',
            ticketId: '',
            author: 'accountant',
            message: 'The VAT calculation follows the new FIRS guidelines that came into effect last month. I\'ll send you the detailed breakdown separately.',
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ],
      },
    ];

    const tickets = this.getFromStorage<SupportTicket>(STORAGE_KEYS.TICKETS);
    demoTickets.forEach(ticket => {
      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      tickets.push({
        ...ticket,
        id: ticketId,
        comments: ticket.comments.map(comment => ({
          ...comment,
          ticketId,
        })),
      });
    });
    this.saveToStorage(STORAGE_KEYS.TICKETS, tickets);
  }

  // Clear all data (for testing/reset)
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    });
  }
}

export const clientRepository = new ClientRepository();