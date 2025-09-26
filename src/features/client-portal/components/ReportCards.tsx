/**
 * Report Cards Component
 * Displays reports with approval/rejection workflow
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Modal from '@components/ui/Modal';
import { useClientStore } from '../store';
import type { ClientReport, ReportStatus } from '../repository';

export interface ReportCardsProps {
  companyId: string;
}

// Status badge component
const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const config = {
    draft: { 
      label: 'Draft', 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '📝'
    },
    pendingApproval: { 
      label: 'Pending Approval', 
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: '⏳'
    },
    approved: { 
      label: 'Approved', 
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅'
    },
    rejected: { 
      label: 'Rejected', 
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: '❌'
    }
  };

  const { label, className, icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${className}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
};

// Report type icon
const getReportIcon = (reportType: string): string => {
  switch (reportType) {
    case 'P&L': return '📈';
    case 'Balance Sheet': return '⚖️';
    case 'Cash Flow': return '💰';
    default: return '📊';
  }
};

// Rejection modal component
const RejectionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  reportTitle: string;
}> = ({ open, onClose, onSubmit, reportTitle }) => {
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Reject Report"
      description={`Please provide a reason for rejecting "${reportTitle}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rejection-reason" className="block text-sm font-medium text-deep-navy mb-1">
            Reason for rejection
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide specific feedback on what needs to be corrected..."
            rows={4}
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 resize-none"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!reason.trim() || isSubmitting}
            className="bg-coral hover:bg-coral/90"
            data-testid="confirm-reject-button"
          >
            {isSubmitting ? 'Rejecting...' : 'Reject Report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Report card component
const ReportCard: React.FC<{
  report: ClientReport;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}> = ({ report, onApprove, onReject }) => {
  const [isApproving, setIsApproving] = React.useState(false);
  const [showRejectModal, setShowRejectModal] = React.useState(false);

  const handleApprove = async () => {
    if (isApproving) return;
    
    setIsApproving(true);
    try {
      await onApprove(report.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await onReject(report.id, reason);
    } catch (error) {
      console.error('Failed to reject report:', error);
    }
  };

  const canTakeAction = report.status === 'pendingApproval';

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-medium/20 p-6 hover:shadow-soft transition-shadow"
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl mt-1">
            {getReportIcon(report.reportType)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-deep-navy mb-1">
                  {report.title}
                </h3>
                <p className="text-sm text-deep-navy/70">
                  {report.reportType} • {report.period}
                </p>
                <p className="text-xs text-deep-navy/50 mt-1">
                  Created {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <StatusBadge status={report.status} />
            </div>

            {/* Rejection reason */}
            {report.status === 'rejected' && report.rejectionReason && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Rejection reason:</strong> {report.rejectionReason}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // Mock download functionality
                    const event = new CustomEvent('show-toast', {
                      detail: {
                        title: 'Download Started',
                        message: `Downloading ${report.title}...`,
                        type: 'info'
                      }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="text-xs"
                >
                  📥 Download
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // Mock preview functionality
                    const event = new CustomEvent('show-toast', {
                      detail: {
                        title: 'Preview',
                        message: `Opening preview for ${report.title}...`,
                        type: 'info'
                      }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="text-xs"
                >
                  👁️ Preview
                </Button>
              </div>

              {canTakeAction && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowRejectModal(true)}
                    className="text-xs text-coral hover:text-coral hover:bg-coral/10"
                    data-testid={`reject-report-${report.id}`}
                  >
                    Reject
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid={`approve-report-${report.id}`}
                  >
                    {isApproving ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <RejectionModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={handleReject}
        reportTitle={report.title}
      />
    </>
  );
};

export default function ReportCards({ companyId }: ReportCardsProps) {
  const { reports, reportsLoading, loadReports, approveReport, rejectReport } = useClientStore();

  // Load reports on mount and company change
  React.useEffect(() => {
    if (companyId) {
      loadReports(companyId);
    }
  }, [companyId, loadReports]);

  const handleApprove = React.useCallback(async (reportId: string) => {
    const success = await approveReport(reportId);
    if (success) {
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Report Approved',
          message: 'The report has been successfully approved.',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    } else {
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Approval Failed',
          message: 'There was an error approving the report. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  }, [approveReport]);

  const handleReject = React.useCallback(async (reportId: string, reason: string) => {
    const success = await rejectReport(reportId, reason);
    if (success) {
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Report Rejected',
          message: 'The report has been rejected and feedback has been sent to your accountant.',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    } else {
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Rejection Failed',
          message: 'There was an error rejecting the report. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  }, [rejectReport]);

  if (reportsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-medium/20" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-semibold text-deep-navy mb-2">No reports yet</h3>
        <p className="text-deep-navy/70">
          Your accountant will share reports here for your review and approval.
        </p>
      </Card>
    );
  }

  // Group reports by status for better organization
  const pendingReports = reports.filter(r => r.status === 'pendingApproval');
  const otherReports = reports.filter(r => r.status !== 'pendingApproval');

  return (
    <div className="space-y-6" data-testid="reports-list">
      {pendingReports.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
            <span>⏳</span>
            Pending Your Approval ({pendingReports.length})
          </h3>
          <div className="space-y-4">
            <AnimatePresence>
              {pendingReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {otherReports.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
            <span>📚</span>
            All Reports
          </h3>
          <div className="space-y-4">
            <AnimatePresence>
              {otherReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}