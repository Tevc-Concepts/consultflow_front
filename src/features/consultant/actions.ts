/**
 * Consultant Actions for Client Management
 * Additional functions for consultants to interact with client data
 */

import { clientRepository } from '@features/client-portal/repository';

export class ConsultantActions {
  
  // Mark document as reviewed by consultant
  static markDocumentReviewed(documentId: string): boolean {
    return clientRepository.updateDocumentStatus(documentId, 'reviewed');
  }

  // Create and submit a report to a client
  static submitReportToClient(
    companyId: string,
    title: string,
    period: string,
    reportType: 'P&L' | 'Balance Sheet' | 'Cash Flow' | 'Custom'
  ): boolean {
    try {
      // Get existing reports to ensure we don't duplicate
      const existingReports = clientRepository.getReports(companyId);
      const reports = clientRepository['getFromStorage']('consultflow:client:reports:v1') || [];
      
      const newReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        period,
        status: 'pendingApproval' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        companyId,
        reportType,
      };

      reports.push(newReport);
      clientRepository['saveToStorage']('consultflow:client:reports:v1', reports);
      return true;
    } catch (error) {
      console.error('Failed to submit report:', error);
      return false;
    }
  }

  // Respond to a client ticket
  static respondToTicket(ticketId: string, message: string): boolean {
    return clientRepository.addTicketComment(ticketId, message, 'accountant');
  }

  // Close a client ticket
  static closeTicket(ticketId: string): boolean {
    return clientRepository.updateTicketStatus(ticketId, 'closed');
  }

  // Set ticket to in progress
  static markTicketInProgress(ticketId: string): boolean {
    return clientRepository.updateTicketStatus(ticketId, 'pending');
  }

  // Get client activity summary
  static getClientActivitySummary(companyId: string) {
    const documents = clientRepository.getDocuments(companyId);
    const reports = clientRepository.getReports(companyId);
    const tickets = clientRepository.getTickets(companyId);

    return {
      totalDocuments: documents.length,
      pendingDocuments: documents.filter(d => d.status === 'pending').length,
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pendingApproval').length,
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status !== 'closed').length,
      lastActivity: this.getLastActivityDate(documents, reports, tickets)
    };
  }

  private static getLastActivityDate(documents: any[], reports: any[], tickets: any[]): string {
    const allDates: string[] = [
      ...documents.map(d => d.uploadedAt),
      ...reports.map(r => r.updatedAt),
      ...tickets.map(t => t.updatedAt)
    ];

    if (allDates.length === 0) return new Date().toISOString();
    
    return allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }

  // Send email notification to client (mock)
  static sendEmailToClient(companyId: string, subject: string, message: string): boolean {
    // In a real implementation, this would integrate with an email service
    console.log(`📧 Email sent to client ${companyId}:`, { subject, message });
    
    // Show success toast
    const event = new CustomEvent('show-toast', {
      detail: {
        title: 'Email Sent',
        message: `Email notification sent to client successfully.`,
        type: 'success'
      }
    });
    window.dispatchEvent(event);
    
    return true;
  }

  // Request specific documents from client (mock)
  static requestDocumentsFromClient(companyId: string, documentTypes: string[]): boolean {
    // In a real implementation, this would send a notification to the client
    console.log(`📄 Document request sent to client ${companyId}:`, documentTypes);
    
    // Show success toast
    const event = new CustomEvent('show-toast', {
      detail: {
        title: 'Document Request Sent',
        message: `Request for ${documentTypes.join(', ')} sent to client.`,
        type: 'success'
      }
    });
    window.dispatchEvent(event);
    
    return true;
  }
}

export default ConsultantActions;