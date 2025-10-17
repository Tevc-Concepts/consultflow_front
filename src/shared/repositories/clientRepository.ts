/**
 * Unified Client Repository
 * Handles all client-consultant data interactions with API abstraction
 * Works with both local DB (via API) and Frappe backend
 */

// Re-export types for backward compatibility
export type {
  LocalUser,
  LocalDocument,
  LocalReport, 
  LocalSupportTicket,
  LocalTicketComment,
  LocalNotification,
  LocalClientRelationship
} from '../api/localDb';

// Only import types, not the actual functions that use the database
import type {
  LocalUser,
  LocalDocument,
  LocalReport,
  LocalSupportTicket,
  LocalTicketComment,
  LocalNotification,
  LocalClientRelationship
} from '../api/localDb';

// Define unified interfaces that work with both local DB and Frappe
export interface UserProfile extends LocalUser {
  avatar_url?: string;
}

export interface ClientDocument extends LocalDocument {
  uploadedAt?: string; // For backward compatibility
}

export interface ClientReport extends LocalReport {
  approvedAt?: string;
  rejectedAt?: string;
}

export interface SupportTicket extends LocalSupportTicket {
  comments?: TicketComment[];
}

export interface TicketComment extends LocalTicketComment {
  author?: 'client' | 'consultant';
  author_name?: string;
}
export type DocumentComment = import('../api/localDb').LocalDocumentComment & { author_name?: string };
export type ReportComment = import('../api/localDb').LocalReportComment & { author_name?: string };

export interface ClientCompany {
  id: string;
  name: string;
  currency: string;
  country?: string;
  sector?: string;
  established?: number;
  documentsCount?: number;
  pendingReports?: number;
  openTickets?: number;
  lastActivity?: string;
}

// API mode configuration
export type ApiMode = 'local' | 'frappe';

class UnifiedClientRepository {
  private apiMode: ApiMode = 'local'; // Default to local for demo

  setApiMode(mode: ApiMode): void {
    this.apiMode = mode;
  }

  getApiMode(): ApiMode {
    return this.apiMode;
  }

  // Helper method to make API calls
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  // User management methods
  async getUser(id: string): Promise<UserProfile | null> {
    if (this.apiMode === 'local') {
      try {
        const result = await this.apiCall(`/api/local/users/${id}`);
        return result.user;
      } catch {
        return null;
      }
    }
    
    // TODO: Implement Frappe user fetch
    throw new Error('Frappe user management not yet implemented');
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    if (this.apiMode === 'local') {
      try {
        const result = await this.apiCall(`/api/local/users?email=${encodeURIComponent(email)}`);
        return result.user;
      } catch {
        return null;
      }
    }
    
    // TODO: Implement Frappe user fetch by email
    throw new Error('Frappe user management not yet implemented');
  }

  async getUserByUsername(username: string): Promise<UserProfile | null> {
    if (this.apiMode === 'local') {
      try {
        const result = await this.apiCall(`/api/local/users?username=${encodeURIComponent(username)}`);
        return result.user;
      } catch {
        return null;
      }
    }
    
    // TODO: Implement Frappe user fetch by username
    throw new Error('Frappe user management not yet implemented');
  }

  // Client-consultant relationship methods
  async getClientsByConsultant(consultantId: string): Promise<Array<{
    relationship: LocalClientRelationship;
    client: UserProfile;
    company: ClientCompany;
  }>> {
    if (this.apiMode === 'local') {
      try {
        const result = await this.apiCall(`/api/local/clients?consultantId=${consultantId}&action=clients`);
        return result.clients || [];
      } catch (error) {
        console.error('Failed to fetch clients:', error);
        return [];
      }
    }
    
    // TODO: Implement Frappe client relationships
    throw new Error('Frappe client relationships not yet implemented');
  }

  // Document management methods
  getDocuments(companyId: string, status?: string): ClientDocument[] {
    if (this.apiMode === 'local') {
      // For synchronous access, we'll return empty array and the components should use async loading
      console.warn('Synchronous document access - use async methods instead');
      return [];
    }
    
    // TODO: Implement Frappe document fetch
    throw new Error('Frappe document management not yet implemented');
  }

  async getDocumentsAsync(companyId: string, status?: string): Promise<ClientDocument[]> {
    if (this.apiMode === 'local') {
      try {
        const params = new URLSearchParams({ 
          companyId, 
          action: 'documents' 
        });
        if (status) params.set('status', status);
        
        const result = await this.apiCall(`/api/local/clients?${params}`);
        return result.documents.map((doc: LocalDocument) => ({
          ...doc,
          uploadedAt: doc.created_at, // Backward compatibility
        }));
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        return [];
      }
    }
    
    // TODO: Implement Frappe document fetch
    throw new Error('Frappe document management not yet implemented');
  }

  async uploadDocument(document: Omit<ClientDocument, 'id' | 'created_at' | 'updated_at' | 'uploadedAt'>): Promise<ClientDocument> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'uploadDocument',
          ...document
        })
      });
      return {
        ...result.document,
        uploadedAt: result.document.created_at,
      };
    }
    
    // TODO: Implement Frappe document upload
    throw new Error('Frappe document upload not yet implemented');
  }

  async updateDocument(documentId: string, patch: Partial<ClientDocument>): Promise<ClientDocument | null> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({ action: 'updateDocument', documentId, patch, userId: this.currentUserIdSafe() })
      });
      return result.document || null;
    }
    throw new Error('Frappe document update not yet implemented');
  }

  async updateDocumentStatus(documentId: string, status: 'pending' | 'reviewed' | 'approved' | 'rejected', reviewedBy: string, reviewNotes?: string): Promise<boolean> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reviewDocument',
          documentId,
          status,
          reviewedBy,
          reviewNotes
        })
      });
      return result.success;
    }
    
    // TODO: Implement Frappe document status update
    throw new Error('Frappe document status update not yet implemented');
  }

  // Report management methods
  getReports(companyId: string, status?: string): ClientReport[] {
    if (this.apiMode === 'local') {
      // For synchronous access, we'll return empty array and the components should use async loading
      console.warn('Synchronous report access - use async methods instead');
      return [];
    }
    
    // TODO: Implement Frappe report fetch
    throw new Error('Frappe report management not yet implemented');
  }

  async getReportsAsync(companyId: string, status?: string): Promise<ClientReport[]> {
    if (this.apiMode === 'local') {
      try {
        const params = new URLSearchParams({ 
          companyId, 
          action: 'reports' 
        });
        if (status) params.set('status', status);
        
        const result = await this.apiCall(`/api/local/clients?${params}`);
        return result.reports.map((report: LocalReport) => ({
          ...report,
          approvedAt: report.approved_at,
          rejectedAt: report.rejected_at,
        }));
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        return [];
      }
    }
    
    // TODO: Implement Frappe report fetch
    throw new Error('Frappe report management not yet implemented');
  }

  async createReport(report: Omit<ClientReport, 'id' | 'created_at' | 'updated_at'>): Promise<ClientReport> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'createReport',
          ...report
        })
      });
      return {
        ...result.report,
        approvedAt: result.report.approved_at,
        rejectedAt: result.report.rejected_at,
      };
    }
    
    // TODO: Implement Frappe report creation
    throw new Error('Frappe report creation not yet implemented');
  }

  async updateReport(reportId: string, patch: Partial<ClientReport>): Promise<ClientReport | null> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({ action: 'updateReport', reportId, patch, userId: this.currentUserIdSafe() })
      });
      return result.report || null;
    }
    throw new Error('Frappe report update not yet implemented');
  }

  async updateReportStatus(reportId: string, status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'submitted', approvedBy?: string, rejectionReason?: string): Promise<boolean> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateReportStatus',
          reportId,
          status,
          approvedBy,
          rejectionReason
        })
      });
      return result.success;
    }
    
    // TODO: Implement Frappe report status update
    throw new Error('Frappe report status update not yet implemented');
  }

  // Ticket management methods
  getTickets(companyId: string, status?: string): SupportTicket[] {
    if (this.apiMode === 'local') {
      // For synchronous access, we'll return empty array and the components should use async loading
      console.warn('Synchronous ticket access - use async methods instead');
      return [];
    }
    
    // TODO: Implement Frappe ticket fetch
    throw new Error('Frappe ticket management not yet implemented');
  }

  async getTicketsAsync(companyId: string, status?: string): Promise<SupportTicket[]> {
    if (this.apiMode === 'local') {
      try {
        const params = new URLSearchParams({ 
          companyId, 
          action: 'tickets' 
        });
        if (status) params.set('status', status);
        
        const result = await this.apiCall(`/api/local/clients?${params}`);
        return result.tickets.map((ticket: LocalSupportTicket) => ({
          ...ticket,
          comments: [], // Comments loaded separately
        }));
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
        return [];
      }
    }
    
    // TODO: Implement Frappe ticket fetch
    throw new Error('Frappe ticket management not yet implemented');
  }

  async createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'comments'>): Promise<SupportTicket> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'createTicket',
          ...ticket
        })
      });
      return {
        ...result.ticket,
        comments: [],
      };
    }
    
    // TODO: Implement Frappe ticket creation
    throw new Error('Frappe ticket creation not yet implemented');
  }

  async updateTicket(ticketId: string, patch: Partial<SupportTicket>): Promise<SupportTicket | null> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({ action: 'updateTicket', ticketId, patch, userId: this.currentUserIdSafe() })
      });
      return result.ticket || null;
    }
    throw new Error('Frappe ticket update not yet implemented');
  }

  async updateTicketStatus(ticketId: string, status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed'): Promise<boolean> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateTicketStatus',
          ticketId,
          status
        })
      });
      return result.success;
    }
    
    // TODO: Implement Frappe ticket status update
    throw new Error('Frappe ticket status update not yet implemented');
  }

  getTicketComments(ticketId: string): TicketComment[] {
    if (this.apiMode === 'local') {
      // For synchronous access, we'll return empty array and the components should use async loading
      console.warn('Synchronous ticket comment access - use async methods instead');
      return [];
    }
    
    // TODO: Implement Frappe ticket comments fetch
    throw new Error('Frappe ticket comments not yet implemented');
  }

  async addTicketComment(ticketId: string, authorId: string, message: string, isInternal = false): Promise<TicketComment> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'addTicketComment',
          ticketId,
          authorId,
          message,
          isInternal
        })
      });
      return result.comment;
    }
    
    // TODO: Implement Frappe ticket comment creation
    throw new Error('Frappe ticket comments not yet implemented');
  }

  async addDocumentComment(documentId: string, authorId: string, message: string, isInternal = false): Promise<DocumentComment> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'addDocumentComment',
          documentId,
          authorId,
          message,
          isInternal
        })
      });
      return result.comment;
    }
    throw new Error('Frappe document comments not yet implemented');
  }

  async addReportComment(reportId: string, authorId: string, message: string, isInternal = false): Promise<ReportComment> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/clients', {
        method: 'POST',
        body: JSON.stringify({
          action: 'addReportComment',
          reportId,
          authorId,
          message,
          isInternal
        })
      });
      return result.comment;
    }
    throw new Error('Frappe report comments not yet implemented');
  }

  async getDocumentComments(documentId: string): Promise<DocumentComment[]> {
    if (this.apiMode === 'local') {
      const params = new URLSearchParams({ action: 'documentComments', documentId });
      const result = await this.apiCall(`/api/local/clients?${params.toString()}`);
      return result.comments || [];
    }
    throw new Error('Frappe document comments not yet implemented');
  }

  async getReportComments(reportId: string): Promise<ReportComment[]> {
    if (this.apiMode === 'local') {
      const params = new URLSearchParams({ action: 'reportComments', reportId });
      const result = await this.apiCall(`/api/local/clients?${params.toString()}`);
      return result.comments || [];
    }
    throw new Error('Frappe report comments not yet implemented');
  }

  async getTicketCommentsAsync(ticketId: string): Promise<TicketComment[]> {
    if (this.apiMode === 'local') {
      const params = new URLSearchParams({ action: 'ticketComments', ticketId });
      const result = await this.apiCall(`/api/local/clients?${params.toString()}`);
      return result.comments || [];
    }
    throw new Error('Frappe ticket comments not yet implemented');
  }

  // Notification methods
  async getUserNotifications(userId: string, unreadOnly = false): Promise<LocalNotification[]> {
    if (this.apiMode === 'local') {
      try {
        const params = new URLSearchParams({ userId });
        if (unreadOnly) params.set('unreadOnly', 'true');
        
        const result = await this.apiCall(`/api/local/notifications?${params}`);
        return result.notifications;
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    }
    
    // TODO: Implement Frappe notifications
    throw new Error('Frappe notifications not yet implemented');
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'markAsRead',
          notificationId
        })
      });
      return result.success;
    }
    
    // TODO: Implement Frappe notification read
    throw new Error('Frappe notifications not yet implemented');
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    if (this.apiMode === 'local') {
      const result = await this.apiCall('/api/local/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'markAllAsRead',
          userId
        })
      });
      return result.success;
    }
    
    // TODO: Implement Frappe mark all notifications read
    throw new Error('Frappe notifications not yet implemented');
  }

  // Legacy compatibility methods for existing client portal
  async approveReport(reportId: string, approvedBy: string): Promise<boolean> {
    return this.updateReportStatus(reportId, 'approved', approvedBy);
  }

  async rejectReport(reportId: string, rejectionReason: string, rejectedBy: string): Promise<boolean> {
    return this.updateReportStatus(reportId, 'rejected', rejectedBy, rejectionReason);
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    // TODO: Implement soft delete for documents
    console.warn('Document deletion not implemented - using soft delete approach');
    return this.updateDocumentStatus(documentId, 'rejected', 'system', 'Document removed by user');
  }

  // Demo data management
  clearAllData(): void {
    if (this.apiMode === 'local') {
      // TODO: Implement local data clearing
      console.warn('Local data clearing not yet implemented');
    }
  }

  seedDemoData(companyId: string): void {
    if (this.apiMode === 'local') {
      // Data is seeded automatically when the database is created
      console.log('Demo data automatically seeded via local database');
    }
  }

  // ===== Client interaction history (local-only, transparent log) =====
  private historyKey = 'consultflow:client:interactions';
  private readHistory(): Record<string, Array<{ id: string; ts: string; kind: 'document'|'report'|'ticket'; companyId: string; entityId: string; type: 'create'|'update'|'status_change'|'comment'|'delete'|'attach'; userId: string; note?: string; changes?: Record<string, { from: any; to: any }>; }>> {
    try { const raw = localStorage.getItem(this.historyKey); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }
  private writeHistory(data: Record<string, any>) { try { localStorage.setItem(this.historyKey, JSON.stringify(data)); } catch {} }
  private logToAccountingRepository(params: { kind: 'document'|'report'|'ticket'; companyId: string; entityId: string; type: 'create'|'update'|'status_change'|'comment'|'delete'|'attach'; userId: string; note?: string; changes?: Record<string, { from: any; to: any }>; timestamp: string }) {
    try {
      // Lazy import to avoid circular dependencies at module top level
      const { accountingRepository } = require('@shared/repositories/accountingRepository');
      const mapAction = (t: string): 'create'|'update'|'delete'|'status_change' => {
        if (t === 'delete') return 'delete';
        if (t === 'status_change') return 'status_change';
        if (t === 'create') return 'create';
        return 'update'; // comment/attach/update -> update
      };
      accountingRepository.logAudit(params.companyId, {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        entity: params.kind,
        entityId: params.entityId,
        action: mapAction(params.type),
        timestamp: params.timestamp,
        userId: params.userId,
        changes: params.changes,
        meta: params.note ? { note: params.note, eventType: params.type, userDisplayName: this.resolveUserName(params.userId) } : { eventType: params.type, userDisplayName: this.resolveUserName(params.userId) }
      });
    } catch {}
  }

  private resolveUserName(userId: string): string | undefined {
    try {
      // Try to read from persisted auth store if available
      const raw = typeof window !== 'undefined' ? localStorage.getItem('consultflow:auth:state:v1') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user?.id === userId && parsed?.user?.full_name) return parsed.user.full_name;
      }
    } catch {}
    return undefined;
  }
  private currentUserIdSafe(): string | undefined {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('consultflow:auth:state:v1') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.user?.id;
      }
    } catch {}
    return undefined;
  }
  
  logInteraction(params: { kind: 'document'|'report'|'ticket'; companyId: string; entityId: string; type: 'create'|'update'|'status_change'|'comment'|'delete'|'attach'; userId: string; note?: string; changes?: Record<string, { from: any; to: any }>; }) {
    const data = this.readHistory();
    const key = `${params.kind}:${params.entityId}`;
    const evt = { id: `hx-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ts: new Date().toISOString(), ...params };
    (data[key] = data[key] || []).push(evt);
    this.writeHistory(data);

    // Log the interaction to the global audit
    this.logToAccountingRepository({ ...params, timestamp: evt.ts });

    return evt.id;
  }
  getInteractionHistory(kind: 'document'|'report'|'ticket', entityId: string) {
    const data = this.readHistory();
    const key = `${kind}:${entityId}`;
    const arr = data[key] || [];
    return arr.sort((a,b) => b.ts.localeCompare(a.ts));
  }
}

// Export singleton instance
export const clientRepository = new UnifiedClientRepository();

// Export for backward compatibility
export default clientRepository;