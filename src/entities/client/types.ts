export interface ClientDocument {
  id: string;
  companyId: string;
  title: string;
  category?: string;
  description?: string;
  url?: string; // placeholder (could be file path / external link)
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  history: InteractionEvent[]; // change events for transparency
}

export interface ClientReportMeta {
  id: string;
  companyId: string;
  name: string;
  periodStart?: string;
  periodEnd?: string;
  status?: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  history: InteractionEvent[];
}

export interface SupportTicket {
  id: string;
  companyId: string;
  subject: string;
  body?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string; // report | technical | compliance etc
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  assignee?: string;
  history: InteractionEvent[];
}

export interface InteractionEvent {
  id: string;
  timestamp: string;
  userId: string;
  type: 'create' | 'update' | 'comment' | 'status_change' | 'attach' | 'delete';
  changes?: Record<string, { from: any; to: any }>;
  note?: string;
}
