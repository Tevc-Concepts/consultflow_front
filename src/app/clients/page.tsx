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
  const [showNewDocModal, setShowNewDocModal] = React.useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = React.useState(false);
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
                onNew={() => setShowNewDocModal(true)}
              />
            )}
            {activeTab === 'reports' && (
              <ReportsSection 
                reports={reports} 
                companyId={company.id}
                onReportSubmit={() => setShowSubmitReportModal(true)}
                onRefresh={refreshData}
              />
            )}
            {activeTab === 'tickets' && (
              <TicketsSection 
                tickets={tickets} 
                companyId={company.id}
                onTicketUpdate={refreshData}
                onNew={() => setShowNewTicketModal(true)}
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
          <NewReportModal 
            companyId={company.id}
            onClose={() => setShowSubmitReportModal(false)}
            onSaved={refreshData}
          />
        </Modal>
      )}

      {/* New Document Modal */}
      {showNewDocModal && (
        <NewDocumentModal companyId={company.id} onClose={() => setShowNewDocModal(false)} onSaved={refreshData} />
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <NewTicketModal companyId={company.id} onClose={() => setShowNewTicketModal(false)} onSaved={refreshData} />
      )}
    </>
  );
};

// Documents section component
const DocumentsSection: React.FC<{ 
  documents: ClientDocument[]; 
  companyId: string;
  onDocumentReviewed: () => void;
  onNew: () => void;
}> = ({ documents, companyId, onDocumentReviewed, onNew }) => {
  const { user } = useAuthStore();
  const [historyFor, setHistoryFor] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [commentForId, setCommentForId] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState<string>('');
  const [threadByDocId, setThreadByDocId] = React.useState<Record<string, Array<{ id:string; message:string; created_at:string; author_id:string; author_name?: string }>>>({});

  React.useEffect(() => {
    // load comments threads for visible documents
    (async () => {
      const entries = await Promise.all(documents.map(async d => [d.id, await clientRepository.getDocumentComments(d.id)] as const));
      const mapped: Record<string, any> = {};
      entries.forEach(([id, comments]) => { mapped[id] = comments; });
      setThreadByDocId(mapped);
    })();
  }, [documents]);

  const handleReviewDocument = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!user?.id) return;

    try {
      await clientRepository.updateDocumentStatus(documentId, status, user.id, notes);
      clientRepository.logInteraction({ kind: 'document', companyId, entityId: documentId, type: 'status_change', userId: user.id, note: `Document ${status}`, changes: notes ? { review_notes: { from: '', to: notes } } : undefined });
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
        <p className="text-deep-navy/70 mb-3">This client hasn&apos;t uploaded any documents yet.</p>
        <Button size="sm" onClick={onNew}>➕ New Document</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-deep-navy">Documents</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => exportDocsCsv(documents)}>⬇️ CSV</Button>
          <Button size="sm" onClick={onNew}>➕ New Document</Button>
        </div>
      </div>
      {documents.map(document => (
        <div key={document.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-deep-navy">{document.file_name}</h4>
                {user?.id === document.uploaded_by && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Owned by you</span>
                )}
              </div>
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
              <Button size="sm" variant="ghost" onClick={() => setHistoryFor(document.id)}>📜 History</Button>
              {user?.id === document.uploaded_by ? (
                <Button size="sm" variant="ghost" onClick={() => setEditId(document.id)}>✏️ Edit</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setCommentForId(document.id)}>💬 Comment</Button>
              )}
              <Button size="sm" variant="ghost" onClick={async()=>{ await clientRepository.updateDocumentStatus(document.id,'rejected','system','Deleted'); clientRepository.logInteraction({ kind:'document', companyId, entityId: document.id, type:'delete', userId:'system', note:'Soft delete' }); onDocumentReviewed(); }}>🗑️ Delete</Button>
            </div>
          </div>
          {document.review_notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm text-deep-navy/70">{document.review_notes}</p>
            </div>
          )}
          {/* Full thread */}
          <div className="mt-3 space-y-2">
            <h5 className="text-sm font-semibold text-deep-navy">Comments</h5>
            {(threadByDocId[document.id] || []).map(c => (
              <div key={c.id} className="bg-gray-50 rounded p-2">
                <p className="text-sm text-deep-navy/80">{c.message}</p>
                <p className="text-[11px] text-deep-navy/50 mt-1">{c.author_name || c.author_id} • {new Date(c.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* History Drawer */}
      {historyFor && (
        <Modal open onOpenChange={() => setHistoryFor(null)} title="Interaction History">
          <div className="p-4">
            <HistoryList kind="document" entityId={historyFor} />
          </div>
        </Modal>
      )}
      {commentForId && (
        <Modal open onOpenChange={() => { setCommentForId(null); setCommentText(''); }} title="Add Comment">
          <div className="p-4 space-y-3 text-sm">
            <textarea className="w-full border rounded px-3 py-2" placeholder="Write your comment" value={commentText} onChange={e=>setCommentText(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={()=>{ setCommentForId(null); setCommentText(''); }}>Cancel</Button>
              <Button onClick={async()=>{ if(!user?.id||!commentText.trim()) return; await clientRepository.addDocumentComment(commentForId, user.id, commentText.trim()); clientRepository.logInteraction({ kind:'document', companyId, entityId: commentForId, type:'comment', userId: user.id, note: commentText.trim() }); setCommentForId(null); setCommentText(''); onDocumentReviewed(); }}>Post</Button>
            </div>
          </div>
        </Modal>
      )}
      {editId && (
        <EditDocumentModal 
          companyId={companyId}
          document={documents.find(d => d.id === editId)!}
          onClose={() => setEditId(null)}
          onSaved={onDocumentReviewed}
        />
      )}
    </div>
  );
};

// Reports section component  
const ReportsSection: React.FC<{ 
  reports: ClientReport[]; 
  companyId: string;
  onReportSubmit: () => void;
  onRefresh?: () => void;
}> = ({ reports, companyId, onReportSubmit, onRefresh }) => {
  const { user } = useAuthStore();
  const [historyFor, setHistoryFor] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [commentForId, setCommentForId] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState<string>('');
  const [threadByReportId, setThreadByReportId] = React.useState<Record<string, Array<{ id:string; message:string; created_at:string; author_id:string; author_name?: string }>>>({});

  React.useEffect(() => {
    (async () => {
      const entries = await Promise.all(reports.map(async r => [r.id, await clientRepository.getReportComments(r.id)] as const));
      const mapped: Record<string, any> = {};
      entries.forEach(([id, comments]) => { mapped[id] = comments; });
      setThreadByReportId(mapped);
    })();
  }, [reports]);
  const updateStatus = async (id: string, status: ClientReport['status']) => {
    if (!user?.id) return;
    try { await clientRepository.updateReportStatus(id, status as any, user.id); clientRepository.logInteraction({ kind: 'report', companyId, entityId: id, type: 'status_change', userId: user.id, note: `Report ${status}` }); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-deep-navy">Reports & Submissions</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => exportReportsCsv(reports)}>⬇️ CSV</Button>
          <Button 
            size="sm" 
            onClick={onReportSubmit}
            data-testid="submit-report-button"
          >
            📤 Submit New Report
          </Button>
        </div>
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
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-deep-navy">{report.title}</h4>
                    {user?.id === report.created_by && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Owned by you</span>
                    )}
                  </div>
                  <p className="text-sm text-deep-navy/70 mt-1">{report.report_type} • {report.period}</p>
                  <p className="text-xs text-deep-navy/50 mt-1">
                    Created {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    report.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    report.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'approved' ? 'bg-green-100 text-green-800' :
                    report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {report.status.replace('_', ' ')}
                  </span>
                  {report.status === 'pending_approval' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(report.id, 'approved')}>Approve</Button>
                  )}
                  {report.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(report.id, 'pending_approval')}>Submit</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setHistoryFor(report.id)}>📜 History</Button>
                  {user?.id === report.created_by ? (
                    <Button size="sm" variant="ghost" onClick={() => setEditId(report.id)}>✏️ Edit</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setCommentForId(report.id)}>💬 Comment</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={async()=>{ clientRepository.logInteraction({ kind:'report', companyId, entityId: report.id, type:'delete', userId: user?.id || 'system', note:'Soft delete' }); /* For demo: no hard delete endpoint */ }}>🗑️ Delete</Button>
                </div>
              </div>
              {report.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 rounded">
                  <p className="text-sm text-red-800">{report.rejection_reason}</p>
                </div>
              )}
              <div className="mt-3 space-y-2">
                <h5 className="text-sm font-semibold text-deep-navy">Comments</h5>
                {(threadByReportId[report.id] || []).map(c => (
                  <div key={c.id} className="bg-gray-50 rounded p-2">
                    <p className="text-sm text-deep-navy/80">{c.message}</p>
                    <p className="text-[11px] text-deep-navy/50 mt-1">{c.author_name || c.author_id} • {new Date(c.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {historyFor && (
            <Modal open onOpenChange={() => setHistoryFor(null)} title="Interaction History">
              <div className="p-4">
                <HistoryList kind="report" entityId={historyFor} />
              </div>
            </Modal>
          )}
          {commentForId && (
            <Modal open onOpenChange={() => { setCommentForId(null); setCommentText(''); }} title="Add Comment">
              <div className="p-4 space-y-3 text-sm">
                <textarea className="w-full border rounded px-3 py-2" placeholder="Write your comment" value={commentText} onChange={e=>setCommentText(e.target.value)} />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={()=>{ setCommentForId(null); setCommentText(''); }}>Cancel</Button>
                  <Button onClick={async()=>{ if(!user?.id||!commentText.trim()) return; await clientRepository.addReportComment(commentForId, user.id, commentText.trim()); clientRepository.logInteraction({ kind:'report', companyId, entityId: commentForId, type:'comment', userId: user.id, note: commentText.trim() }); setCommentForId(null); setCommentText(''); onRefresh?.(); }}>Post</Button>
                </div>
              </div>
            </Modal>
          )}
          {editId && (
            <Modal open onOpenChange={() => setEditId(null)} title="Edit Report">
              <EditReportForm 
                report={reports.find(r => r.id === editId)!}
                companyId={companyId}
                onClose={() => setEditId(null)}
                onSaved={() => { setEditId(null); onRefresh?.(); }}
              />
            </Modal>
          )}
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
  onNew: () => void;
}> = ({ tickets, companyId, onTicketUpdate, onNew }) => {
  const { user } = useAuthStore();
  const [historyFor, setHistoryFor] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [commentForId, setCommentForId] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState<string>('');
  const [threadByTicketId, setThreadByTicketId] = React.useState<Record<string, Array<{ id:string; message:string; created_at:string; author_id:string; author_name?: string }>>>({});

  React.useEffect(() => {
    (async () => {
      const entries = await Promise.all(tickets.map(async t => [t.id, await clientRepository.getTicketCommentsAsync(t.id)] as const));
      const mapped: Record<string, any> = {};
      entries.forEach(([id, comments]) => { mapped[id] = comments; });
      setThreadByTicketId(mapped);
    })();
  }, [tickets]);

  const handleUpdateTicketStatus = async (ticketId: string, status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await clientRepository.updateTicketStatus(ticketId, status);
      clientRepository.logInteraction({ kind: 'ticket', companyId, entityId: ticketId, type: 'status_change', userId: user?.id || 'system', note: `Ticket ${status}` });
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
        <p className="text-deep-navy/70 mb-3">This client hasn&apos;t created any support tickets.</p>
        <Button size="sm" onClick={onNew}>➕ New Ticket</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-deep-navy">Support Tickets</h3>
        <Button size="sm" onClick={onNew}>➕ New Ticket</Button>
      </div>
      {tickets.map(ticket => (
        <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-deep-navy">{ticket.subject}</h4>
                {user?.id === ticket.created_by && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Owned by you</span>
                )}
              </div>
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
              {user?.id === ticket.created_by ? (
                <Button size="sm" variant="ghost" onClick={() => setEditId(ticket.id)}>✏️ Edit</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setCommentForId(ticket.id)}>💬 Comment</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setHistoryFor(ticket.id)}>📜 History</Button>
            </div>
          </div>
          
          {/* Comments */}
          <div className="mt-4 border-t pt-3 space-y-2">
            <h5 className="text-sm font-semibold text-deep-navy">Comments</h5>
            {(threadByTicketId[ticket.id] || []).map(c => (
              <div key={c.id} className="bg-gray-50 rounded p-2">
                <p className="text-sm text-deep-navy/80">{c.message}</p>
                <p className="text-[11px] text-deep-navy/50 mt-1">{c.author_name || c.author_id} • {new Date(c.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* History Drawer */}
      {historyFor && (
        <Modal open onOpenChange={() => setHistoryFor(null)} title="Interaction History">
          <div className="p-4">
            <HistoryList kind="ticket" entityId={historyFor} />
          </div>
        </Modal>
      )}
      {commentForId && (
        <Modal open onOpenChange={() => { setCommentForId(null); setCommentText(''); }} title="Add Comment">
          <div className="p-4 space-y-3 text-sm">
            <textarea className="w-full border rounded px-3 py-2" placeholder="Write your comment" value={commentText} onChange={e=>setCommentText(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={()=>{ setCommentForId(null); setCommentText(''); }}>Cancel</Button>
              <Button onClick={async()=>{ if(!user?.id||!commentText.trim()) return; await clientRepository.addTicketComment(commentForId, user.id, commentText.trim()); clientRepository.logInteraction({ kind:'ticket', companyId, entityId: commentForId, type:'comment', userId: user.id, note: commentText.trim() }); setCommentForId(null); setCommentText(''); onTicketUpdate(); }}>Post</Button>
            </div>
          </div>
        </Modal>
      )}
      {editId && (
        <EditTicketModal 
          companyId={companyId}
          ticket={tickets.find(t => t.id === editId)!}
          onClose={() => setEditId(null)}
          onSaved={onTicketUpdate}
        />
      )}
    </div>
  );
};

// New Document modal
const NewDocumentModal: React.FC<{ companyId: string; onClose: () => void; onSaved: () => void }>= ({ companyId, onClose, onSaved }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [fileType, setFileType] = React.useState('pdf');
  const [fileSize, setFileSize] = React.useState('0');
  const save = async () => {
    if (!user?.id || !title) return;
    // Use clientRepository.uploadDocument API shape
    const created = await clientRepository.uploadDocument({
      company_id: companyId,
      file_name: title,
      description,
      file_type: fileType,
      file_size: Number(fileSize),
      status: 'pending',
      uploaded_by: user.id
    } as any);
    // Log interaction
    clientRepository.logInteraction({ kind: 'document', companyId, entityId: created.id, type: 'create', userId: user.id, note: 'New document created' });
    onClose(); onSaved();
  };
  return (
    <Modal open onOpenChange={onClose} title="New Document">
      <div className="p-4 space-y-3 text-sm">
        <input className="w-full border rounded px-3 py-2" placeholder="Title / File name" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="border rounded px-3 py-2" value={fileType} onChange={e=>setFileType(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
            <option value="docx">DOCX</option>
          </select>
          <input type="number" className="border rounded px-3 py-2" placeholder="Size (bytes)" value={fileSize} onChange={e=>setFileSize(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};

// New Ticket modal
const NewTicketModal: React.FC<{ companyId: string; onClose: () => void; onSaved: () => void }>= ({ companyId, onClose, onSaved }) => {
  const { user } = useAuthStore();
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [priority, setPriority] = React.useState<'low'|'medium'|'high'>('low');
  const [category, setCategory] = React.useState('general');
  const save = async () => {
    if (!user?.id || !subject) return;
    const created = await clientRepository.createTicket({
      company_id: companyId,
      subject,
      description: body,
      priority,
      ticket_type: category,
      status: 'open',
      created_by: user.id
    } as any);
    clientRepository.logInteraction({ kind: 'ticket', companyId, entityId: created.id, type: 'create', userId: user.id, note: 'New ticket created' });
    onClose(); onSaved();
  };
  return (
    <Modal open onOpenChange={onClose} title="New Ticket">
      <div className="p-4 space-y-3 text-sm">
        <input className="w-full border rounded px-3 py-2" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Details" value={body} onChange={e=>setBody(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <select className="border rounded px-3 py-2" value={priority} onChange={e=>setPriority(e.target.value as any)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="border rounded px-3 py-2" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="report">Report</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};

// History list renderer (reads from repository log)
const HistoryList: React.FC<{ kind: 'document'|'ticket'|'report'; entityId: string }> = ({ kind, entityId }) => {
  const { user } = useAuthStore();
  const events = React.useMemo(() => clientRepository.getInteractionHistory(kind, entityId), [kind, entityId]);
  const nameFor = (uid: string) => {
    if (!uid) return 'Unknown';
    if (user?.id === uid && (user as any)?.full_name) return (user as any).full_name as string;
    if (uid === 'system') return 'System';
    return uid; // fallback to id when display name isn’t available
  };
  if (!events.length) return <div className="text-sm text-deep-navy/60">No history.</div>;
  return (
    <div className="space-y-2 text-sm">
      {events.map(e => (
        <div key={e.id} className="flex items-start justify-between border-b pb-1 last:border-0">
          <div>
            <div className="font-medium capitalize">{e.type.replace('_',' ')}</div>
            <div className="text-deep-navy/70">
              {e.note || ''}
              <span className="ml-2 text-xs text-deep-navy/50">by {nameFor(e.userId)}</span>
            </div>
            {e.changes && (
              <div className="text-xs text-deep-navy/60 mt-1">
                {Object.entries(e.changes).map(([k,v]) => (
                  <div key={k}>{k}: {String(v.from)} → {String(v.to)}</div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-deep-navy/60">{new Date(e.ts).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

// Show latest 3 comment events from interaction history as a simple thread
const RecentComments: React.FC<{ kind: 'document'|'report'|'ticket'; entityId: string }> = ({ kind, entityId }) => {
  const { user } = useAuthStore();
  const events = React.useMemo(() => clientRepository.getInteractionHistory(kind as any, entityId)
    .filter(e => e.type === 'comment')
    .slice(-3), [kind, entityId]);
  const nameFor = (uid: string) => {
    if (!uid) return 'Unknown';
    if (user?.id === uid && (user as any)?.full_name) return (user as any).full_name as string;
    if (uid === 'system') return 'System';
    return uid;
  };
  if (!events.length) return null;
  return (
    <div className="space-y-2">
      <h5 className="text-sm font-semibold text-deep-navy">Comments</h5>
      {events.map(e => (
        <div key={e.id} className="bg-gray-50 rounded p-2">
          <p className="text-sm text-deep-navy/80">{e.note}</p>
          <p className="text-[11px] text-deep-navy/50 mt-1">by {nameFor(e.userId)} • {new Date(e.ts).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

// New Report modal (content only; wrapped by parent Modal)
const NewReportModal: React.FC<{ companyId: string; onClose: () => void; onSaved: () => void }> = ({ companyId, onClose, onSaved }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = React.useState('');
  const [reportType, setReportType] = React.useState('P&L');
  const [period, setPeriod] = React.useState('2025-09');
  const save = async () => {
    if (!user?.id || !title) return;
    const created = await clientRepository.createReport({
      company_id: companyId,
      title,
      report_type: reportType,
      period,
      status: 'draft',
      created_by: user.id
    } as any);
    clientRepository.logInteraction({ kind: 'report', companyId, entityId: created.id, type: 'create', userId: user.id, note: 'New report created' });
    onClose(); onSaved();
  };
  return (
    <div className="p-4 space-y-3 text-sm">
      <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
  <select className="border rounded px-3 py-2" value={reportType} onChange={e=>setReportType(e.target.value as any)}>
          <option value="P&L">P&L</option>
          <option value="Balance Sheet">Balance Sheet</option>
          <option value="Cash Flow">Cash Flow</option>
        </select>
        <input className="border rounded px-3 py-2" placeholder="Period (YYYY-MM)" value={period} onChange={e=>setPeriod(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
};

// Lightweight CSV exporters for Documents and Reports
function exportDocsCsv(docs: ClientDocument[]) {
  const header = ['id','file_name','file_type','file_size','status','created_at','uploaded_by'];
  const rows = docs.map(d => [d.id, d.file_name, d.file_type, String(d.file_size), d.status, d.created_at, d.uploaded_by]);
  const lines = [header.join(','), ...rows.map(r => r.map(s => typeof s === 'string' && s.includes(',') ? `"${s.replace(/"/g,'""')}"` : String(s ?? '')).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'client_documents.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
function exportReportsCsv(reports: ClientReport[]) {
  const header = ['id','title','report_type','period','status','created_at','created_by'];
  const rows = reports.map(r => [r.id, r.title, r.report_type, r.period, r.status, r.created_at, r.created_by]);
  const lines = [header.join(','), ...rows.map(r => r.map(s => typeof s === 'string' && s.includes(',') ? `"${s.replace(/"/g,'""')}"` : String(s ?? '')).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'client_reports.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// Inline edit forms and modals
const EditDocumentModal: React.FC<{ companyId: string; document: ClientDocument; onClose: () => void; onSaved: () => void }>= ({ companyId, document, onClose, onSaved }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = React.useState(document.file_name);
  const [description, setDescription] = React.useState(document.description || '');
  const [fileType, setFileType] = React.useState(document.file_type);
  const [fileSize, setFileSize] = React.useState(String(document.file_size));
  const save = async () => {
    if (!user?.id || !title) return;
    const updated = await clientRepository.updateDocument(document.id, { file_name: title, description, file_type: fileType, file_size: Number(fileSize) } as any);
    if (updated) {
      clientRepository.logInteraction({ kind: 'document', companyId, entityId: document.id, type: 'update', userId: user.id, note: 'Document updated', changes: {
        file_name: { from: document.file_name, to: title },
        description: { from: document.description || '', to: description }
      }});
      onSaved();
    }
    onClose();
  };
  return (
    <Modal open onOpenChange={onClose} title="Edit Document">
      <div className="p-4 space-y-3 text-sm">
        <input className="w-full border rounded px-3 py-2" placeholder="Title / File name" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="border rounded px-3 py-2" value={fileType} onChange={e=>setFileType(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
            <option value="docx">DOCX</option>
          </select>
          <input type="number" className="border rounded px-3 py-2" placeholder="Size (bytes)" value={fileSize} onChange={e=>setFileSize(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};
const EditReportForm: React.FC<{ report: ClientReport; companyId: string; onClose: () => void; onSaved: () => void }> = ({ report, companyId, onClose, onSaved }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = React.useState(report.title);
  const [reportType, setReportType] = React.useState(report.report_type);
  const [period, setPeriod] = React.useState(report.period);
  const save = async () => {
    if (!user?.id || !title) return;
    const updated = await clientRepository.updateReport(report.id, { title, report_type: reportType, period } as any);
    if (updated) {
      clientRepository.logInteraction({ kind: 'report', companyId, entityId: report.id, type: 'update', userId: user.id, note: 'Report updated', changes: {
        title: { from: report.title, to: title },
        report_type: { from: report.report_type, to: reportType },
        period: { from: report.period, to: period }
      }});
      onSaved();
    }
    onClose();
  };
  return (
    <div className="p-4 space-y-3 text-sm">
      <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
  <select className="border rounded px-3 py-2" value={reportType} onChange={e=>setReportType(e.target.value as any)}>
          <option value="P&L">P&L</option>
          <option value="Balance Sheet">Balance Sheet</option>
          <option value="Cash Flow">Cash Flow</option>
          <option value="Management Report">Management Report</option>
          <option value="Tax Report">Tax Report</option>
          <option value="Custom">Custom</option>
        </select>
        <input className="border rounded px-3 py-2" placeholder="Period (e.g., 2025-09)" value={period} onChange={e=>setPeriod(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
};

const EditTicketModal: React.FC<{ companyId: string; ticket: SupportTicket; onClose: () => void; onSaved: () => void }>= ({ companyId, ticket, onClose, onSaved }) => {
  const { user } = useAuthStore();
  const [subject, setSubject] = React.useState(ticket.subject);
  const [body, setBody] = React.useState(ticket.description);
  const [priority, setPriority] = React.useState(ticket.priority);
  const [category, setCategory] = React.useState(ticket.ticket_type);
  const save = async () => {
    const updated = await clientRepository.updateTicket(ticket.id, { subject, description: body, priority, ticket_type: category } as any);
    if (updated) {
      clientRepository.logInteraction({ kind: 'ticket', companyId, entityId: ticket.id, type: 'update', userId: user?.id || 'system', note: 'Ticket updated', changes: {
        subject: { from: ticket.subject, to: subject },
        description: { from: ticket.description, to: body },
        priority: { from: ticket.priority, to: priority }
      }});
      onSaved();
    }
    onClose();
  };
  return (
    <Modal open onOpenChange={onClose} title="Edit Ticket">
      <div className="p-4 space-y-3 text-sm">
        <input className="w-full border rounded px-3 py-2" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Details" value={body} onChange={e=>setBody(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <select className="border rounded px-3 py-2" value={priority} onChange={e=>setPriority(e.target.value as any)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select className="border rounded px-3 py-2" value={category} onChange={e=>setCategory(e.target.value as any)}>
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="report">Report</option>
            <option value="compliance">Compliance</option>
            <option value="billing">Billing</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};