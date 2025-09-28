import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  updateFeatureFlag: (id: string, enabled: boolean, consultantIds?: string[]) => void;

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
      createConsultant: (consultant) => {
        const newConsultant: Consultant = {
          ...consultant,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        set(state => ({ consultants: [...state.consultants, newConsultant] }));
        get().saveData();
        get().addAuditLog({
          userId: get().user?.username || 'system',
          action: 'create_consultant',
          details: { consultantId: newConsultant.id }
        });
      },

      updateConsultant: (id, updates) => {
        set(state => ({
          consultants: state.consultants.map(c =>
            c.id === id ? { ...c, ...updates } : c
          )
        }));
        get().saveData();
      },

      deleteConsultant: (id) => {
        set(state => ({
          consultants: state.consultants.filter(c => c.id !== id)
        }));
        get().saveData();
      },

      // Subscription CRUD
      createSubscription: (subscription) => {
        const newSubscription: Subscription = {
          ...subscription,
          id: Date.now().toString()
        };
        set(state => ({ subscriptions: [...state.subscriptions, newSubscription] }));
        get().saveData();
      },

      updateSubscription: (id, updates) => {
        set(state => ({
          subscriptions: state.subscriptions.map(s =>
            s.id === id ? { ...s, ...updates } : s
          )
        }));
        get().saveData();
      },

      deleteSubscription: (id) => {
        set(state => ({
          subscriptions: state.subscriptions.filter(s => s.id !== id)
        }));
        get().saveData();
      },

      assignSubscription: (consultantId, subscriptionId) => {
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
          consultants: state.consultants.map(c =>
            c.id === consultantId ? { ...c, subscriptionId, plan: subscriptionId as any } : c
          )
        }));
        get().saveData();
      },

      // Client CRUD
      createClient: (client) => {
        const newClient: Client = {
          ...client,
          id: Date.now().toString(),
          lastActivity: new Date().toISOString()
        };
        set(state => ({ clients: [...state.clients, newClient] }));
        get().saveData();
      },

      updateClient: (id, updates) => {
        set(state => ({
          clients: state.clients.map(c =>
            c.id === id ? { ...c, ...updates } : c
          )
        }));
        get().saveData();
      },

      deleteClient: (id) => {
        set(state => ({
          clients: state.clients.filter(c => c.id !== id)
        }));
        get().saveData();
      },

      // Report operations
      createReport: (report) => {
        const newReport: Report = {
          ...report,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        set(state => ({ reports: [...state.reports, newReport] }));
        get().saveData();
      },

      updateReport: (id, updates) => {
        set(state => ({
          reports: state.reports.map(r =>
            r.id === id ? { ...r, ...updates } : r
          )
        }));
        get().saveData();
      },

      // Feature flags
      updateFeatureFlag: (id, enabled, consultantIds = []) => {
        set(state => ({
          featureFlags: state.featureFlags.map(f =>
            f.id === id ? { ...f, enabled, consultantIds } : f
          )
        }));
        get().saveData();
      },

      // Tickets
      createTicket: (ticket) => {
        const newTicket: Ticket = {
          ...ticket,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        set(state => ({ tickets: [...state.tickets, newTicket] }));
        get().saveData();
      },

      updateTicket: (id, updates) => {
        set(state => ({
          tickets: state.tickets.map(t =>
            t.id === id ? { ...t, ...updates } : t
          )
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