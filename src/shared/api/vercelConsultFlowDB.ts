/**
 * Vercel-Compatible ConsultFlow Database
 * Complete entity relationships and data structure for serverless deployment
 * Mirrors the LocalStorage consultflowDB.ts but works in stateless serverless functions
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// TYPE DEFINITIONS (Mirror consultflowDB.ts)
// =============================================================================

export interface SuperAdmin {
  id: string;
  username: string;
  password: string;
  role: 'superadmin';
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: 'Free' | 'Pro' | 'Enterprise';
  price: number;
  maxClients: number;
  maxReports: number;
  maxStorageMB: number;
  features: string[];
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  password: string;
  subscriptionPlanId: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  clients: string[];
  avatar?: string;
  phone?: string;
  company?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  password: string;
  consultantId: string;
  companies: string[];
  tickets: string[];
  documents: string[];
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
  financialReports: string[];
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
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  fileUrl?: string;
  data?: any;
}

export interface Ticket {
  id: string;
  clientId: string;
  consultantId?: string;
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
  responderId: string; // consultant or client ID
  responderType: 'consultant' | 'client';
  message: string;
  createdAt: string;
  isInternal: boolean;
}

export interface Document {
  id: string;
  companyId: string;
  uploadedBy: string; // clientId
  fileName: string;
  fileType: string;
  fileSizeMB: number;
  description?: string;
  status: 'uploaded' | 'under_review' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedBy?: string; // consultantId
  reviewedAt?: string;
  reviewNotes?: string;
  downloadUrl?: string; // mock URL
}

// =============================================================================
// COMPLETE DEMO DATA (Mirror consultflowDB.ts seed data)
// =============================================================================

class VercelConsultFlowDB {
  private static instance: VercelConsultFlowDB;
  
  // Complete data structure matching LocalStorage version
  private data = {
    superAdmins: [
      {
        id: 'superadmin-1',
        username: 'admin',
        password: 'super123',
        role: 'superadmin' as const,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ] as SuperAdmin[],

    subscriptionPlans: [
      {
        id: 'plan-pro',
        name: 'Pro' as const,
        price: 99,
        maxClients: 25,
        maxReports: 100,
        maxStorageMB: 1000,
        features: ['Financial Reports', 'Client Portal', 'Multi-Currency', 'Email Support']
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise' as const,
        price: 299,
        maxClients: -1, // unlimited
        maxReports: -1, // unlimited
        maxStorageMB: 5000,
        features: ['All Pro Features', 'Custom Reports', 'API Access', 'Priority Support', 'White Label']
      }
    ] as SubscriptionPlan[],

    consultants: [
      {
        id: 'consultant-sarah',
        name: 'Sarah Wilson',
        email: 'sarah@consultflow.com',
        password: 'consultant123',
        subscriptionPlanId: 'plan-pro',
        status: 'active' as const,
        createdAt: '2024-01-15T10:30:00Z',
        clients: ['client-adebayo', 'client-grace'],
        avatar: '👩‍💼',
        phone: '+1-555-0123',
        company: 'ConsultFlow Advisory'
      },
      {
        id: 'consultant-michael',
        name: 'Michael Chen',
        email: 'michael@africaaccounting.com',
        password: 'consultant456',
        subscriptionPlanId: 'plan-enterprise',
        status: 'active' as const,
        createdAt: '2024-02-01T14:00:00Z',
        clients: ['client-pieter', 'client-fatima'],
        avatar: '👨‍💻',
        phone: '+27-11-555-0456',
        company: 'Africa Accounting Partners'
      }
    ] as Consultant[],

    clients: [
      {
        id: 'client-adebayo',
        name: 'Adebayo Okonkwo',
        email: 'adebayo@techflownigeria.com',
        password: 'client123',
        consultantId: 'consultant-sarah',
        companies: ['company-techflow-ng'],
        tickets: ['ticket-001', 'ticket-002'],
        documents: ['doc-001', 'doc-002'],
        createdAt: '2024-03-01T09:00:00Z',
        avatar: '👨‍💼',
        phone: '+234-803-555-0789',
        position: 'CEO & Founder'
      },
      {
        id: 'client-grace',
        name: 'Grace Wanjiku',
        email: 'grace@ealogistics.ke',
        password: 'client456',
        consultantId: 'consultant-sarah',
        companies: ['company-ealogistics-ke'],
        tickets: ['ticket-003'],
        documents: ['doc-003', 'doc-004'],
        createdAt: '2024-03-15T11:30:00Z',
        avatar: '👩‍💼',
        phone: '+254-20-555-0123',
        position: 'CFO'
      },
      {
        id: 'client-pieter',
        name: 'Pieter van der Merwe',
        email: 'pieter@southernmining.za',
        password: 'client789',
        consultantId: 'consultant-michael',
        companies: ['company-southern-za', 'company-mining-operations-za'],
        tickets: ['ticket-004', 'ticket-005'],
        documents: ['doc-005'],
        createdAt: '2024-04-01T08:15:00Z',
        avatar: '👨‍🏭',
        phone: '+27-21-555-0987',
        position: 'Operations Director'
      },
      {
        id: 'client-fatima',
        name: 'Fatima El Mansouri',
        email: 'fatima@maghrebtrading.ma',
        password: 'client101',
        consultantId: 'consultant-michael',
        companies: ['company-maghreb-ma'],
        tickets: [],
        documents: ['doc-006'],
        createdAt: '2024-04-15T16:45:00Z',
        avatar: '👩‍💻',
        phone: '+212-522-555-0234',
        position: 'Managing Director'
      }
    ] as Client[],

    companies: [
      {
        id: 'company-techflow-ng',
        name: 'TechFlow Nigeria Ltd',
        industry: 'Technology',
        currency: 'NGN' as const,
        clientId: 'client-adebayo',
        financialReports: ['report-001', 'report-002', 'report-003'],
        createdAt: '2024-03-01T09:30:00Z',
        country: 'Nigeria',
        taxId: 'NG-12345678',
        address: 'Lagos, Nigeria'
      },
      {
        id: 'company-ealogistics-ke',
        name: 'East Africa Logistics Co',
        industry: 'Logistics',
        currency: 'KES' as const,
        clientId: 'client-grace',
        financialReports: ['report-004', 'report-005'],
        createdAt: '2024-03-15T12:00:00Z',
        country: 'Kenya',
        taxId: 'KE-A987654321',
        address: 'Nairobi, Kenya'
      },
      {
        id: 'company-southern-za',
        name: 'Southern Mining Corp',
        industry: 'Mining',
        currency: 'ZAR' as const,
        clientId: 'client-pieter',
        financialReports: ['report-006', 'report-007'],
        createdAt: '2024-04-01T08:30:00Z',
        country: 'South Africa',
        taxId: 'ZA-2024/123456/07',
        address: 'Cape Town, South Africa'
      },
      {
        id: 'company-mining-operations-za',
        name: 'Mining Operations SA',
        industry: 'Mining',
        currency: 'ZAR' as const,
        clientId: 'client-pieter',
        financialReports: ['report-008'],
        createdAt: '2024-04-01T08:45:00Z',
        country: 'South Africa',
        taxId: 'ZA-2024/789012/07',
        address: 'Johannesburg, South Africa'
      },
      {
        id: 'company-maghreb-ma',
        name: 'Maghreb Trading SARL',
        industry: 'Trading',
        currency: 'MAD' as const,
        clientId: 'client-fatima',
        financialReports: ['report-009'],
        createdAt: '2024-04-15T17:00:00Z',
        country: 'Morocco',
        taxId: 'MA-12345678',
        address: 'Casablanca, Morocco'
      }
    ] as Company[],

    financialReports: [
      {
        id: 'report-001',
        companyId: 'company-techflow-ng',
        type: 'P&L' as const,
        currency: 'NGN',
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        status: 'approved' as const,
        createdAt: '2024-02-05T10:00:00Z',
        reviewedBy: 'consultant-sarah',
        reviewedAt: '2024-02-06T14:30:00Z',
        data: { revenue: 45000000, expenses: 32000000, netIncome: 13000000 }
      },
      {
        id: 'report-002',
        companyId: 'company-techflow-ng',
        type: 'Balance Sheet' as const,
        currency: 'NGN',
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        status: 'approved' as const,
        createdAt: '2024-02-05T10:30:00Z',
        reviewedBy: 'consultant-sarah',
        reviewedAt: '2024-02-06T15:00:00Z',
        data: { assets: 125000000, liabilities: 45000000, equity: 80000000 }
      },
      // ... more reports following the same pattern
    ] as FinancialReport[],

    tickets: [
      {
        id: 'ticket-001',
        clientId: 'client-adebayo',
        consultantId: 'consultant-sarah',
        subject: 'Monthly P&L Report Review Request',
        description: 'Please review our January P&L report. We have some questions about the expense categorization.',
        status: 'resolved' as const,
        priority: 'medium' as const,
        createdAt: '2024-02-07T09:15:00Z',
        resolvedAt: '2024-02-08T16:30:00Z',
        lastUpdated: '2024-02-08T16:30:00Z',
        category: 'report' as const,
        responses: [
          {
            id: 'response-001',
            ticketId: 'ticket-001',
            responderId: 'consultant-sarah',
            responderType: 'consultant' as const,
            message: 'I\'ve reviewed your P&L report. The expense categorization looks correct. Let me explain each category...',
            createdAt: '2024-02-07T14:20:00Z',
            isInternal: false
          }
        ]
      },
      // ... more tickets
    ] as Ticket[],

    documents: [
      {
        id: 'doc-001',
        companyId: 'company-techflow-ng',
        uploadedBy: 'client-adebayo',
        fileName: 'Bank_Statement_Jan_2024.pdf',
        fileType: 'application/pdf',
        fileSizeMB: 2.3,
        description: 'January 2024 bank statement for reconciliation',
        status: 'approved' as const,
        uploadedAt: '2024-02-01T10:00:00Z',
        reviewedBy: 'consultant-sarah',
        reviewedAt: '2024-02-02T09:30:00Z',
        reviewNotes: 'All transactions verified and categorized correctly.',
        downloadUrl: '/api/documents/doc-001/download'
      },
      // ... more documents
    ] as Document[]
  };

  static getInstance(): VercelConsultFlowDB {
    if (!VercelConsultFlowDB.instance) {
      VercelConsultFlowDB.instance = new VercelConsultFlowDB();
    }
    return VercelConsultFlowDB.instance;
  }

  // =============================================================================
  // QUERY METHODS (Mirror consultflowDB.ts API)
  // =============================================================================

  getAllData() {
    return { ...this.data };
  }

  getSubscriptionPlans() {
    return this.data.subscriptionPlans;
  }

  authenticateSuperAdmin(username: string, password: string) {
    return this.data.superAdmins.find(admin => 
      admin.username === username && admin.password === password
    );
  }

  authenticateConsultant(email: string, password: string) {
    return this.data.consultants.find(consultant => 
      consultant.email === email && consultant.password === password
    );
  }

  authenticateClient(email: string, password: string) {
    return this.data.clients.find(client => 
      client.email === email && client.password === password
    );
  }

  getConsultantClients(consultantId: string) {
    return this.data.clients.filter(client => client.consultantId === consultantId);
  }

  getClientCompanies(clientId: string) {
    const client = this.data.clients.find(c => c.id === clientId);
    if (!client) return [];
    return this.data.companies.filter(company => client.companies.includes(company.id));
  }

  getCompanyReports(companyId: string) {
    return this.data.financialReports.filter(report => report.companyId === companyId);
  }

  getClientTickets(clientId: string) {
    return this.data.tickets.filter(ticket => ticket.clientId === clientId);
  }

  getConsultantTickets(consultantId: string) {
    return this.data.tickets.filter(ticket => ticket.consultantId === consultantId);
  }

  getClientDocuments(clientId: string) {
    const client = this.data.clients.find(c => c.id === clientId);
    if (!client) return [];
    return this.data.documents.filter(doc => client.documents.includes(doc.id));
  }

  getCompanyDocuments(companyId: string) {
    return this.data.documents.filter(doc => doc.companyId === companyId);
  }

  // Generate financial series data (like LocalStorage version)
  generateFinancialSeries(companyIds: string[], months: number = 24) {
    const series: any[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toISOString().slice(0, 7);

      companyIds.forEach(companyId => {
        const company = this.data.companies.find(c => c.id === companyId);
        if (!company) return;

        // Generate realistic financial data based on company
        const baseMultiplier = this.getCompanyFinancialMultiplier(companyId);
        const seasonalFactor = 1 + 0.1 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
        const growthFactor = 1 + (0.05 * (months - i - 1) / months);
        const randomFactor = 0.9 + Math.random() * 0.2;

        const revenue = Math.round(baseMultiplier.revenue * seasonalFactor * growthFactor * randomFactor);
        const cogs = Math.round(revenue * 0.6 * randomFactor);
        const expenses = Math.round(revenue * 0.25 * randomFactor);

        series.push({
          company_id: companyId,
          posting_date: monthYear + '-01',
          revenue,
          cogs,
          expenses,
          net_income: revenue - cogs - expenses,
          cash: Math.round(baseMultiplier.cash * growthFactor * randomFactor),
          currency: company.currency
        });
      });
    }

    return series;
  }

  private getCompanyFinancialMultiplier(companyId: string) {
    const multipliers: Record<string, { revenue: number; cash: number }> = {
      'company-techflow-ng': { revenue: 25_000_000, cash: 45_000_000 }, // NGN
      'company-ealogistics-ke': { revenue: 8_500_000, cash: 2_800_000 }, // KES
      'company-southern-za': { revenue: 1_800_000, cash: 850_000 }, // ZAR
      'company-mining-operations-za': { revenue: 2_200_000, cash: 1_100_000 }, // ZAR
      'company-maghreb-ma': { revenue: 850_000, cash: 420_000 } // MAD
    };
    return multipliers[companyId] || { revenue: 1_000_000, cash: 500_000 };
  }
}

export const vercelConsultFlowDB = VercelConsultFlowDB.getInstance();