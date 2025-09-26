/**
 * Client Portal Feature Index
 * Exports all components and store for easy importing
 */

// Main component
export { default as ClientPortal } from './ClientPortal';

// Store and types
export { useClientStore } from './store';
export type { ClientStoreState } from './store';
export { clientRepository } from './repository';
export type { 
  ClientDocument, 
  ClientReport, 
  SupportTicket, 
  TicketComment,
  DocumentStatus,
  ReportStatus,
  TicketStatus,
  TicketType
} from './repository';

// Individual components
export { default as DocumentUpload } from './components/DocumentUpload';
export { default as DocumentList } from './components/DocumentList';
export { default as ReportCards } from './components/ReportCards';
export { default as CreateTicket } from './components/CreateTicket';
export { default as TicketList } from './components/TicketList';
export { default as TicketDetailModal } from './components/TicketDetailModal';