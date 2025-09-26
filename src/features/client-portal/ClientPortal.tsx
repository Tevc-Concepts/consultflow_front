/**
 * Main Client Portal Interface
 * Responsive tab layout with Documents, Reports, and Support sections
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useAuthStore } from '@features/auth/store';
import { useNotifications } from '@shared/state/notifications';
import { useClientStore } from './store';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ReportCards from './components/ReportCards';
import CreateTicket from './components/CreateTicket';
import TicketList from './components/TicketList';
import TicketDetailModal from './components/TicketDetailModal';

type TabKey = 'documents' | 'reports' | 'support';

const tabs = [
  {
    key: 'documents' as TabKey,
    label: 'Documents',
    icon: '📄',
    description: 'Upload and manage your documents'
  },
  {
    key: 'reports' as TabKey,
    label: 'Reports',
    icon: '📊',
    description: 'Review and approve financial reports'
  },
  {
    key: 'support' as TabKey,
    label: 'Support',
    icon: '🎫',
    description: 'Get help and manage support tickets'
  }
];

export default function ClientPortal() {
  const { user } = useAuthStore();
  const role = user?.role;
  const notify = useNotifications(s => s.add);
  
  const { activeTab, setActiveTab, activeTicket, seedDemoData } = useClientStore();
  const [hasSeededData, setHasSeededData] = React.useState(false);
  const [showCreateTicket, setShowCreateTicket] = React.useState(false);

  // Get current company ID from user or default
  const currentCompanyId = user?.company || user?.id || 'demo-company-1';

  // Seed demo data once
  React.useEffect(() => {
    if (!hasSeededData && currentCompanyId) {
      seedDemoData(currentCompanyId);
      setHasSeededData(true);
    }
  }, [currentCompanyId, hasSeededData, seedDemoData]);

  // Handle toast notifications
  React.useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { title, message, type } = event.detail;
      notify({
        title,
        message,
        kind: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'
      });
    };

    window.addEventListener('show-toast', handleToast as EventListener);
    return () => window.removeEventListener('show-toast', handleToast as EventListener);
  }, [notify]);

  // Redirect non-clients
  React.useEffect(() => {
    if (role && role !== 'client') {
      notify({ 
        title: 'Access Restricted', 
        message: 'Client portal is only available for client users.', 
        kind: 'warning' 
      });
    }
  }, [role, notify]);

  if (role !== 'client') {
    return (
      <div className="container py-6 space-y-4">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-semibold text-deep-navy mb-2">Access Restricted</h1>
          <p className="text-deep-navy/70 mb-4">This page is only available for client users.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div className="space-y-6">
            <DocumentUpload
              companyId={currentCompanyId}
              onUploadComplete={() => {
                // Optionally refresh document list or show success message
                console.log('Document uploaded successfully');
              }}
            />
            <DocumentList companyId={currentCompanyId} />
          </div>
        );
      
      case 'reports':
        return (
          <ReportCards companyId={currentCompanyId} />
        );
      
      case 'support':
        return (
          <div className="space-y-6">
            {showCreateTicket ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-deep-navy">Create New Ticket</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreateTicket(false)}
                    className="text-deep-navy/60 hover:text-deep-navy"
                  >
                    ← Back to Tickets
                  </Button>
                </div>
                <CreateTicket
                  companyId={currentCompanyId}
                  onTicketCreated={() => {
                    setShowCreateTicket(false);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-deep-navy">Support Tickets</h2>
                  <Button
                    onClick={() => setShowCreateTicket(true)}
                    data-testid="create-ticket-button"
                  >
                    + Create Ticket
                  </Button>
                </div>
                <TicketList companyId={currentCompanyId} />
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40">
      <div className="container py-6 space-y-6" data-testid="client-portal">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-deep-navy to-cobalt bg-clip-text text-transparent mb-2">
            Client Portal
          </h1>
          <p className="text-deep-navy/70">
            Manage your documents, review reports, and get support
          </p>
        </div>

        {/* Tab Navigation */}
        <Card className="p-1 bg-white/80 backdrop-blur-sm">
          <nav className="flex flex-col sm:flex-row gap-1" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                  ${activeTab === tab.key
                    ? 'bg-cobalt text-white shadow-soft' 
                    : 'text-deep-navy hover:bg-medium/20'
                  }
                `}
                data-testid={`tab-${tab.key}`}
              >
                <span className="text-xl">{tab.icon}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">{tab.label}</h3>
                  <p className={`
                    text-xs mt-0.5 line-clamp-1
                    ${activeTab === tab.key ? 'text-white/80' : 'text-deep-navy/60'}
                  `}>
                    {tab.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>
        </Card>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              data-testid={`panel-${activeTab}`}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quick Stats Cards */}
        {!showCreateTicket && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  📄
                </div>
                <div>
                  <p className="text-sm text-deep-navy/70">Total Documents</p>
                  <p className="text-2xl font-bold text-deep-navy">
                    {useClientStore.getState().documents.length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                  📊
                </div>
                <div>
                  <p className="text-sm text-deep-navy/70">Pending Reports</p>
                  <p className="text-2xl font-bold text-deep-navy">
                    {useClientStore.getState().reports.filter((r: any) => r.status === 'pendingApproval').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl">
                  🎫
                </div>
                <div>
                  <p className="text-sm text-deep-navy/70">Open Tickets</p>
                  <p className="text-2xl font-bold text-deep-navy">
                    {useClientStore.getState().tickets.filter((t: any) => t.status !== 'closed').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Ticket Detail Modal */}
        <TicketDetailModal
          open={!!activeTicket}
          onClose={() => useClientStore.getState().setActiveTicket(null)}
        />
      </div>
    </div>
  );
}