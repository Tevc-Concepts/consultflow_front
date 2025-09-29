import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { superAdminRepository } from './repository';
import { authRepository } from '@features/auth/repository';

// Types
export interface SuperAdminUser {
  username: string;
  role: string;
  loggedInAt: string;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  clientsCount: number;
  createdAt: string;
  subscriptionId?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  consultantId: string;
  status: 'active' | 'disabled';
  reportsCount: number;
  lastActivity: string;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  maxClients: number;
  maxReports: number;
  storageGB: number;
  features: string[];
}

export interface ConsultantSubscription {
  id: string;
  consultantId: string;
  subscriptionId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'expired' | 'cancelled';
  billingHistory: BillingRecord[];
}

export interface BillingRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
}

export interface Report {
  id: string;
  consultantId: string;
  clientId: string;
  type: string;
  status: 'approved' | 'rejected' | 'pending';
  createdAt: string;
  approvedAt?: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  consultantIds: string[]; // empty means all, or specific consultants
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  consultantId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: string;
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: any;
}

interface SuperAdminState {
  // Auth
  user: SuperAdminUser | null;
  isAuthenticated: boolean;

  // Data
  consultants: Consultant[];
  clients: Client[];
  subscriptions: Subscription[];
  consultantSubscriptions: ConsultantSubscription[];
  reports: Report[];
  featureFlags: FeatureFlag[];
  tickets: Ticket[];
  systemHealth: SystemHealth;
  auditLogs: AuditLog[];

  // Loading states
  isLoading: boolean;

  // Actions
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;

  // Data actions
  loadData: () => void;
  saveData: () => void;

  // CRUD operations
  createConsultant: (consultant: Omit<Consultant, 'id' | 'createdAt'>) => void;
  updateConsultant: (id: string, updates: Partial<Consultant>) => void;
  deleteConsultant: (id: string) => void;

  createSubscription: (subscription: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;

  assignSubscription: (consultantId: string, subscriptionId: string) => void;

  createClient: (client: Omit<Client, 'id' | 'lastActivity'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  createReport: (report: Omit<Report, 'id' | 'createdAt'>) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;

  updateFeatureFlag: (id: string, enabled: boolean, consultantIds?: string[]) => Promise<boolean>;
  fetchFeatureFlags?: () => Promise<void>;

  createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;

  updateSystemHealth: (health: Partial<SystemHealth>) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

// Mock data
const mockSubscriptions: Subscription[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    maxClients: 1,
    maxReports: 5,
    storageGB: 1,
    features: ['Basic reporting', '1 client']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 78400, // ₦78,400 NGN
    maxClients: 10,
    maxReports: 100,
    storageGB: 10,
    features: ['Advanced reporting', 'Up to 10 clients', 'Priority support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 318400, // ₦318,400 NGN
    maxClients: -1, // unlimited
    maxReports: -1, // unlimited
    storageGB: 100,
    features: ['All features', 'Unlimited clients', 'White-label', 'Dedicated support']
  }
];

const mockConsultants: Consultant[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    plan: 'pro',
    status: 'active',
    clientsCount: 3,
    createdAt: '2024-01-15T00:00:00Z',
    subscriptionId: 'pro'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    plan: 'free',
    status: 'active',
    clientsCount: 1,
    createdAt: '2024-02-20T00:00:00Z',
    subscriptionId: 'free'
  }
];

const mockClients: Client[] = [
  {
    id: '1',
    name: 'ABC Corp',
    email: 'contact@abc.com',
    consultantId: '1',
    status: 'active',
    reportsCount: 12,
    lastActivity: '2024-09-25T00:00:00Z'
  },
  {
    id: '2',
    name: 'XYZ Ltd',
    email: 'info@xyz.com',
    consultantId: '1',
    status: 'active',
    reportsCount: 8,
    lastActivity: '2024-09-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Tech Solutions Inc',
    email: 'hello@techsolutions.com',
    consultantId: '2',
    status: 'active',
    reportsCount: 3,
    lastActivity: '2024-09-22T00:00:00Z'
  }
];

const mockFeatureFlags: FeatureFlag[] = [
  {
    id: 'consolidated-reporting',
    name: 'Consolidated Reporting',
    description: 'Allow consultants to generate consolidated reports',
    enabled: true,
    consultantIds: []
  },
  {
    id: 'forecasting',
    name: 'Forecasting',
    description: 'Enable forecasting features',
    enabled: false,
    consultantIds: ['1']
  },
  {
    id: 'stress-testing',
    name: 'Stress Testing',
    description: 'Advanced stress testing tools',
    enabled: false,
    consultantIds: []
  },
  {
    id: 'ticketing',
    name: 'Ticketing System',
    description: 'Internal ticketing for support',
    enabled: true,
    consultantIds: []
  }
];

export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      consultants: mockConsultants,
      clients: mockClients,
      subscriptions: mockSubscriptions,
      consultantSubscriptions: [],
      reports: [],
      featureFlags: mockFeatureFlags,
      tickets: [],
      systemHealth: {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        metrics: {
          uptime: 99.9,
          responseTime: 150,
          errorRate: 0.1
        }
      },
      auditLogs: [],
      isLoading: false,

      // Auth actions
      login: async (credentials) => {
        // Mock authentication
        if (credentials.username === 'admin' && credentials.password === 'super123') {
          const user: SuperAdminUser = {
            username: credentials.username,
            role: 'superadmin',
            loggedInAt: new Date().toISOString()
          };
          set({ user, isAuthenticated: true });
          get().addAuditLog({
            userId: user.username,
            action: 'login',
            details: { success: true }
          });
          return true;
        }
        get().addAuditLog({
          userId: credentials.username,
          action: 'login',
          details: { success: false }
        });
        return false;
      },

      logout: () => {
        const user = get().user;
        set({ user: null, isAuthenticated: false });
        if (user) {
          get().addAuditLog({
            userId: user.username,
            action: 'logout'
          });
        }
      },

      // Data management
      loadData: () => {
        // Load from localStorage if needed
        const data = localStorage.getItem('superadmin_data');
        if (data) {
          const parsed = JSON.parse(data);
          set(parsed);
        }
      },

      saveData: () => {
        const state = get();
        const dataToSave = {
          consultants: state.consultants,
          clients: state.clients,
          subscriptions: state.subscriptions,
          consultantSubscriptions: state.consultantSubscriptions,
          reports: state.reports,
          featureFlags: state.featureFlags,
          tickets: state.tickets,
          auditLogs: state.auditLogs
        };
        localStorage.setItem('superadmin_data', JSON.stringify(dataToSave));
      },

      // Consultant CRUD
      createConsultant: async (consultant) => {
        const created = await superAdminRepository.createConsultant({
          name: consultant.name,
          email: consultant.email,
          status: consultant.status,
          subscriptionId: consultant.subscriptionId || consultant.plan,
        } as any);
        const newConsultant: Consultant = {
          id: created.id,
          name: created.name,
          email: created.email,
          plan: (created.subscriptionId as any) || consultant.plan || 'free',
          status: created.status as any,
          clientsCount: created.clientsCount || 0,
          createdAt: created.createdAt || new Date().toISOString(),
          subscriptionId: (created.subscriptionId as any) || consultant.subscriptionId,
        };
        set(state => ({ consultants: [...state.consultants, newConsultant] }));
        get().saveData();
        get().addAuditLog({
          userId: get().user?.username || 'system',
          action: 'create_consultant',
          details: { consultantId: newConsultant.id, mode: authRepository.getAuthMode() }
        });
      },

      updateConsultant: async (id, updates) => {
        await superAdminRepository.updateConsultant(id, updates as any);
        set(state => ({
          consultants: state.consultants.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
        get().saveData();
      },

      deleteConsultant: async (id) => {
        await superAdminRepository.deleteConsultant(id);
        set(state => ({ consultants: state.consultants.filter(c => c.id !== id) }));
        get().saveData();
      },

      // Subscription CRUD
      createSubscription: async (subscription) => {
        const created = await superAdminRepository.createSubscription(subscription as any);
        const newSubscription: Subscription = {
          id: (created as any).id,
          name: created.name,
          price: created.price,
          maxClients: created.maxClients,
          maxReports: created.maxReports,
          storageGB: created.storageGB,
          features: created.features,
        };
        set(state => ({ subscriptions: [...state.subscriptions, newSubscription] }));
        get().saveData();
      },

      updateSubscription: async (id, updates) => {
        await superAdminRepository.updateSubscription(id, updates as any);
        set(state => ({
          subscriptions: state.subscriptions.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
        get().saveData();
      },

      deleteSubscription: async (id) => {
        await superAdminRepository.deleteSubscription(id);
        set(state => ({ subscriptions: state.subscriptions.filter(s => s.id !== id) }));
        get().saveData();
      },

      assignSubscription: async (consultantId, subscriptionId) => {
        await superAdminRepository.assignSubscription(consultantId, subscriptionId);
        const subscription: ConsultantSubscription = {
          id: Date.now().toString(),
          consultantId,
          subscriptionId,
          startDate: new Date().toISOString(),
          status: 'active',
          billingHistory: []
        };
        set(state => ({
          consultantSubscriptions: [...state.consultantSubscriptions, subscription],
          consultants: state.consultants.map(c => c.id === consultantId ? { ...c, subscriptionId, plan: subscriptionId as any } : c)
        }));
        get().saveData();
      },

      // Client CRUD
      createClient: async (client) => {
        const created = await superAdminRepository.createClient(client as any);
        const newClient: Client = {
          id: created.id,
          name: created.name,
          email: created.email,
          consultantId: created.consultantId,
          status: created.status || 'active',
          reportsCount: created.reportsCount || 0,
          lastActivity: created.lastActivity || new Date().toISOString(),
        };
        set(state => ({ clients: [...state.clients, newClient] }));
        get().saveData();
      },

      updateClient: async (id, updates) => {
        await superAdminRepository.updateClient(id, updates as any);
        set(state => ({
          clients: state.clients.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
        get().saveData();
      },

      deleteClient: async (id) => {
        await superAdminRepository.deleteClient(id);
        set(state => ({ clients: state.clients.filter(c => c.id !== id) }));
        get().saveData();
      },

      // Report operations
      createReport: async (report) => {
        const created = await superAdminRepository.createReport(report as any);
        const newReport: Report = {
          id: created.id || Date.now().toString(),
          consultantId: created.consultantId || (report as any).consultantId,
          clientId: created.clientId || (report as any).clientId,
          type: created.type || (report as any).type,
          status: created.status || 'pending',
          createdAt: created.createdAt || new Date().toISOString(),
          approvedAt: created.approvedAt,
        };
        set(state => ({ reports: [...state.reports, newReport] }));
        get().saveData();
      },

      updateReport: async (id, updates) => {
        await superAdminRepository.updateReport(id, updates as any);
        set(state => ({
          reports: state.reports.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
        get().saveData();
      },

  // Feature flags
      updateFeatureFlag: async (id, enabled, consultantIds = []) => {
        // Update local immediately for responsiveness
        set(state => ({
          featureFlags: state.featureFlags.map(f => f.id === id ? { ...f, enabled, consultantIds } : f)
        }));
        get().saveData();
        try {
          await superAdminRepository.updateFeatureFlag(id, enabled, consultantIds);
          return true;
        } catch (e) {
          // Revert on failure in live mode
          const mode = authRepository.getAuthMode();
          if (mode === 'live') {
            set(state => ({
              featureFlags: state.featureFlags.map(f => f.id === id ? { ...f, enabled: !enabled } : f)
            }));
          }
          return false;
        }
      },
      fetchFeatureFlags: async () => {
        // Only meaningful in live mode; in demo, flags are local
        try {
          const mode = authRepository.getAuthMode();
          if (mode === 'live') {
            const flags = await superAdminRepository.listFeatureFlags();
            set(state => ({
              featureFlags: flags.length ? flags as any : state.featureFlags
            }));
          }
        } catch (e) {
          // ignore silently for now
        }
      },

      // Tickets
      createTicket: async (ticket) => {
        const created = await superAdminRepository.createTicket(ticket as any);
        const newTicket: Ticket = {
          id: created.id,
          title: created.subject || created.title || 'Ticket',
          description: created.description,
          consultantId: created.consultantId!,
          priority: created.priority as any,
          status: (created.status as any) || 'open',
          createdAt: created.createdAt,
          resolvedAt: created.resolvedAt,
        };
        set(state => ({ tickets: [...state.tickets, newTicket] }));
        get().saveData();
      },

      updateTicket: async (id, updates) => {
        await superAdminRepository.updateTicket(id, updates as any);
        set(state => ({
          tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        get().saveData();
      },

      // System
      updateSystemHealth: (health) => {
        set(state => ({
          systemHealth: { ...state.systemHealth, ...health, lastChecked: new Date().toISOString() }
        }));
      },

      addAuditLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        };
        set(state => ({
          auditLogs: [...state.auditLogs.slice(-99), newLog] // Keep last 100 logs
        }));
      }
    }),
    {
      name: 'superadmin-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        consultants: state.consultants,
        clients: state.clients,
        subscriptions: state.subscriptions,
        consultantSubscriptions: state.consultantSubscriptions,
        reports: state.reports,
        featureFlags: state.featureFlags,
        tickets: state.tickets,
        auditLogs: state.auditLogs
      })
    }
  )
);