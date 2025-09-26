/**
 * Submit Report Modal for Consultants
 * Allows consultants to submit reports to clients
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import ConsultantActions from '@features/consultant/actions';

export interface SubmitReportModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

export default function SubmitReportModal({ 
  open, 
  onClose, 
  companyId, 
  companyName 
}: SubmitReportModalProps) {
  const [formData, setFormData] = React.useState({
    title: '',
    period: '',
    reportType: 'P&L' as 'P&L' | 'Balance Sheet' | 'Cash Flow' | 'Custom',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formData.title.trim() || !formData.period.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = ConsultantActions.submitReportToClient(
        companyId,
        formData.title.trim(),
        formData.period.trim(),
        formData.reportType
      );

      if (success) {
        // Show success toast
        const event = new CustomEvent('show-toast', {
          detail: {
            title: 'Report Submitted',
            message: `Report "${formData.title}" has been submitted to ${companyName} for approval.`,
            type: 'success'
          }
        });
        window.dispatchEvent(event);

        // Reset form and close modal
        setFormData({
          title: '',
          period: '',
          reportType: 'P&L',
          description: ''
        });
        onClose();
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Submission Failed',
          message: 'There was an error submitting the report. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.title.trim() && formData.period.trim();

  // Generate suggested title based on report type and period
  React.useEffect(() => {
    if (formData.reportType && formData.period && !formData.title) {
      const suggestedTitle = `${formData.reportType} - ${formData.period}`;
      setFormData(prev => ({ ...prev, title: suggestedTitle }));
    }
  }, [formData.reportType, formData.period, formData.title]);

  return (
    <Modal
      open={open}
      onOpenChange={onClose}
      title="Submit Report to Client"
      description={`Create and submit a new report to ${companyName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-deep-navy mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['P&L', 'Balance Sheet', 'Cash Flow', 'Custom'] as const).map((type) => (
              <label
                key={type}
                className={`
                  cursor-pointer rounded-lg border-2 p-3 text-center transition-all
                  ${formData.reportType === type 
                    ? 'border-cobalt bg-cobalt/5' 
                    : 'border-medium/40 hover:border-medium/60'
                  }
                `}
              >
                <input
                  type="radio"
                  name="reportType"
                  value={type}
                  checked={formData.reportType === type}
                  onChange={(e) => updateField('reportType', e.target.value as any)}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                <div className="text-lg mb-1">
                  {type === 'P&L' ? '📈' : 
                   type === 'Balance Sheet' ? '⚖️' : 
                   type === 'Cash Flow' ? '💰' : '📊'}
                </div>
                <p className="text-sm font-medium">{type}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Period */}
        <div>
          <label htmlFor="period" className="block text-sm font-medium text-deep-navy mb-1">
            Period
          </label>
          <input
            id="period"
            type="text"
            value={formData.period}
            onChange={(e) => updateField('period', e.target.value)}
            placeholder="e.g., December 2024, Q4 2024, FY 2024"
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-deep-navy mb-1">
            Report Title
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter report title..."
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-deep-navy mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Add any notes or instructions for the client..."
            rows={3}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            data-testid="submit-report-confirm"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Submitting...
              </div>
            ) : (
              '📤 Submit Report'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}