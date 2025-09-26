/**
 * Ticket Detail Modal Component
 * Shows detailed view of a ticket with comments and interaction capabilities
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import { useClientStore } from '../store';
import type { SupportTicket, TicketComment } from '../repository';

export interface TicketDetailModalProps {
  open: boolean;
  onClose: () => void;
}

// Comment bubble component
const CommentBubble: React.FC<{ comment: TicketComment }> = ({ comment }) => {
  const isClient = comment.author === 'client';
  
  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isClient ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            rounded-2xl px-4 py-3 text-sm
            ${isClient 
              ? 'bg-cobalt text-white' 
              : 'bg-medium/20 text-deep-navy'
            }
          `}
        >
          <p className="whitespace-pre-wrap">{comment.message}</p>
        </div>
        <p className={`text-xs text-deep-navy/50 mt-1 ${isClient ? 'text-right' : 'text-left'}`}>
          {comment.author === 'client' ? 'You' : 'Support Team'} • {new Date(comment.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// Status update component
const StatusUpdateForm: React.FC<{
  currentStatus: SupportTicket['status'];
  onStatusUpdate: (status: SupportTicket['status']) => void;
}> = ({ currentStatus, onStatusUpdate }) => {
  if (currentStatus === 'closed') return null;

  return (
    <div className="border-t border-medium/20 pt-4">
      <p className="text-sm font-medium text-deep-navy mb-2">Update Status:</p>
      <div className="flex gap-2">
        {currentStatus !== 'open' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusUpdate('open')}
            className="text-xs"
          >
            Reopen
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onStatusUpdate('closed')}
          className="text-xs text-gray-600 hover:text-gray-700"
          data-testid="close-ticket-button"
        >
          Close Ticket
        </Button>
      </div>
    </div>
  );
};

export default function TicketDetailModal({ open, onClose }: TicketDetailModalProps) {
  const { activeTicket, addTicketComment, updateTicketStatus, setActiveTicket } = useClientStore();
  const [newComment, setNewComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const commentsEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when comments change
  React.useEffect(() => {
    if (activeTicket?.comments) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeTicket?.comments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await addTicketComment(activeTicket.id, newComment.trim());
      if (success) {
        setNewComment('');
        const event = new CustomEvent('show-toast', {
          detail: {
            title: 'Comment Added',
            message: 'Your comment has been sent successfully.',
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Comment Failed',
          message: 'There was an error sending your comment. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: SupportTicket['status']) => {
    if (!activeTicket) return;

    const success = await updateTicketStatus(activeTicket.id, status);
    if (success) {
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Status Updated',
          message: `Ticket status has been updated to ${status}.`,
          type: 'success'
        }
      });
      window.dispatchEvent(event);

      // If ticket is closed, close the modal
      if (status === 'closed') {
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setActiveTicket(null);
    setNewComment('');
    onClose();
  };

  if (!activeTicket) return null;

  const getTicketIcon = (type: string): string => {
    switch (type) {
      case 'technical': return '🔧';
      case 'report': return '📊';
      case 'compliance': return '📋';
      default: return '❓';
    }
  };

  const getStatusColor = (status: SupportTicket['status']): string => {
    switch (status) {
      case 'open': return 'text-blue-600';
      case 'pending': return 'text-amber-600';
      case 'closed': return 'text-gray-600';
    }
  };

  return (
    <Modal open={open} onOpenChange={handleClose} disableOverlayClose>
      <div className="max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-medium/20 pb-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getTicketIcon(activeTicket.type)}</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-deep-navy mb-1">
                {activeTicket.subject}
              </h2>
              <div className="flex items-center gap-2 text-sm text-deep-navy/70">
                <span className={`font-medium ${getStatusColor(activeTicket.status)}`}>
                  {activeTicket.status.charAt(0).toUpperCase() + activeTicket.status.slice(1)}
                </span>
                <span>•</span>
                <span>{activeTicket.priority} priority</span>
                <span>•</span>
                <span>Created {new Date(activeTicket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClose}
              className="text-deep-navy/60 hover:text-deep-navy"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Original Description */}
        <div className="bg-medium/10 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-deep-navy mb-2">Original Description:</p>
          <p className="text-sm text-deep-navy/80 whitespace-pre-wrap">
            {activeTicket.description}
          </p>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto max-h-80 mb-4" data-testid="comments-section">
          {activeTicket.comments.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-deep-navy mb-4">
                Conversation ({activeTicket.comments.length})
              </p>
              <AnimatePresence>
                {activeTicket.comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CommentBubble comment={comment} />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <p className="text-sm text-deep-navy/60 text-center py-8">
              No comments yet. Start the conversation by adding a comment below.
            </p>
          )}
        </div>

        {/* Add Comment Form */}
        {activeTicket.status !== 'closed' && (
          <form onSubmit={handleAddComment} className="border-t border-medium/20 pt-4">
            <div className="mb-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment here..."
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 resize-none"
                data-testid="comment-input"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <StatusUpdateForm
                currentStatus={activeTicket.status}
                onStatusUpdate={handleStatusUpdate}
              />
              
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
                data-testid="send-comment-button"
              >
                {isSubmitting ? 'Sending...' : 'Send Comment'}
              </Button>
            </div>
          </form>
        )}

        {/* Closed ticket message */}
        {activeTicket.status === 'closed' && (
          <div className="border-t border-medium/20 pt-4 text-center">
            <p className="text-sm text-deep-navy/70">
              This ticket has been closed. If you need further assistance, please create a new ticket.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}