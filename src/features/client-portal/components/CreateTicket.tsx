/**
 * Support Ticket Creation Component
 * Allows clients to create support tickets for various issues
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { useClientStore } from '../store';
import type { TicketType } from '../repository';

export interface CreateTicketProps {
  companyId: string;
  onTicketCreated?: () => void;
}

const ticketTypes = [
  {
    value: 'technical' as TicketType,
    label: 'Technical Issue',
    description: 'Problems with the system, downloads, or functionality',
    icon: '🔧'
  },
  {
    value: 'report' as TicketType,
    label: 'Report Issue',
    description: 'Questions or concerns about specific reports',
    icon: '📊'
  },
  {
    value: 'compliance' as TicketType,
    label: 'Compliance Query',
    description: 'Tax, regulatory, or compliance-related questions',
    icon: '📋'
  }
];

const priorities = [
  { value: 'low', label: 'Low', description: 'General inquiry', className: 'text-gray-600' },
  { value: 'medium', label: 'Medium', description: 'Standard business need', className: 'text-amber-600' },
  { value: 'high', label: 'High', description: 'Urgent business issue', className: 'text-red-600' }
];

export default function CreateTicket({ companyId, onTicketCreated }: CreateTicketProps) {
  const { createTicket } = useClientStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    subject: '',
    description: '',
    type: 'technical' as TicketType,
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formData.subject.trim() || !formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createTicket(
        formData.subject.trim(),
        formData.description.trim(),
        formData.type,
        formData.priority,
        companyId
      );

      if (ticket) {
        // Reset form
        setFormData({
          subject: '',
          description: '',
          type: 'technical',
          priority: 'medium'
        });

        // Show success toast
        const event = new CustomEvent('show-toast', {
          detail: {
            title: 'Ticket Created',
            message: `Your support ticket "${formData.subject}" has been submitted successfully.`,
            type: 'success'
          }
        });
        window.dispatchEvent(event);

        onTicketCreated?.();
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Ticket Creation Failed',
          message: 'There was an error creating your support ticket. Please try again.',
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

  const isValid = formData.subject.trim() && formData.description.trim();

  return (
    <Card className="p-6" data-testid="create-ticket-form">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-deep-navy mb-2">Create Support Ticket</h3>
        <p className="text-sm text-deep-navy/70">
          Need help? Submit a support ticket and our team will get back to you promptly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ticket Type Selection */}
        <div>
          <label className="block text-sm font-medium text-deep-navy mb-3">
            Issue Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ticketTypes.map((type) => (
              <label
                key={type.value}
                className={`
                  relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-sm
                  ${formData.type === type.value 
                    ? 'border-cobalt bg-cobalt/5' 
                    : 'border-medium/40 hover:border-medium/60'
                  }
                `}
              >
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={(e) => updateField('type', e.target.value as TicketType)}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h4 className="font-medium text-deep-navy text-sm">{type.label}</h4>
                  <p className="text-xs text-deep-navy/60 mt-1">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium text-deep-navy mb-3">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {priorities.map((priority) => (
              <label
                key={priority.value}
                className={`
                  relative cursor-pointer rounded-xl border-2 p-3 transition-all hover:shadow-sm
                  ${formData.priority === priority.value 
                    ? 'border-cobalt bg-cobalt/5' 
                    : 'border-medium/40 hover:border-medium/60'
                  }
                `}
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={(e) => updateField('priority', e.target.value as 'low' | 'medium' | 'high')}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                <div className="text-center">
                  <h4 className={`font-medium text-sm ${priority.className}`}>
                    {priority.label}
                  </h4>
                  <p className="text-xs text-deep-navy/60 mt-1">{priority.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-deep-navy mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            placeholder="Brief summary of your issue..."
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50"
            data-testid="ticket-subject"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-deep-navy mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Please provide detailed information about your issue..."
            rows={6}
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 resize-none"
            data-testid="ticket-description"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="min-w-32"
            data-testid="submit-ticket"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Creating...
              </div>
            ) : (
              'Submit Ticket'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}