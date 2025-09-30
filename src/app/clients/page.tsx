/**
 * Clients Management Page for Consultants  
 * Dynamic version using unified client repository with local DB integration
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '../../features/auth/ProtectedRoute';
import { useAuthStore } from '../../features/auth/store';
import { clientRepository } from '../../shared/repositories/clientRepository';
import type { ClientCompany, ClientDocument, ClientReport, SupportTicket } from '../../shared/repositories/clientRepository';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

interface ClientCompanyWithStats extends ClientCompany {
  contactPerson?: string;
  email?: string;
  documentsCount: number;
  pendingReports: number;
  openTickets: number;
  lastActivity: string;
}

export default function ClientsPage() {
  const { user } = useAuthStore();
  const [selectedCompany, setSelectedCompany] = React.useState<ClientCompanyWithStats | null>(null);
  const [clientCompanies, setClientCompanies] = React.useState<ClientCompanyWithStats[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Load client companies for the consultant
  React.useEffect(() => {
    const loadClientCompanies = async () => {
      if (!user?.id) return;
      
      try {
        const relationships = await clientRepository.getClientsByConsultant(user.id);
        const companies: ClientCompanyWithStats[] = relationships.map(rel => ({
          id: rel.company.id,
          name: rel.company.name,
          currency: rel.company.currency,
          country: rel.company.country,
          sector: rel.company.sector,
          established: rel.company.established,
          contactPerson: rel.client.full_name,
          email: rel.client.email,
          documentsCount: rel.company.documentsCount || 0,
          pendingReports: rel.company.pendingReports || 0, 
          openTickets: rel.company.openTickets || 0,
          lastActivity: rel.company.lastActivity || new Date().toISOString()
        }));
        
        setClientCompanies(companies);
        
        // Auto-select first company if available
        if (companies.length > 0 && !selectedCompany) {
          setSelectedCompany(companies[0]);
        }
      } catch (error) {
        console.error('Failed to load client companies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadClientCompanies();
  }, [user?.id, selectedCompany]);

  const refreshClientData = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const relationships = await clientRepository.getClientsByConsultant(user.id);
      const companies: ClientCompanyWithStats[] = relationships.map(rel => ({
        id: rel.company.id,
        name: rel.company.name,
        currency: rel.company.currency,
        country: rel.company.country,
        sector: rel.company.sector,
        established: rel.company.established,
        contactPerson: rel.client.full_name,
        email: rel.client.email,
        documentsCount: rel.company.documentsCount || 0,
        pendingReports: rel.company.pendingReports || 0, 
        openTickets: rel.company.openTickets || 0,
        lastActivity: rel.company.lastActivity || new Date().toISOString()
      }));
      
      setClientCompanies(companies);
      
      // Update selected company data if it exists
      if (selectedCompany) {
        const updatedCompany = companies.find(c => c.id === selectedCompany.id);
        if (updatedCompany) {
          setSelectedCompany(updatedCompany);
        }
      }
    } catch (error) {
      console.error('Failed to refresh client data:', error);
    }
  }, [user?.id, selectedCompany]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              Client Management
            </h1>
            <p className="text-deep-navy/70">
              Manage documents, reports, and support tickets for your clients
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Client Companies List */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-deep-navy mb-4">Your Clients</h2>
                <div className="space-y-3">
                  {clientCompanies.map(company => (
                    <ClientCompanyCard
                      key={company.id}
                      company={company}
                      onClick={setSelectedCompany}
                      isSelected={selectedCompany?.id === company.id}
                    />
                  ))}
                  {clientCompanies.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">👥</div>
                      <p className="text-deep-navy/70">No clients assigned yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Client Details Panel */}
            <div className="lg:col-span-2">
              <ClientDetailsPanel company={selectedCompany} onDataChange={refreshClientData} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Client company card component
const ClientCompanyCard: React.FC<{
  company: ClientCompanyWithStats;
  onClick: (company: ClientCompanyWithStats) => void;
  isSelected: boolean;
}> = ({ company, onClick, isSelected }) => {
  const timeAgo = React.useMemo(() => {
    const now = new Date();
    const lastActivity = new Date(company.lastActivity);
    const diffHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }, [company.lastActivity]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(company)}
      className={`cursor-pointer p-4 rounded-lg border-2 transition-colors ${
        isSelected 
          ? 'border-gradient-primary bg-gradient-to-r from-blue-50 to-purple-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-deep-navy truncate">{company.name}</h3>
          <p className="text-sm text-deep-navy/70 truncate">{company.contactPerson}</p>
          <p className="text-xs text-deep-navy/50">{company.email}</p>
        </div>
        <div className="text-xs text-deep-navy/50 ml-2">
          {company.currency}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="font-semibold text-blue-600">{company.documentsCount}</p>
          <p className="text-deep-navy/50">Docs</p>
        </div>
        <div className="text-center">
          <p className={`font-semibold ${company.pendingReports > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {company.pendingReports}
          </p>
          <p className="text-deep-navy/50">Reports</p>
        </div>
        <div className="text-center">
          <p className={`font-semibold ${company.openTickets > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {company.openTickets}
          </p>
          <p className="text-deep-navy/50">Tickets</p>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-deep-navy/50">Last activity: {timeAgo}</p>
      </div>
    </motion.div>
  );
};

// Client details panel component
const ClientDetailsPanel: React.FC<{ 
  company: ClientCompanyWithStats | null;
  onDataChange: () => void;
}> = ({ company, onDataChange }) => {
  const [activeTab, setActiveTab] = React.useState<'documents' | 'reports' | 'tickets'>('documents');
  const [showSubmitReportModal, setShowSubmitReportModal] = React.useState(false);
  const [documents, setDocuments] = React.useState<ClientDocument[]>([]);
  const [reports, setReports] = React.useState<ClientReport[]>([]);
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);

  // Load client data when company changes
  React.useEffect(() => {
    if (company) {
      const loadClientData = async () => {
        try {
          const [clientDocs, clientReports, clientTickets] = await Promise.all([
            clientRepository.getDocumentsAsync(company.id),
            clientRepository.getReportsAsync(company.id), 
            clientRepository.getTicketsAsync(company.id)
          ]);
          
          setDocuments(clientDocs);
          setReports(clientReports);
          setTickets(clientTickets);
        } catch (error) {
          console.error('Failed to load client data:', error);
        }
      };
      
      loadClientData();
    }
  }, [company]);

  const refreshData = React.useCallback(async () => {
    if (company) {
      try {
        const [clientDocs, clientReports, clientTickets] = await Promise.all([
          clientRepository.getDocumentsAsync(company.id),
          clientRepository.getReportsAsync(company.id), 
          clientRepository.getTicketsAsync(company.id)
        ]);
        
        setDocuments(clientDocs);
        setReports(clientReports);
        setTickets(clientTickets);
        
        // Notify parent to refresh client list
        onDataChange();
      } catch (error) {
        console.error('Failed to refresh client data:', error);
      }
    }
  }, [company, onDataChange]);

  if (!company) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-deep-navy mb-2">Select a Client</h3>
          <p className="text-deep-navy/70">
            Choose a client company from the list to view their documents, reports, and support tickets.
          </p>
        </div>
      </Card>
    );
  }

  const tabs = [
    { id: 'documents', label: 'Documents', icon: '📄', count: documents.length },
    { id: 'reports', label: 'Reports', icon: '📊', count: reports.length },
    { id: 'tickets', label: 'Support', icon: '🎫', count: tickets.length },
  ];

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-deep-navy">{company.name}</h2>
            <p className="text-deep-navy/70">{company.contactPerson} • {company.email}</p>
            {company.sector && company.country && (
              <p className="text-sm text-deep-navy/50 mt-1">
                {company.sector} • {company.country} • Est. {company.established}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-deep-navy/50">Currency</div>
            <div className="font-semibold text-deep-navy">{company.currency}</div>
            <div className="mt-2 flex gap-2 justify-end">
              <a className="text-xs px-2 py-1 rounded-full bg-cobalt text-white" href={`/consultant/companies/${company.id}/chart-of-accounts`}>CoA</a>
              <a className="text-xs px-2 py-1 rounded-full bg-cobalt text-white" href={`/consultant/companies/${company.id}/trial-balance`}>TB</a>
              <a className="text-xs px-2 py-1 rounded-full bg-cobalt text-white" href={`/consultant/companies/${company.id}/tax-templates`}>Tax</a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-gradient-primary border-b-2 border-blue-500'
                  : 'text-deep-navy/70 hover:text-deep-navy'
              }`}
            >
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'documents' && (
              <DocumentsSection 
                documents={documents} 
                companyId={company.id}
                onDocumentReviewed={refreshData}
              />
            )}
            {activeTab === 'reports' && (
              <ReportsSection 
                reports={reports} 
                companyId={company.id}
                onReportSubmit={() => setShowSubmitReportModal(true)}
              />
            )}
            {activeTab === 'tickets' && (
              <TicketsSection 
                tickets={tickets} 
                companyId={company.id}
                onTicketUpdate={refreshData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Submit Report Modal */}
      {showSubmitReportModal && (
        <Modal
          open={showSubmitReportModal}
          onOpenChange={setShowSubmitReportModal}
          title="Submit New Report"
        >
          <div className="p-6">
            <p className="mb-4">Submit a new report for {company.name}</p>
            {/* Report form would go here */}
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  // Handle report submission
                  setShowSubmitReportModal(false);
                  refreshData();
                }}
              >
                Submit Report
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowSubmitReportModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// Documents section component
const DocumentsSection: React.FC<{ 
  documents: ClientDocument[]; 
  companyId: string;
  onDocumentReviewed: () => void;
}> = ({ documents, onDocumentReviewed }) => {
  const { user } = useAuthStore();

  const handleReviewDocument = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!user?.id) return;

    try {
      await clientRepository.updateDocumentStatus(documentId, status, user.id, notes);
      onDocumentReviewed();
    } catch (error) {
      console.error('Failed to review document:', error);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-lg font-semibold text-deep-navy mb-2">No Documents</h3>
        <p className="text-deep-navy/70">This client hasn&apos;t uploaded any documents yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map(document => (
        <div key={document.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-deep-navy">{document.file_name}</h4>
              <p className="text-sm text-deep-navy/70 mt-1">{document.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-deep-navy/50">
                <span>{document.file_type.toUpperCase()}</span>
                <span>{Math.round(document.file_size / 1024)} KB</span>
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className={`px-2 py-1 rounded text-xs ${
                document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                document.status === 'approved' ? 'bg-green-100 text-green-800' :
                document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {document.status}
              </span>
              {document.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => handleReviewDocument(document.id, 'approved')}
                  >
                    ✅ Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleReviewDocument(document.id, 'rejected', 'Needs revision')}
                  >
                    ❌ Reject
                  </Button>
                </>
              )}
            </div>
          </div>
          {document.review_notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm text-deep-navy/70">{document.review_notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Reports section component  
const ReportsSection: React.FC<{ 
  reports: ClientReport[]; 
  companyId: string;
  onReportSubmit: () => void;
}> = ({ reports, onReportSubmit }) => {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-deep-navy">Reports & Submissions</h3>
        <Button 
          size="sm" 
          onClick={onReportSubmit}
          data-testid="submit-report-button"
        >
          📤 Submit New Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-deep-navy mb-2">No Reports</h3>
          <p className="text-deep-navy/70">No reports have been submitted for this client yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-deep-navy">{report.title}</h4>
                  <p className="text-sm text-deep-navy/70 mt-1">{report.report_type} • {report.period}</p>
                  <p className="text-xs text-deep-navy/50 mt-1">
                    Created {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  report.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  report.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                  report.status === 'approved' ? 'bg-green-100 text-green-800' :
                  report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>
              {report.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 rounded">
                  <p className="text-sm text-red-800">{report.rejection_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Tickets section component
const TicketsSection: React.FC<{ 
  tickets: SupportTicket[]; 
  companyId: string; 
  onTicketUpdate: () => void;
}> = ({ tickets, onTicketUpdate }) => {
  const { user } = useAuthStore();

  const handleUpdateTicketStatus = async (ticketId: string, status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await clientRepository.updateTicketStatus(ticketId, status);
      onTicketUpdate();
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  };

  const handleAddComment = async (ticketId: string, message: string) => {
    if (!user?.id || !message.trim()) return;

    try {
      await clientRepository.addTicketComment(ticketId, user.id, message);
      onTicketUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎫</div>
        <h3 className="text-lg font-semibold text-deep-navy mb-2">No Support Tickets</h3>
        <p className="text-deep-navy/70">This client hasn&apos;t created any support tickets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-deep-navy">{ticket.subject}</h4>
              <p className="text-sm text-deep-navy/70 mt-1">{ticket.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-deep-navy/50">
                <span>{ticket.ticket_type}</span>
                <span className={`px-2 py-1 rounded ${
                  ticket.priority === 'low' ? 'bg-green-100 text-green-800' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {ticket.priority}
                </span>
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className={`px-2 py-1 rounded text-xs ${
                ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.status.replace('_', ' ')}
              </span>
              {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <Button 
                  size="sm"
                  onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                >
                  Resolve
                </Button>
              )}
            </div>
          </div>
          
          {/* Comments */}
          {ticket.comments && ticket.comments.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <h5 className="text-sm font-semibold text-deep-navy mb-2">Comments</h5>
              <div className="space-y-2">
                {ticket.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded p-2">
                    <p className="text-sm text-deep-navy/80">{comment.message}</p>
                    <p className="text-xs text-deep-navy/50 mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};