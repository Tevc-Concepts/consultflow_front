/**
 * ConsultFlow MVP - LocalStorage Mock Database
 * Complete B2B SaaS accounting/reporting platform schema with seed data
 * API-ready structure stored in LocalStorage for demo purposes
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface SuperAdmin {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  role: 'superadmin';
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: 'Free' | 'Pro' | 'Enterprise';
  price: number; // USD monthly
  maxClients: number;
  maxReports: number;
  maxStorageMB: number;
  features: string[];
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  password: string; // In production, this would be hashed
  subscriptionPlanId: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  clients: string[]; // clientIds
  avatar?: string;
  phone?: string;
  company?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  password: string; // In production, this would be hashed
  consultantId: string;
  companies: string[]; // companyIds
  tickets: string[]; // ticketIds
  documents: string[]; // documentIds
  createdAt: string;
  avatar?: string;
  phone?: string;
  position?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  currency: 'NGN' | 'USD' | 'CFA' | 'KES' | 'ZAR' | 'GHS' | 'MAD';
  clientId: string;
  financialReports: string[]; // reportIds
  createdAt: string;
  country?: string;
  taxId?: string;
  address?: string;
}

export interface FinancialReport {
  id: string;
  companyId: string;
  type: 'Balance Sheet' | 'P&L' | 'Cash Flow' | 'Consolidation' | 'Forecast' | 'Tax Report';
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'under_review';
  createdAt: string;
  reviewedBy?: string; // consultantId
  reviewedAt?: string;
  rejectionReason?: string;
  fileUrl?: string; // mock link
  data?: any; // JSON financial data
}

export interface Ticket {
  id: string;
  clientId: string;
  consultantId?: string; // assigned consultant
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'in_progress' | 'closed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  resolvedAt?: string;
  lastUpdated: string;
  category: 'technical' | 'billing' | 'report' | 'general';
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  authorId: string; // userId (client or consultant)
  authorType: 'client' | 'consultant';
  message: string;
  createdAt: string;
  isInternal: boolean; // internal consultant notes
}

export interface Document {
  id: string;
  clientId: string;
  companyId?: string; // optional company association
  name: string;
  fileUrl: string; // mock link
  fileSize: number; // bytes
  fileType: string; // pdf, xlsx, docx, etc.
  uploadedAt: string;
  sharedWith: string[]; // consultantIds who can access
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewedBy?: string; // consultantId
  reviewNotes?: string;
  category: 'financial' | 'legal' | 'tax' | 'other';
}

// =============================================================================
// MOCK DATABASE CLASS
// =============================================================================

class ConsultFlowMockDB {
  private static instance: ConsultFlowMockDB;
  private readonly STORAGE_KEY = 'consultflow:database:v1';

  private constructor() {
    this.initializeIfEmpty();
  }

  public static getInstance(): ConsultFlowMockDB {
    if (!ConsultFlowMockDB.instance) {
      ConsultFlowMockDB.instance = new ConsultFlowMockDB();
    }
    return ConsultFlowMockDB.instance;
  }

  // =============================================================================
  // STORAGE OPERATIONS
  // =============================================================================

  private getStorage(): any {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setStorage(data: any): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private initializeIfEmpty(): void {
    const existing = this.getStorage();
    if (Object.keys(existing).length === 0) {
      console.log('🚀 Initializing ConsultFlow mock database with seed data...');
      this.seedDatabase();
    }
  }

  // =============================================================================
  // SEED DATA GENERATION
  // =============================================================================

  private seedDatabase(): void {
    const now = new Date().toISOString();
    
    // Subscription Plans
    const subscriptionPlans: SubscriptionPlan[] = [
      {
        id: 'plan-free',
        name: 'Free',
        price: 0,
        maxClients: 2,
        maxReports: 10,
        maxStorageMB: 100,
        features: ['Basic Reports', 'Email Support', '2 Clients Max']
      },
      {
        id: 'plan-pro',
        name: 'Pro',
        price: 49,
        maxClients: 10,
        maxReports: 100,
        maxStorageMB: 1000,
        features: ['Advanced Reports', 'Priority Support', '10 Clients Max', 'Multi-Currency', 'Document Sharing']
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        price: 149,
        maxClients: -1, // unlimited
        maxReports: -1, // unlimited
        maxStorageMB: 10000,
        features: ['All Reports', '24/7 Support', 'Unlimited Clients', 'API Access', 'White Label', 'Advanced Analytics']
      }
    ];

    // SuperAdmin
    const superAdmin: SuperAdmin = {
      id: 'superadmin-1',
      username: 'admin',
      password: 'super123', // In production: hash this
      role: 'superadmin',
      createdAt: now
    };

    // Consultants
    const consultants: Consultant[] = [
      {
        id: 'consultant-1',
        name: 'Sarah Wilson',
        email: 'sarah@consultflow.com',
        password: 'consultant123',
        subscriptionPlanId: 'plan-pro',
        status: 'active',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        clients: ['client-1', 'client-2'],
        avatar: '/avatars/sarah.jpg',
        phone: '+234-801-234-5678',
        company: 'Wilson Accounting Services'
      },
      {
        id: 'consultant-2',
        name: 'Michael Chen',
        email: 'michael@africaaccounting.com',
        password: 'consultant456',
        subscriptionPlanId: 'plan-enterprise',
        status: 'active',
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        clients: ['client-3', 'client-4'],
        avatar: '/avatars/michael.jpg',
        phone: '+27-11-987-6543',
        company: 'Africa Accounting Group'
      }
    ];

    // Clients
    const clients: Client[] = [
      {
        id: 'client-1',
        name: 'Adebayo Okonkwo',
        email: 'adebayo@techflownigeria.com',
        password: 'client123',
        consultantId: 'consultant-1',
        companies: ['company-1'],
        tickets: ['ticket-1'],
        documents: ['doc-1', 'doc-2'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        avatar: '/avatars/adebayo.jpg',
        phone: '+234-803-456-7890',
        position: 'CEO'
      },
      {
        id: 'client-2',
        name: 'Grace Wanjiku',
        email: 'grace@ealogistics.ke',
        password: 'client456',
        consultantId: 'consultant-1',
        companies: ['company-2', 'company-3'],
        tickets: ['ticket-2'],
        documents: ['doc-3'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        avatar: '/avatars/grace.jpg',
        phone: '+254-20-123-4567',
        position: 'CFO'
      },
      {
        id: 'client-3',
        name: 'Pieter van der Merwe',
        email: 'pieter@southernmining.za',
        password: 'client789',
        consultantId: 'consultant-2',
        companies: ['company-4'],
        tickets: ['ticket-3'],
        documents: ['doc-4', 'doc-5'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        avatar: '/avatars/pieter.jpg',
        phone: '+27-21-987-6543',
        position: 'Financial Director'
      },
      {
        id: 'client-4',
        name: 'Fatima El Mansouri',
        email: 'fatima@maghrebtrading.ma',
        password: 'client101',
        consultantId: 'consultant-2',
        companies: ['company-5', 'company-6'],
        tickets: ['ticket-4', 'ticket-5'],
        documents: ['doc-6'],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        avatar: '/avatars/fatima.jpg',
        phone: '+212-522-345-678',
        position: 'Managing Director'
      }
    ];

    // Companies
    const companies: Company[] = [
      {
        id: 'company-1',
        name: 'TechFlow Nigeria Ltd',
        industry: 'Technology',
        currency: 'NGN',
        clientId: 'client-1',
        financialReports: ['report-1', 'report-2'],
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        country: 'Nigeria',
        taxId: 'TIN-123456789',
        address: 'Victoria Island, Lagos, Nigeria'
      },
      {
        id: 'company-2',
        name: 'East Africa Logistics Co',
        industry: 'Logistics',
        currency: 'KES',
        clientId: 'client-2',
        financialReports: ['report-3'],
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        country: 'Kenya',
        taxId: 'KRA-987654321',
        address: 'Nairobi, Kenya'
      },
      {
        id: 'company-3',
        name: 'Wanjiku Consultancy',
        industry: 'Professional Services',
        currency: 'USD',
        clientId: 'client-2',
        financialReports: ['report-4'],
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        country: 'Kenya',
        taxId: 'KRA-456789123',
        address: 'Westlands, Nairobi, Kenya'
      },
      {
        id: 'company-4',
        name: 'Southern Mining Corp',
        industry: 'Mining',
        currency: 'ZAR',
        clientId: 'client-3',
        financialReports: ['report-5', 'report-6'],
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        country: 'South Africa',
        taxId: 'SARS-789123456',
        address: 'Johannesburg, South Africa'
      },
      {
        id: 'company-5',
        name: 'Maghreb Trading SARL',
        industry: 'Trading',
        currency: 'MAD',
        clientId: 'client-4',
        financialReports: ['report-7'],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        country: 'Morocco',
        taxId: 'ICE-123789456',
        address: 'Casablanca, Morocco'
      },
      {
        id: 'company-6',
        name: 'Atlas Import Export',
        industry: 'Import/Export',
        currency: 'CFA',
        clientId: 'client-4',
        financialReports: ['report-8', 'report-9'],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        country: 'Senegal',
        taxId: 'NINEA-456123789',
        address: 'Dakar, Senegal'
      }
    ];

    // Financial Reports
    const financialReports: FinancialReport[] = [
      // TechFlow Nigeria Ltd
      {
        id: 'report-1',
        companyId: 'company-1',
        type: 'Balance Sheet',
        currency: 'NGN',
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
        status: 'approved',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'consultant-1',
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fileUrl: '/reports/techflow-balance-sheet-2024.pdf'
      },
      {
        id: 'report-2',
        companyId: 'company-1',
        type: 'P&L',
        currency: 'NGN',
        periodStart: '2024-09-01',
        periodEnd: '2024-09-30',
        status: 'submitted',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        fileUrl: '/reports/techflow-pl-sep2024.pdf'
      },
      // East Africa Logistics
      {
        id: 'report-3',
        companyId: 'company-2',
        type: 'Cash Flow',
        currency: 'KES',
        periodStart: '2024-07-01',
        periodEnd: '2024-09-30',
        status: 'under_review',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'consultant-1',
        fileUrl: '/reports/eal-cashflow-q3-2024.pdf'
      },
      // Wanjiku Consultancy
      {
        id: 'report-4',
        companyId: 'company-3',
        type: 'P&L',
        currency: 'USD',
        periodStart: '2024-08-01',
        periodEnd: '2024-08-31',
        status: 'approved',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'consultant-1',
        reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        fileUrl: '/reports/wanjiku-pl-aug2024.pdf'
      },
      // Southern Mining Corp
      {
        id: 'report-5',
        companyId: 'company-4',
        type: 'Balance Sheet',
        currency: 'ZAR',
        periodStart: '2024-06-01',
        periodEnd: '2024-06-30',
        status: 'rejected',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'consultant-2',
        reviewedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        rejectionReason: 'Missing depreciation schedules for mining equipment',
        fileUrl: '/reports/southern-mining-bs-jun2024.pdf'
      },
      {
        id: 'report-6',
        companyId: 'company-4',
        type: 'Forecast',
        currency: 'ZAR',
        periodStart: '2024-10-01',
        periodEnd: '2025-03-31',
        status: 'draft',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        fileUrl: '/reports/southern-mining-forecast-h1-2025.pdf'
      },
      // Maghreb Trading
      {
        id: 'report-7',
        companyId: 'company-5',
        type: 'P&L',
        currency: 'MAD',
        periodStart: '2024-08-01',
        periodEnd: '2024-08-31',
        status: 'approved',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'consultant-2',
        reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        fileUrl: '/reports/maghreb-pl-aug2024.pdf'
      },
      // Atlas Import Export
      {
        id: 'report-8',
        companyId: 'company-6',
        type: 'Cash Flow',
        currency: 'CFA',
        periodStart: '2024-07-01',
        periodEnd: '2024-09-30',
        status: 'submitted',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        fileUrl: '/reports/atlas-cashflow-q3-2024.pdf'
      },
      {
        id: 'report-9',
        companyId: 'company-6',
        type: 'Tax Report',
        currency: 'CFA',
        periodStart: '2024-01-01',
        periodEnd: '2024-09-30',
        status: 'under_review',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'consultant-2',
        fileUrl: '/reports/atlas-tax-ytd-2024.pdf'
      }
    ];

    // Support Tickets with Responses
    const tickets: Ticket[] = [
      {
        id: 'ticket-1',
        clientId: 'client-1',
        consultantId: 'consultant-1',
        subject: 'Unable to generate P&L report',
        description: 'When I try to generate the monthly P&L report, the system shows an error. Need urgent help as board meeting is tomorrow.',
        status: 'in_progress',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'technical',
        responses: [
          {
            id: 'response-1',
            ticketId: 'ticket-1',
            authorId: 'consultant-1',
            authorType: 'consultant',
            message: 'I can see the issue. There seems to be missing data for some expense categories. Let me check the data source and fix this for you.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isInternal: false
          }
        ]
      },
      {
        id: 'ticket-2',
        clientId: 'client-2',
        consultantId: 'consultant-1',
        subject: 'Multi-currency consolidation query',
        description: 'How do I handle the currency conversion for consolidating my two companies? One is in KES and the other in USD.',
        status: 'resolved',
        priority: 'medium',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'general',
        responses: [
          {
            id: 'response-2',
            ticketId: 'ticket-2',
            authorId: 'consultant-1',
            authorType: 'consultant',
            message: 'For multi-currency consolidation, we use the closing rate method. I\'ll prepare a detailed guide and send it to you.',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            isInternal: false
          },
          {
            id: 'response-3',
            ticketId: 'ticket-2',
            authorId: 'client-2',
            authorType: 'client',
            message: 'Perfect! That guide was very helpful. The consolidation is working correctly now. Thank you!',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            isInternal: false
          }
        ]
      },
      {
        id: 'ticket-3',
        clientId: 'client-3',
        consultantId: 'consultant-2',
        subject: 'Mining depreciation calculations',
        description: 'Need clarification on the depreciation method for mining equipment. The current calculation seems incorrect.',
        status: 'open',
        priority: 'medium',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'report',
        responses: []
      },
      {
        id: 'ticket-4',
        clientId: 'client-4',
        consultantId: 'consultant-2',
        subject: 'Monthly subscription billing',
        description: 'I was charged twice this month. Can you please check my billing and refund the duplicate charge?',
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'billing',
        responses: []
      },
      {
        id: 'ticket-5',
        clientId: 'client-4',
        consultantId: 'consultant-2',
        subject: 'Document upload limit',
        description: 'I\'m getting an error when trying to upload documents. Says I\'ve reached my limit but I only have 3 files uploaded.',
        status: 'closed',
        priority: 'low',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'technical',
        responses: [
          {
            id: 'response-4',
            ticketId: 'ticket-5',
            authorId: 'consultant-2',
            authorType: 'consultant',
            message: 'I\'ve checked your account and increased your storage limit. The issue was a temporary cache problem. Try uploading now.',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            isInternal: false
          }
        ]
      }
    ];

    // Documents
    const documents: Document[] = [
      {
        id: 'doc-1',
        clientId: 'client-1',
        companyId: 'company-1',
        name: 'Bank Statement - September 2024.pdf',
        fileUrl: '/documents/techflow-bank-statement-sep2024.pdf',
        fileSize: 1024000, // 1MB
        fileType: 'pdf',
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        sharedWith: ['consultant-1'],
        status: 'reviewed',
        reviewedBy: 'consultant-1',
        reviewNotes: 'Bank statement received and processed. All transactions verified.',
        category: 'financial'
      },
      {
        id: 'doc-2',
        clientId: 'client-1',
        companyId: 'company-1',
        name: 'Expense Receipts - Q3 2024.xlsx',
        fileUrl: '/documents/techflow-expenses-q3-2024.xlsx',
        fileSize: 512000, // 512KB
        fileType: 'xlsx',
        uploadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        sharedWith: ['consultant-1'],
        status: 'approved',
        reviewedBy: 'consultant-1',
        category: 'financial'
      },
      {
        id: 'doc-3',
        clientId: 'client-2',
        companyId: 'company-2',
        name: 'Tax Certificate 2024.pdf',
        fileUrl: '/documents/eal-tax-cert-2024.pdf',
        fileSize: 256000, // 256KB
        fileType: 'pdf',
        uploadedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        sharedWith: ['consultant-1'],
        status: 'approved',
        reviewedBy: 'consultant-1',
        category: 'tax'
      },
      {
        id: 'doc-4',
        clientId: 'client-3',
        companyId: 'company-4',
        name: 'Mining License Renewal.docx',
        fileUrl: '/documents/southern-mining-license.docx',
        fileSize: 128000, // 128KB
        fileType: 'docx',
        uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        sharedWith: ['consultant-2'],
        status: 'pending',
        category: 'legal'
      },
      {
        id: 'doc-5',
        clientId: 'client-3',
        companyId: 'company-4',
        name: 'Equipment Purchase Invoices.pdf',
        fileUrl: '/documents/southern-mining-equipment-invoices.pdf',
        fileSize: 2048000, // 2MB
        fileType: 'pdf',
        uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        sharedWith: ['consultant-2'],
        status: 'rejected',
        reviewedBy: 'consultant-2',
        reviewNotes: 'Please provide supporting documentation for depreciation schedules.',
        category: 'financial'
      },
      {
        id: 'doc-6',
        clientId: 'client-4',
        companyId: 'company-5',
        name: 'Trade Agreement Contract.pdf',
        fileUrl: '/documents/maghreb-trade-agreement.pdf',
        fileSize: 1536000, // 1.5MB
        fileType: 'pdf',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sharedWith: ['consultant-2'],
        status: 'reviewed',
        reviewedBy: 'consultant-2',
        reviewNotes: 'Contract reviewed. Please ensure all regulatory compliance requirements are met.',
        category: 'legal'
      }
    ];

    // Save all data to localStorage
    const database = {
      superAdmins: [superAdmin],
      subscriptionPlans,
      consultants,
      clients,
      companies,
      financialReports,
      tickets,
      documents,
      metadata: {
        version: '1.0',
        createdAt: now,
        lastUpdated: now
      }
    };

    this.setStorage(database);
    console.log('✅ ConsultFlow mock database initialized successfully!');
  }

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  public getConsultantClients(consultantId: string): Client[] {
    const data = this.getStorage();
    const clients: Client[] = data.clients || [];
    return clients.filter(client => client.consultantId === consultantId);
  }

  public getClientCompanies(clientId: string): Company[] {
    const data = this.getStorage();
    const companies: Company[] = data.companies || [];
    return companies.filter(company => company.clientId === clientId);
  }

  public getCompanyReports(companyId: string): FinancialReport[] {
    const data = this.getStorage();
    const reports: FinancialReport[] = data.financialReports || [];
    return reports.filter(report => report.companyId === companyId);
  }

  public getClientTickets(clientId: string): Ticket[] {
    const data = this.getStorage();
    const tickets: Ticket[] = data.tickets || [];
    return tickets.filter(ticket => ticket.clientId === clientId);
  }

  public getClientDocuments(clientId: string): Document[] {
    const data = this.getStorage();
    const documents: Document[] = data.documents || [];
    return documents.filter(document => document.clientId === clientId);
  }

  public getConsultantTickets(consultantId: string): Ticket[] {
    const data = this.getStorage();
    const tickets: Ticket[] = data.tickets || [];
    return tickets.filter(ticket => ticket.consultantId === consultantId);
  }

  // Authentication helpers
  public authenticateConsultant(email: string, password: string): Consultant | null {
    const data = this.getStorage();
    const consultants: Consultant[] = data.consultants || [];
    return consultants.find(c => c.email === email && c.password === password) || null;
  }

  public authenticateClient(email: string, password: string): Client | null {
    const data = this.getStorage();
    const clients: Client[] = data.clients || [];
    return clients.find(c => c.email === email && c.password === password) || null;
  }

  public authenticateSuperAdmin(username: string, password: string): SuperAdmin | null {
    const data = this.getStorage();
    const superAdmins: SuperAdmin[] = data.superAdmins || [];
    return superAdmins.find(s => s.username === username && s.password === password) || null;
  }

  // Data retrieval methods
  public getAllData() {
    return this.getStorage();
  }

  public getSubscriptionPlans(): SubscriptionPlan[] {
    const data = this.getStorage();
    return data.subscriptionPlans || [];
  }

  public getConsultantById(id: string): Consultant | null {
    const data = this.getStorage();
    const consultants: Consultant[] = data.consultants || [];
    return consultants.find(c => c.id === id) || null;
  }

  public getClientById(id: string): Client | null {
    const data = this.getStorage();
    const clients: Client[] = data.clients || [];
    return clients.find(c => c.id === id) || null;
  }

  public getCompanyById(id: string): Company | null {
    const data = this.getStorage();
    const companies: Company[] = data.companies || [];
    return companies.find(c => c.id === id) || null;
  }

  // Update methods
  public updateTicketStatus(ticketId: string, status: Ticket['status']): boolean {
    const data = this.getStorage();
    const tickets: Ticket[] = data.tickets || [];
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) return false;
    
    tickets[ticketIndex].status = status;
    tickets[ticketIndex].lastUpdated = new Date().toISOString();
    
    if (status === 'resolved' || status === 'closed') {
      tickets[ticketIndex].resolvedAt = new Date().toISOString();
    }
    
    this.setStorage({ ...data, tickets });
    return true;
  }

  public addTicketResponse(ticketId: string, response: Omit<TicketResponse, 'id'>): boolean {
    const data = this.getStorage();
    const tickets: Ticket[] = data.tickets || [];
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) return false;
    
    const newResponse: TicketResponse = {
      ...response,
      id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    tickets[ticketIndex].responses.push(newResponse);
    tickets[ticketIndex].lastUpdated = new Date().toISOString();
    
    this.setStorage({ ...data, tickets });
    return true;
  }

  public updateDocumentStatus(documentId: string, status: Document['status'], reviewNotes?: string): boolean {
    const data = this.getStorage();
    const documents: Document[] = data.documents || [];
    const docIndex = documents.findIndex(d => d.id === documentId);
    
    if (docIndex === -1) return false;
    
    documents[docIndex].status = status;
    if (reviewNotes) {
      documents[docIndex].reviewNotes = reviewNotes;
    }
    
    this.setStorage({ ...data, documents });
    return true;
  }

  // Clear database (for testing)
  public clearDatabase(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Force re-initialization
  public reinitialize(): void {
    this.clearDatabase();
    this.initializeIfEmpty();
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const consultFlowDB = ConsultFlowMockDB.getInstance();

// Export helper functions for easy access
export const {
  getConsultantClients,
  getClientCompanies,
  getCompanyReports,
  getClientTickets,
  getClientDocuments,
  getConsultantTickets,
  authenticateConsultant,
  authenticateClient,
  authenticateSuperAdmin,
  getAllData,
  getSubscriptionPlans,
  getConsultantById,
  getClientById,
  getCompanyById,
  updateTicketStatus,
  addTicketResponse,
  updateDocumentStatus,
  clearDatabase,
  reinitialize
} = consultFlowDB;

export default consultFlowDB;