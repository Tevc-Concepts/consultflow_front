/**
 * ConsultFlow Database Provider
 * Provides database context and ensures initialization
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { consultFlowDB } from '../api/consultflowDB';
import { useConsultFlowDB, type AuthUser } from '../hooks/useConsultFlowDB';

interface DatabaseContextType {
  isInitialized: boolean;
  isLoading: boolean;
  database: typeof consultFlowDB;
  error?: string;
  reinitialize: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized, isLoading } = useConsultFlowDB();
  const [error, setError] = useState<string>();

  const reinitialize = () => {
    try {
      consultFlowDB.reinitialize();
      setError(undefined);
    } catch (err) {
      console.error('Failed to reinitialize database:', err);
      setError(err instanceof Error ? err.message : 'Failed to reinitialize database');
    }
  };

  const value: DatabaseContextType = {
    isInitialized,
    isLoading,
    database: consultFlowDB,
    error,
    reinitialize,
  };

  // Show loading screen during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold animate-pulse">
            CF
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing ConsultFlow</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-xl flex items-center justify-center text-white text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={reinitialize}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Role-based data loader hook
 * Provides user-specific data based on authentication
 */
export function useRoleBasedData(currentUser: AuthUser | null) {
  const { database } = useDatabaseContext();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!currentUser || !database) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        let roleData: any = {};

        switch (currentUser.role) {
          case 'superadmin':
            // Load all system data for super admin
            roleData = {
              stats: {
                totalConsultants: database.getAllData().consultants?.length || 0,
                totalClients: database.getAllData().clients?.length || 0,
                totalCompanies: database.getAllData().companies?.length || 0,
                totalTickets: database.getAllData().tickets?.length || 0,
              },
              recentActivity: database.getAllData().tickets?.slice(0, 5) || [],
              subscriptionPlans: database.getSubscriptionPlans(),
              systemHealth: 'Operational'
            };
            break;

          case 'consultant':
            // Load consultant-specific data
            const consultantClients = database.getConsultantClients(currentUser.id);
            const consultantTickets = database.getConsultantTickets(currentUser.id);
            
            roleData = {
              clients: consultantClients.map((client: any) => ({
                ...client,
                companies: database.getClientCompanies(client.id)
              })),
              tickets: consultantTickets,
              stats: {
                totalClients: consultantClients.length,
                activeTickets: consultantTickets.filter((t: any) => t.status !== 'closed').length,
                completedReports: database.getAllData().financialReports?.filter((r: any) => 
                  consultantClients.some((c: any) => c.companies.includes(r.companyId)) && 
                  r.status === 'final'
                ).length || 0
              }
            };
            break;

          case 'client':
            // Load client-specific data
            const clientCompanies = database.getClientCompanies(currentUser.id);
            const clientTickets = database.getClientTickets(currentUser.id);
            const clientDocuments = database.getClientDocuments(currentUser.id);

            roleData = {
              companies: clientCompanies.map((company: any) => ({
                ...company,
                reports: database.getCompanyReports(company.id)
              })),
              tickets: clientTickets,
              documents: clientDocuments,
              stats: {
                totalCompanies: clientCompanies.length,
                pendingReports: clientCompanies.reduce((acc: number, company: any) => {
                  const reports = database.getCompanyReports(company.id);
                  return acc + reports.filter((r: any) => r.status === 'draft').length;
                }, 0),
                openTickets: clientTickets.filter((t: any) => t.status === 'open').length
              }
            };
            break;

          default:
            throw new Error(`Unknown role: ${currentUser.role}`);
        }

        setData(roleData);
      } catch (err) {
        console.error('Failed to load role-based data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, database]);

  return { data, isLoading, error, reload: () => setIsLoading(true) };
}