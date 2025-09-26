/**
 * Support Ticket List Component
 * Displays all support tickets with filtering and status management
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { useClientStore } from '../store';
import type { SupportTicket, TicketStatus } from '../repository';

export interface TicketListProps {
  companyId: string;
}

// Status badge component
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const config = {
    open: { 
      label: 'Open', 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '🔵'
    },
    pending: { 
      label: 'In Progress', 
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: '🟡'
    },
    closed: { 
      label: 'Closed', 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '⚫'
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

// Priority badge component
const PriorityBadge: React.FC<{ priority: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const config = {
    low: { 
      label: 'Low', 
      className: 'text-gray-600'
    },
    medium: { 
      label: 'Medium', 
      className: 'text-amber-600'
    },
    high: { 
      label: 'High', 
      className: 'text-red-600'
    }
  };

  const { label, className } = config[priority];

  return (
    <span className={`text-xs font-medium ${className}`}>
      {label} Priority
    </span>
  );
};

// Ticket type icon
const getTicketIcon = (type: string): string => {
  switch (type) {
    case 'technical': return '🔧';
    case 'report': return '📊';
    case 'compliance': return '📋';
    default: return '❓';
  }
};

// Ticket card component
const TicketCard: React.FC<{
  ticket: SupportTicket;
  onClick: (ticket: SupportTicket) => void;
}> = ({ ticket, onClick }) => {
  const hasNewComments = ticket.comments.some(comment => 
    comment.author === 'accountant' && 
    new Date(comment.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Comments from last 24 hours
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      className="bg-white rounded-xl border border-medium/20 p-4 cursor-pointer hover:shadow-soft transition-all"
      onClick={() => onClick(ticket)}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-1">
          {getTicketIcon(ticket.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-deep-navy truncate" title={ticket.subject}>
                {ticket.subject}
                {hasNewComments && (
                  <span className="ml-2 inline-block w-2 h-2 bg-cobalt rounded-full" title="New responses available"></span>
                )}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-deep-navy/40">•</span>
                <span className="text-xs text-deep-navy/60">
                  Created {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <StatusBadge status={ticket.status} />
          </div>

          <p className="text-sm text-deep-navy/70 mb-3 line-clamp-2">
            {ticket.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-deep-navy/60">
              <span>💬</span>
              <span>
                {ticket.comments.length} {ticket.comments.length === 1 ? 'comment' : 'comments'}
              </span>
              {ticket.updatedAt !== ticket.createdAt && (
                <>
                  <span>•</span>
                  <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-cobalt hover:text-cobalt"
            >
              View Details →
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Filter component
const TicketFilter: React.FC<{
  activeFilter: TicketStatus | 'all';
  onFilterChange: (filter: TicketStatus | 'all') => void;
  ticketCounts: Record<string, number>;
}> = ({ activeFilter, onFilterChange, ticketCounts }) => {
  const filters = [
    { key: 'all', label: 'All Tickets', count: ticketCounts.all || 0 },
    { key: 'open', label: 'Open', count: ticketCounts.open || 0 },
    { key: 'pending', label: 'In Progress', count: ticketCounts.pending || 0 },
    { key: 'closed', label: 'Closed', count: ticketCounts.closed || 0 }
  ] as const;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key as TicketStatus | 'all')}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
            ${activeFilter === filter.key
              ? 'bg-cobalt text-white border-cobalt'
              : 'bg-white text-deep-navy border-medium/40 hover:border-cobalt hover:bg-cobalt/5'
            }
          `}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
};

export default function TicketList({ companyId }: TicketListProps) {
  const { tickets, ticketsLoading, loadTickets, setActiveTicket } = useClientStore();
  const [filter, setFilter] = React.useState<TicketStatus | 'all'>('all');

  // Load tickets on mount and company change
  React.useEffect(() => {
    if (companyId) {
      loadTickets(companyId);
    }
  }, [companyId, loadTickets]);

  const handleTicketClick = (ticket: SupportTicket) => {
    setActiveTicket(ticket);
  };

  const filteredTickets = React.useMemo(() => {
    if (filter === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === filter);
  }, [tickets, filter]);

  const ticketCounts = React.useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      pending: tickets.filter(t => t.status === 'pending').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  }, [tickets]);

  if (ticketsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-24 animate-pulse bg-medium/20" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-3">🎫</div>
        <h3 className="text-lg font-semibold text-deep-navy mb-2">No support tickets yet</h3>
        <p className="text-deep-navy/70">
          Create your first support ticket if you need assistance with anything.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="tickets-list">
      <TicketFilter
        activeFilter={filter}
        onFilterChange={setFilter}
        ticketCounts={ticketCounts}
      />

      {filteredTickets.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-deep-navy mb-2">
            No {filter !== 'all' ? filter : ''} tickets found
          </h3>
          <p className="text-deep-navy/70">
            Try adjusting your filter or create a new support ticket.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={handleTicketClick}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}