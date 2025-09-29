import { frappeApi } from '@shared/api/frappe';
import { consultFlowDB } from '@shared/api/consultflowDB';
import { authRepository } from '@features/auth/repository';

// Types aligned to SuperAdmin store
export type SAConsultant = {
  id: string;
  name: string;
  email: string;
  plan?: string; // store-side alias for subscriptionPlanId
  status: 'active' | 'suspended' | 'pending';
  clientsCount?: number;
  createdAt?: string;
  subscriptionId?: string;
};

export type SAClient = {
  id: string;
  name: string;
  email: string;
  consultantId: string;
  status?: 'active' | 'disabled';
  reportsCount?: number;
  lastActivity?: string;
};

export type SASubscription = {
  id: string;
  name: string;
  price: number;
  maxClients: number;
  maxReports: number;
  storageGB: number;
  features: string[];
};

export type SATicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed' | 'pending';
export type SATicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SATicket = {
  id: string;
  title?: string;
  subject?: string;
  description: string;
  consultantId: string;
  clientId?: string;
  priority: SATicketPriority;
  status: SATicketStatus;
  createdAt: string;
  resolvedAt?: string;
};

function isDemoMode() {
  return authRepository.getAuthMode() === 'demo';
}

export class SuperAdminRepository {
  // Consultants
  async listConsultants(): Promise<SAConsultant[]> {
    if (isDemoMode()) {
      const data = consultFlowDB.getAllData();
      const consultants = (data.consultants || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        plan: c.subscriptionPlanId?.replace('plan-', ''),
        status: c.status,
        clientsCount: c.clients?.length || 0,
        createdAt: c.createdAt,
        subscriptionId: c.subscriptionPlanId,
      }));
      return consultants;
    }
    // Live mode via Frappe
    const docs = await frappeApi.getList('Consultant');
    return docs.data as any;
  }

  async createConsultant(payload: Omit<SAConsultant, 'id' | 'createdAt' | 'clientsCount'> & { password?: string }): Promise<SAConsultant> {
    if (isDemoMode()) {
      const created = consultFlowDB.addConsultant({
        name: payload.name,
        email: payload.email,
        password: payload['password'] || 'changeme',
        status: payload.status || 'active',
        subscriptionPlanId: payload.subscriptionId || 'plan-free',
        company: undefined,
        avatar: undefined,
        phone: undefined,
        clients: [],
      } as any);
      return {
        id: created.id,
        name: created.name,
        email: created.email,
        status: created.status,
        createdAt: created.createdAt,
        plan: created.subscriptionPlanId?.replace('plan-', ''),
        clientsCount: created.clients?.length || 0,
        subscriptionId: created.subscriptionPlanId,
      };
    }
    const created = await frappeApi.createDoc('Consultant', payload as any);
    return created as any;
  }

  async updateConsultant(id: string, updates: Partial<SAConsultant>): Promise<SAConsultant | null> {
    if (isDemoMode()) {
      const updated = consultFlowDB.updateConsultant(id, {
        name: updates.name,
        email: updates.email,
        status: updates.status as any,
        subscriptionPlanId: updates.subscriptionId,
      } as any);
      if (!updated) return null;
      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        status: updated.status,
        createdAt: updated.createdAt,
        plan: updated.subscriptionPlanId?.replace('plan-', ''),
        clientsCount: updated.clients?.length || 0,
        subscriptionId: updated.subscriptionPlanId,
      };
    }
    const updated = await frappeApi.updateDoc('Consultant', id, updates as any);
    return updated as any;
  }

  async deleteConsultant(id: string): Promise<boolean> {
    if (isDemoMode()) {
      return consultFlowDB.deleteConsultant(id);
    }
    await frappeApi.deleteDoc('Consultant', id);
    return true;
  }

  async assignSubscription(consultantId: string, subscriptionId: string): Promise<void> {
    if (isDemoMode()) {
      consultFlowDB.assignConsultantPlan(consultantId, subscriptionId);
      return;
    }
    await frappeApi.updateDoc('Consultant', consultantId, { subscriptionId });
  }

  // Clients
  async createClient(payload: Omit<SAClient, 'id' | 'lastActivity' | 'reportsCount'> & { password?: string }): Promise<SAClient> {
    if (isDemoMode()) {
      const created = consultFlowDB.addClient({
        name: payload.name,
        email: payload.email,
        password: payload['password'] || 'changeme',
        consultantId: payload.consultantId,
        companies: [],
        tickets: [],
        documents: [],
      } as any);
      return {
        id: created.id,
        name: created.name,
        email: created.email,
        consultantId: created.consultantId,
        status: 'active',
        lastActivity: created.createdAt,
        reportsCount: 0,
      };
    }
    const created = await frappeApi.createDoc('Client', payload as any);
    return created as any;
  }

  async updateClient(id: string, updates: Partial<SAClient>): Promise<SAClient | null> {
    if (isDemoMode()) {
      const updated = consultFlowDB.updateClient(id, updates as any);
      return updated as any;
    }
    const updated = await frappeApi.updateDoc('Client', id, updates as any);
    return updated as any;
  }

  async deleteClient(id: string): Promise<boolean> {
    if (isDemoMode()) {
      return consultFlowDB.deleteClient(id);
    }
    await frappeApi.deleteDoc('Client', id);
    return true;
  }

  // Subscriptions (Plans)
  async listSubscriptions(): Promise<SASubscription[]> {
    if (isDemoMode()) {
      const plans = consultFlowDB.getSubscriptionPlans();
      return plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        maxClients: p.maxClients,
        maxReports: p.maxReports,
        storageGB: Math.round((p.maxStorageMB || 0) / 1024),
        features: p.features,
      }));
    }
    const docs = await frappeApi.getList('Subscription Plan');
    return docs.data as any;
  }

  async createSubscription(payload: Omit<SASubscription, 'id'>): Promise<SASubscription> {
    if (isDemoMode()) {
      const created = consultFlowDB.addSubscriptionPlan({
        name: payload.name as any,
        price: payload.price,
        maxClients: payload.maxClients,
        maxReports: payload.maxReports,
        maxStorageMB: payload.storageGB * 1024,
        features: payload.features,
      });
      return {
        id: created.id,
        name: created.name as any,
        price: created.price,
        maxClients: created.maxClients,
        maxReports: created.maxReports,
        storageGB: Math.round((created.maxStorageMB || 0) / 1024),
        features: created.features,
      };
    }
    const created = await frappeApi.createDoc('Subscription Plan', payload as any);
    return created as any;
  }

  async updateSubscription(id: string, updates: Partial<SASubscription>): Promise<SASubscription | null> {
    if (isDemoMode()) {
      const updated = consultFlowDB.updateSubscriptionPlan(id, {
        name: updates.name as any,
        price: updates.price,
        maxClients: updates.maxClients,
        maxReports: updates.maxReports,
        maxStorageMB: updates.storageGB ? updates.storageGB * 1024 : undefined,
        features: updates.features,
      });
      return updated ? ({
        id: updated.id,
        name: updated.name as any,
        price: updated.price,
        maxClients: updated.maxClients,
        maxReports: updated.maxReports,
        storageGB: Math.round((updated.maxStorageMB || 0) / 1024),
        features: updated.features,
      }) : null;
    }
    const updated = await frappeApi.updateDoc('Subscription Plan', id, updates as any);
    return updated as any;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    if (isDemoMode()) {
      return consultFlowDB.deleteSubscriptionPlan(id);
    }
    await frappeApi.deleteDoc('Subscription Plan', id);
    return true;
  }

  // Tickets
  async createTicket(payload: Omit<SATicket, 'id' | 'createdAt'>): Promise<SATicket> {
    if (isDemoMode()) {
      const t = consultFlowDB.createTicket({
        clientId: payload.clientId!,
        consultantId: payload.consultantId,
        subject: payload.subject || payload.title || 'Ticket',
        description: payload.description,
        status: payload.status as any,
        priority: payload.priority as any,
        category: 'general',
      } as any);
      return {
        id: t.id,
        subject: t.subject,
        description: t.description,
        consultantId: t.consultantId!,
        clientId: t.clientId,
        priority: t.priority as any,
        status: (t.status === 'in_progress' ? 'in-progress' : t.status) as any,
        createdAt: t.createdAt,
        resolvedAt: t.resolvedAt,
      };
    }
    const created = await frappeApi.createDoc('Support Ticket', payload as any);
    return created as any;
  }

  async updateTicket(id: string, updates: Partial<SATicket>): Promise<SATicket | null> {
    if (isDemoMode()) {
      const mappedStatus = updates.status === 'in-progress' ? 'in_progress' : updates.status;
      const updated = consultFlowDB.updateTicket(id, { ...updates, status: mappedStatus } as any);
      return updated as any;
    }
    const updated = await frappeApi.updateDoc('Support Ticket', id, updates as any);
    return updated as any;
  }

  // Feature Flags
  async listFeatureFlags(): Promise<Array<{ id: string; name: string; description?: string; enabled: boolean; consultantIds: string[] }>> {
    if (isDemoMode()) {
      // In demo mode, feature flags are managed in the SuperAdmin Zustand store.
      // Repository returns an empty array here; the store remains source of truth.
      return [];
    }
    const resp = await frappeApi.getList('Feature Flag');
    // Expect fields: name/id, description, enabled, consultant_ids (JSON)
    return (resp.data as any[]).map((d: any) => ({
      id: d.name || d.id,
      name: d.label || d.name,
      description: d.description,
      enabled: !!d.enabled,
      consultantIds: Array.isArray(d.consultant_ids) ? d.consultant_ids : (typeof d.consultant_ids === 'string' ? JSON.parse(d.consultant_ids || '[]') : []),
    }));
  }

  async updateFeatureFlag(id: string, enabled: boolean, consultantIds: string[] = []): Promise<void> {
    if (isDemoMode()) {
      // No-op for demo; Zustand store persists locally.
      return;
    }
    await frappeApi.updateDoc('Feature Flag', id, {
      enabled,
      consultant_ids: consultantIds,
    } as any);
  }

  // Reports (minimal example for create/update)
  async createReport(payload: any): Promise<any> {
    if (isDemoMode()) {
      return consultFlowDB.addFinancialReport(payload);
    }
    return frappeApi.createDoc('Financial Report', payload);
  }

  async updateReport(id: string, updates: any): Promise<any> {
    if (isDemoMode()) {
      return consultFlowDB.updateFinancialReport(id, updates);
    }
    return frappeApi.updateDoc('Financial Report', id, updates);
  }
}

export const superAdminRepository = new SuperAdminRepository();
