/**
 * ConsultFlow Database Integration Hook
 * Integrates the new consultflowDB with existing authentication system
 */

import { useEffect, useState } from 'react';
import { consultFlowDB } from '../api/consultflowDB';
import type { Consultant, Client, SuperAdmin } from '../api/consultflowDB';

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  role: 'superadmin' | 'consultant' | 'client';
  consultantId?: string; // for clients
  subscriptionPlan?: string; // for consultants
  companies?: string[]; // for clients
}

// Hook to initialize and manage ConsultFlow database
export function useConsultFlowDB() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize database if not already done
    const initDB = async () => {
      try {
        // The database auto-initializes via constructor
        // Just verify it's working
        const data = consultFlowDB.getAllData();
        const hasData = data.consultants && data.consultants.length > 0;
        
        if (hasData) {
          console.log('✅ ConsultFlow database ready with', {
            consultants: data.consultants?.length || 0,
            clients: data.clients?.length || 0,
            companies: data.companies?.length || 0,
            reports: data.financialReports?.length || 0,
            tickets: data.tickets?.length || 0,
            documents: data.documents?.length || 0,
          });
          setIsInitialized(true);
        } else {
          console.warn('⚠️ ConsultFlow database appears empty, reinitializing...');
          consultFlowDB.reinitialize();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('❌ Failed to initialize ConsultFlow database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  return { isInitialized, isLoading };
}

// Authentication helper that works with the new database
export function useConsultFlowAuth() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Login function
  const login = async (email: string, password: string, role?: 'consultant' | 'client' | 'superadmin'): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    setIsAuthLoading(true);
    
    try {
      let user: AuthUser | null = null;

      if (role === 'superadmin' || (!role && email.includes('admin'))) {
        const superAdmin = consultFlowDB.authenticateSuperAdmin(email, password);
        if (superAdmin) {
          user = {
            id: superAdmin.id,
            name: 'Super Administrator',
            email: superAdmin.username,
            role: 'superadmin'
          };
        }
      }

      if (!user && (role === 'consultant' || !role)) {
        const consultant = consultFlowDB.authenticateConsultant(email, password);
        if (consultant) {
          const subscriptionPlans = consultFlowDB.getSubscriptionPlans();
          const plan = subscriptionPlans.find(p => p.id === consultant.subscriptionPlanId);
          
          user = {
            id: consultant.id,
            name: consultant.name,
            email: consultant.email,
            role: 'consultant',
            subscriptionPlan: plan?.name || 'Unknown'
          };
        }
      }

      if (!user && (role === 'client' || !role)) {
        const client = consultFlowDB.authenticateClient(email, password);
        if (client) {
          user = {
            id: client.id,
            name: client.name,
            email: client.email,
            role: 'client',
            consultantId: client.consultantId,
            companies: client.companies
          };
        }
      }

      if (user) {
        setCurrentUser(user);
        // Store in localStorage for persistence
        localStorage.setItem('consultflow:auth:user', JSON.stringify(user));
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('consultflow:auth:user');
  };

  // Initialize from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('consultflow:auth:user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('consultflow:auth:user');
      }
    }
  }, []);

  return {
    currentUser,
    isAuthLoading,
    login,
    logout,
    isAuthenticated: !!currentUser
  };
}

// Data access hooks
export function useConsultantData(consultantId: string) {
  const [clients, setClients] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!consultantId) return;

    const loadData = () => {
      try {
        const consultantClients = consultFlowDB.getConsultantClients(consultantId);
        const consultantTickets = consultFlowDB.getConsultantTickets(consultantId);

        // Enrich clients with company data
        const enrichedClients = consultantClients.map(client => ({
          ...client,
          companyDetails: consultFlowDB.getClientCompanies(client.id)
        }));

        setClients(enrichedClients);
        setTickets(consultantTickets);
      } catch (error) {
        console.error('Failed to load consultant data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [consultantId]);

  return { clients, tickets, isLoading, refresh: () => setIsLoading(true) };
}

export function useClientData(clientId: string) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const loadData = () => {
      try {
        const clientCompanies = consultFlowDB.getClientCompanies(clientId);
        const clientTickets = consultFlowDB.getClientTickets(clientId);
        const clientDocuments = consultFlowDB.getClientDocuments(clientId);

        // Enrich companies with reports
        const enrichedCompanies = clientCompanies.map(company => ({
          ...company,
          reports: consultFlowDB.getCompanyReports(company.id)
        }));

        setCompanies(enrichedCompanies);
        setTickets(clientTickets);
        setDocuments(clientDocuments);
      } catch (error) {
        console.error('Failed to load client data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [clientId]);

  return { companies, tickets, documents, isLoading, refresh: () => setIsLoading(true) };
}

// Demo credentials helper
export const getDemoCredentials = () => {
  return {
    superAdmin: { username: 'admin', password: 'super123' },
    consultants: [
      { email: 'sarah@consultflow.com', password: 'consultant123', name: 'Sarah Wilson' },
      { email: 'michael@africaaccounting.com', password: 'consultant456', name: 'Michael Chen' }
    ],
    clients: [
      { email: 'adebayo@techflownigeria.com', password: 'client123', name: 'Adebayo Okonkwo' },
      { email: 'grace@ealogistics.ke', password: 'client456', name: 'Grace Wanjiku' },
      { email: 'pieter@southernmining.za', password: 'client789', name: 'Pieter van der Merwe' },
      { email: 'fatima@maghrebtrading.ma', password: 'client101', name: 'Fatima El Mansouri' }
    ]
  };
};