/**
 * Client Portal State Management with Zustand
 * Handles documents, reports, tickets state with LocalStorage persistence
 */

import { create, type StateCreator } from 'zustand';
import { 
  clientRepository, 
  type ClientDocument, 
  type ClientReport, 
  type SupportTicket,
  type DocumentStatus,
  type TicketStatus,
  type TicketType
} from './repository';

export type ClientStoreState = {
  // Documents state
  documents: ClientDocument[];
  documentsLoading: boolean;
  
  // Reports state
  reports: ClientReport[];
  reportsLoading: boolean;
  
  // Tickets state
  tickets: SupportTicket[];
  ticketsLoading: boolean;
  activeTicket: SupportTicket | null;
  
  // UI state
  activeTab: 'documents' | 'reports' | 'support';
  uploadProgress: number;
  isUploading: boolean;
  
  // Actions
  setActiveTab: (tab: 'documents' | 'reports' | 'support') => void;
  
  // Document actions
  loadDocuments: (companyId: string) => Promise<void>;
  uploadDocument: (file: File, companyId: string, description?: string) => Promise<ClientDocument | null>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  
  // Report actions
  loadReports: (companyId: string) => Promise<void>;
  approveReport: (reportId: string) => Promise<boolean>;
  rejectReport: (reportId: string, reason: string) => Promise<boolean>;
  
  // Ticket actions
  loadTickets: (companyId: string) => Promise<void>;
  createTicket: (
    subject: string,
    description: string,
    type: TicketType,
    priority: 'low' | 'medium' | 'high',
    companyId: string
  ) => Promise<SupportTicket | null>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<boolean>;
  addTicketComment: (ticketId: string, message: string) => Promise<boolean>;
  setActiveTicket: (ticket: SupportTicket | null) => void;
  
  // Utility actions
  seedDemoData: (companyId: string) => void;
  clearAllData: () => void;
};

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:mime;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const initializer: StateCreator<ClientStoreState> = (set, get) => ({
  // Initial state
  documents: [],
  documentsLoading: false,
  reports: [],
  reportsLoading: false,
  tickets: [],
  ticketsLoading: false,
  activeTicket: null,
  activeTab: 'documents',
  uploadProgress: 0,
  isUploading: false,

  // UI actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveTicket: (ticket) => set({ activeTicket: ticket }),

  // Document actions
  loadDocuments: async (companyId: string) => {
    set({ documentsLoading: true });
    try {
      const documents = clientRepository.getDocuments(companyId);
      set({ documents, documentsLoading: false });
    } catch (error) {
      console.error('Failed to load documents:', error);
      set({ documentsLoading: false });
    }
  },

  uploadDocument: async (file: File, companyId: string, description?: string) => {
    set({ isUploading: true, uploadProgress: 0 });
    
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        set({ uploadProgress: i });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Convert file to base64 for demo storage
      const fileContent = await fileToBase64(file);
      
      const document = clientRepository.uploadDocument({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        companyId,
        status: 'pending',
        fileContent,
        description,
      });

      // Update documents list
      const { documents } = get();
      set({ 
        documents: [...documents, document],
        isUploading: false,
        uploadProgress: 0 
      });

      // Mock notification to accountant (in real app, this would be an API call)
      console.log(`📧 Notification sent to accountant: New document uploaded - ${file.name}`);

      return document;
    } catch (error) {
      console.error('Failed to upload document:', error);
      set({ isUploading: false, uploadProgress: 0 });
      return null;
    }
  },

  deleteDocument: async (documentId: string) => {
    try {
      const success = clientRepository.deleteDocument(documentId);
      if (success) {
        const { documents } = get();
        set({ documents: documents.filter(doc => doc.id !== documentId) });
      }
      return success;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  },

  // Report actions
  loadReports: async (companyId: string) => {
    set({ reportsLoading: true });
    try {
      const reports = clientRepository.getReports(companyId);
      set({ reports, reportsLoading: false });
    } catch (error) {
      console.error('Failed to load reports:', error);
      set({ reportsLoading: false });
    }
  },

  approveReport: async (reportId: string) => {
    try {
      const success = clientRepository.approveReport(reportId);
      if (success) {
        // Update the report in state
        const { reports } = get();
        const updatedReports = reports.map(report => 
          report.id === reportId 
            ? { ...report, status: 'approved' as const, approvedAt: new Date().toISOString() }
            : report
        );
        set({ reports: updatedReports });

        // Mock notification to accountant
        console.log(`📧 Notification sent to accountant: Report ${reportId} approved by client`);
      }
      return success;
    } catch (error) {
      console.error('Failed to approve report:', error);
      return false;
    }
  },

  rejectReport: async (reportId: string, reason: string) => {
    try {
      const success = clientRepository.rejectReport(reportId, reason);
      if (success) {
        // Update the report in state
        const { reports } = get();
        const updatedReports = reports.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                status: 'rejected' as const, 
                rejectionReason: reason,
                rejectedAt: new Date().toISOString()
              }
            : report
        );
        set({ reports: updatedReports });

        // Mock notification to accountant
        console.log(`📧 Notification sent to accountant: Report ${reportId} rejected by client - ${reason}`);
      }
      return success;
    } catch (error) {
      console.error('Failed to reject report:', error);
      return false;
    }
  },

  // Ticket actions
  loadTickets: async (companyId: string) => {
    set({ ticketsLoading: true });
    try {
      const tickets = clientRepository.getTickets(companyId);
      set({ tickets, ticketsLoading: false });
    } catch (error) {
      console.error('Failed to load tickets:', error);
      set({ ticketsLoading: false });
    }
  },

  createTicket: async (
    subject: string,
    description: string,
    type: TicketType,
    priority: 'low' | 'medium' | 'high',
    companyId: string
  ) => {
    try {
      const ticket = clientRepository.createTicket({
        subject,
        description,
        type,
        priority,
        companyId,
        status: 'open',
      });

      // Add to tickets list
      const { tickets } = get();
      set({ tickets: [ticket, ...tickets] });

      // Mock notification to accountant
      console.log(`📧 Notification sent to accountant: New support ticket created - ${subject}`);

      return ticket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      return null;
    }
  },

  updateTicketStatus: async (ticketId: string, status: TicketStatus) => {
    try {
      const success = clientRepository.updateTicketStatus(ticketId, status);
      if (success) {
        // Update tickets in state
        const { tickets, activeTicket } = get();
        const updatedTickets = tickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status, updatedAt: new Date().toISOString() }
            : ticket
        );
        set({ 
          tickets: updatedTickets,
          activeTicket: activeTicket?.id === ticketId 
            ? { ...activeTicket, status, updatedAt: new Date().toISOString() }
            : activeTicket
        });

        // Mock notification to accountant
        console.log(`📧 Notification sent to accountant: Ticket ${ticketId} status changed to ${status}`);
      }
      return success;
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      return false;
    }
  },

  addTicketComment: async (ticketId: string, message: string) => {
    try {
      const success = clientRepository.addTicketComment(ticketId, message);
      if (success) {
        // Get updated ticket from repository
        const updatedTicket = clientRepository.getTicket(ticketId);
        if (updatedTicket) {
          // Update tickets in state
          const { tickets, activeTicket } = get();
          const updatedTickets = tickets.map(ticket => 
            ticket.id === ticketId ? updatedTicket : ticket
          );
          set({ 
            tickets: updatedTickets,
            activeTicket: activeTicket?.id === ticketId ? updatedTicket : activeTicket
          });

          // Mock notification to accountant
          console.log(`📧 Notification sent to accountant: New comment on ticket ${ticketId}`);
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to add ticket comment:', error);
      return false;
    }
  },

  // Utility actions
  seedDemoData: (companyId: string) => {
    clientRepository.seedDemoData(companyId);
    // Reload data after seeding
    get().loadDocuments(companyId);
    get().loadReports(companyId);
    get().loadTickets(companyId);
  },

  clearAllData: () => {
    clientRepository.clearAllData();
    set({
      documents: [],
      reports: [],
      tickets: [],
      activeTicket: null,
    });
  },
});

export const useClientStore = create<ClientStoreState>(initializer);