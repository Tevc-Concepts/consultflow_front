'use client';

import { useState } from 'react';
import { useSuperAdminStore } from '../../../features/superadmin/store';
import { Ticket } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

export default function SuperAdminTicketsPage() {
  const tickets = useSuperAdminStore((state) => state.tickets);
  const consultants = useSuperAdminStore((state) => state.consultants);
  const updateTicket = useSuperAdminStore((state) => state.updateTicket);
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

  // Mock tickets data since the store might be empty
  const mockTickets: Ticket[] = [
    {
      id: '1',
      title: 'Report generation failing',
      description: 'Consultant unable to generate P&L reports for client ABC Corp',
      consultantId: '1',
      priority: 'high',
      status: 'open',
      createdAt: '2024-09-25T10:00:00Z'
    },
    {
      id: '2',
      title: 'Data import issue',
      description: 'CSV upload not working for large files',
      consultantId: '2',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2024-09-24T14:30:00Z'
    },
    {
      id: '3',
      title: 'Feature request: Custom templates',
      description: 'Request for additional report templates',
      consultantId: '1',
      priority: 'low',
      status: 'resolved',
      createdAt: '2024-09-20T09:15:00Z',
      resolvedAt: '2024-09-22T16:45:00Z'
    }
  ];

  const displayTickets = mockTickets.length > 0 ? mockTickets : tickets;
  const filteredTickets = filter === 'all'
    ? displayTickets
    : displayTickets.filter(ticket => ticket.status === filter);

  const getConsultantName = (consultantId: string) => {
    const consultant = consultants.find(c => c.id === consultantId);
    return consultant?.name || 'Unknown';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'urgent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
    const updates: Partial<Ticket> = { status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
    }
    updateTicket(ticketId, updates);
  };

  const handlePriorityChange = (ticketId: string, newPriority: Ticket['priority']) => {
    updateTicket(ticketId, { priority: newPriority });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Support & Tickets</h1>
      </div>

      {/* Filter Tabs */}
      <Card>
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All Tickets', count: displayTickets.length },
            { key: 'open', label: 'Open', count: displayTickets.filter(t => t.status === 'open').length },
            { key: 'in-progress', label: 'In Progress', count: displayTickets.filter(t => t.status === 'in-progress').length },
            { key: 'resolved', label: 'Resolved', count: displayTickets.filter(t => t.status === 'resolved').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === tab.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Consultant: {getConsultantName(ticket.consultantId)}</span>
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    {ticket.resolvedAt && (
                      <span>Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Priority:</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(ticket.id, e.target.value as Ticket['priority'])}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <>
                      {ticket.status === 'open' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(ticket.id, 'in-progress')}
                        >
                          Start Working
                        </Button>
                      )}
                      {ticket.status === 'in-progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(ticket.id, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </>
                  )}
                  {ticket.status === 'resolved' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStatusChange(ticket.id, 'closed')}
                    >
                      Close Ticket
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No tickets found for the selected filter.</p>
          </div>
        </Card>
      )}
    </div>
  );
}