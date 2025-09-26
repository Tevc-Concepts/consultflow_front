'use client';

import * as React from 'react';
import { useAppStore, type AppState } from '@shared/state/app';
import { useNotifications } from '@shared/state/notifications';
import { useClientStore, DocumentUpload, DocumentList } from '@features/client-portal';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';

export default function ClientDocumentsPage() {
  const role = useAppStore((s: AppState) => s.role);
  const selectedCompanyIds = useAppStore((s: AppState) => s.selectedCompanyIds);
  const notify = useNotifications(s => s.add);
  
  const { seedDemoData } = useClientStore();
  const [hasSeededData, setHasSeededData] = React.useState(false);

  // Get current company ID
  const currentCompanyId = selectedCompanyIds[0] || 'demo-company-1';

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
    if (role !== 'Client') {
      notify({ 
        title: 'Access Restricted', 
        message: 'This page is only available for client users.', 
        kind: 'warning' 
      });
    }
  }, [role, notify]);

  if (role !== 'Client') {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40">
      <div className="container py-6 space-y-6" data-testid="client-documents-page">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-deep-navy to-cobalt bg-clip-text text-transparent mb-2">
            Document Management
          </h1>
          <p className="text-deep-navy/70">
            Upload and manage your documents for review
          </p>
        </div>

        {/* Document Upload and List */}
        <div className="space-y-6">
          <DocumentUpload
            companyId={currentCompanyId}
            onUploadComplete={() => {
              console.log('Document uploaded successfully');
            }}
          />
          <DocumentList companyId={currentCompanyId} />
        </div>
      </div>
    </div>
  );
}