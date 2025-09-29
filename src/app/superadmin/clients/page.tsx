'use client';

import { useMemo, useState } from 'react';
import { useSuperAdminStore } from '../../../features/superadmin/store';
import { Client } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '@shared/components/Toast';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import Spinner from '@shared/components/Spinner';
import LoadingButton from '@shared/components/LoadingButton';

export default function SuperAdminClientsPage() {
  const clients = useSuperAdminStore((state) => state.clients);
  const consultants = useSuperAdminStore((state) => state.consultants);
  const updateClient = useSuperAdminStore((state) => state.updateClient);
  const deleteClient = useSuperAdminStore((state) => state.deleteClient);
  const createClient = useSuperAdminStore((state) => state.createClient);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const initialForm = useMemo(() => ({
    name: '', email: '', consultantId: consultants[0]?.id || '', status: 'active' as Client['status']
  }), [consultants]);
  const [form, setForm] = useState(initialForm);
  const change = (k: keyof typeof form, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const reset = () => setForm(initialForm);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateClient(editing.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          consultantId: form.consultantId,
          status: form.status,
        });
        setEditing(null);
        showToast({ title: 'Client Updated', message: `${form.name} updated successfully`, type: 'success' });
      } else {
        await createClient({
          name: form.name.trim(),
          email: form.email.trim(),
          consultantId: form.consultantId,
          status: form.status,
        } as any);
        setShowCreate(false);
        showToast({ title: 'Client Created', message: `${form.name} added successfully`, type: 'success' });
      }
    } catch (err: any) {
      showToast({ title: 'Action Failed', message: err?.message || 'Could not save client', type: 'error' });
    } finally { setIsSubmitting(false); }
    reset();
  };

  const getConsultantName = (consultantId: string) => {
    const consultant = consultants.find(c => c.id === consultantId);
    return consultant?.name || 'Unknown';
  };

  const toggleClientStatus = async (client: Client) => {
    if (busyById[client.id]) return;
    const newStatus = client.status === 'active' ? 'disabled' : 'active';
    setBusyById(s => ({ ...s, [client.id]: true }));
    try {
      await updateClient(client.id, { status: newStatus });
      showToast({ title: 'Client Updated', message: `${client.name} is now ${newStatus}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Update Failed', message: err?.message || 'Could not update client status', type: 'error' });
    } finally {
      setBusyById(s => ({ ...s, [client.id]: false }));
    }
  };

  const mockReports = [
    { id: '1', type: 'P&L', status: 'approved', date: '2024-09-20' },
    { id: '2', type: 'Balance Sheet', status: 'pending', date: '2024-09-22' },
    { id: '3', type: 'Tax Summary', status: 'approved', date: '2024-09-18' },
  ];

  const mockTickets = [
    { id: '1', title: 'Report generation issue', status: 'resolved', priority: 'medium' },
    { id: '2', title: 'Data import problem', status: 'open', priority: 'high' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Client Oversight</h1>
        <Button onClick={() => { setShowCreate(true); reset(); }} className="flex items-center gap-2"><span>+</span> Add Client</Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getConsultantName(client.consultantId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.reportsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.lastActivity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setSelectedClient(client)} className="text-blue-600 hover:text-blue-900">👁 View</button>
                        <button
                          onClick={() => { setEditing(client); setForm({ name: client.name, email: client.email, consultantId: client.consultantId, status: client.status }); }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          ✏️ Edit
                        </button>
                        <button onClick={() => setConfirmDeleteId(client.id)} className="text-red-600 hover:text-red-900">🗑</button>
                        <button
                          onClick={() => toggleClientStatus(client)}
                          className={`${
                            client.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          } ${busyById[client.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!!busyById[client.id]}
                        >
                          {busyById[client.id] ? <Spinner size="xs" /> : (client.status === 'active' ? '🚫' : '✅')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.email}</p>
                  <p className="text-sm text-gray-600">Consultant: {getConsultantName(client.consultantId)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    client.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.status}
                  </span>
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    👁
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">{client.reportsCount} reports</span>
                  <span className="text-gray-500">Last: {new Date(client.lastActivity).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => toggleClientStatus(client)}
                  className={`${
                    client.status === 'active'
                      ? 'text-red-600 hover:text-red-900'
                      : 'text-green-600 hover:text-green-900'
                  } ${busyById[client.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!!busyById[client.id]}
                >
                  {busyById[client.id] ? <Spinner size="xs" /> : (client.status === 'active' ? 'Disable' : 'Enable')}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Client Details Modal */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{selectedClient.name}</h2>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedClient.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Consultant</label>
                    <p className="text-sm text-gray-900">{getConsultantName(selectedClient.consultantId)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedClient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedClient.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Total Reports</label>
                    <p className="text-sm text-gray-900">{selectedClient.reportsCount}</p>
                  </div>
                </div>

                {/* Recent Reports */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Reports</h3>
                  <div className="space-y-2">
                    {mockReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.type}</p>
                          <p className="text-xs text-gray-500">{report.date}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support Tickets */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Support Tickets</h3>
                  <div className="space-y-2">
                    {mockTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                          <p className="text-xs text-gray-500">Priority: {ticket.priority}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete Client"
        description="This will permanently remove the client. This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        loading={!!confirmDeleteId && deletingId === confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          const id = confirmDeleteId!;
          setDeletingId(id);
          setConfirmDeleteId(null);
          try {
            const c = clients.find(c => c.id === id);
            await deleteClient(id);
            showToast({ title: 'Client Deleted', message: `${c?.name || 'Client'} removed`, type: 'info' });
          } catch (err: any) {
            showToast({ title: 'Delete Failed', message: err?.message || 'Could not delete client', type: 'error' });
          } finally {
            setDeletingId(null);
          }
        }}
      />

      {/* Create/Edit Client Modal */}
      {(showCreate || editing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Client' : 'Create Client'}</h2>
              <button onClick={() => { editing ? setEditing(null) : setShowCreate(false); reset(); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={form.name} onChange={(e) => change('name', e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => change('email', e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultant</label>
                  <select value={form.consultantId} onChange={(e) => change('consultantId', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => change('status', e.target.value as Client['status'])} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { editing ? setEditing(null) : setShowCreate(false); reset(); }} disabled={isSubmitting}>Cancel</Button>
                <LoadingButton type="submit" loading={isSubmitting} loadingLabel={editing ? 'Saving…' : 'Creating…'}>
                  {editing ? 'Save Changes' : 'Create'}
                </LoadingButton>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}