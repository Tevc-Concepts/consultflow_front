'use client';

import { useMemo, useState } from 'react';
import { useSuperAdminStore } from '../../../features/superadmin/store';
import { Consultant } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '@shared/components/Toast';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import Spinner from '@shared/components/Spinner';
import LoadingButton from '@shared/components/LoadingButton';

export default function SuperAdminConsultantsPage() {
  const consultants = useSuperAdminStore((state) => state.consultants);
  const updateConsultant = useSuperAdminStore((state) => state.updateConsultant);
  const deleteConsultant = useSuperAdminStore((state) => state.deleteConsultant);
  const createConsultant = useSuperAdminStore((state) => state.createConsultant);
  const subscriptions = useSuperAdminStore((state) => state.subscriptions);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editing, setEditing] = useState<Consultant | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const initialForm = useMemo(() => ({
    name: '',
    email: '',
    plan: 'free' as Consultant['plan'],
    status: 'active' as Consultant['status'],
  }), []);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  const resetForm = () => setForm(initialForm);
  const handleChange = (key: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateConsultant(editing.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          plan: form.plan,
          subscriptionId: form.plan,
          status: form.status,
        });
        setEditing(null);
        showToast({ title: 'Consultant Updated', message: `${form.name} updated successfully`, type: 'success' });
      } else {
        await createConsultant({
          name: form.name.trim(),
          email: form.email.trim(),
          plan: form.plan,
          status: form.status,
          clientsCount: 0,
          subscriptionId: form.plan,
        } as any);
        setShowCreateForm(false);
        showToast({ title: 'Consultant Created', message: `${form.name} added successfully`, type: 'success' });
      }
    } catch (err: any) {
      showToast({ title: 'Action Failed', message: err?.message || 'Could not save consultant', type: 'error' });
    } finally { setIsSubmitting(false); }
    resetForm();
  };

  const toggleStatus = async (consultant: Consultant) => {
    if (busyById[consultant.id]) return;
    const newStatus = consultant.status === 'active' ? 'suspended' : 'active';
    setBusyById(s => ({ ...s, [consultant.id]: true }));
    try {
      await updateConsultant(consultant.id, { status: newStatus });
      showToast({ title: 'Consultant Updated', message: `${consultant.name} is now ${newStatus}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Update Failed', message: err?.message || 'Could not update status', type: 'error' });
    } finally {
      setBusyById(s => ({ ...s, [consultant.id]: false }));
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Consultant Management</h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <span>+</span>
          Add Consultant
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultants.map((consultant) => (
                  <tr key={consultant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{consultant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{consultant.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {consultant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        consultant.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {consultant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultant.clientsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleExpanded(consultant.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          👁
                        </button>
                        <button
                          onClick={() => toggleStatus(consultant)}
                          className={`${
                            consultant.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          } ${busyById[consultant.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!!busyById[consultant.id]}
                        >
                          {busyById[consultant.id] ? <Spinner size="xs" /> : (consultant.status === 'active' ? '🚫' : '✅')}
                        </button>
                        <button onClick={() => setConfirmDeleteId(consultant.id)} className="text-red-600 hover:text-red-900">🗑</button>
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
        {consultants.map((consultant) => (
          <Card key={consultant.id}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{consultant.name}</h3>
                  <p className="text-sm text-gray-500">{consultant.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    consultant.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {consultant.status}
                  </span>
                  <button
                    onClick={() => toggleExpanded(consultant.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {expandedRow === consultant.id ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {consultant.plan}
                  </span>
                  <span className="text-gray-500">{consultant.clientsCount} clients</span>
                </div>
                <button
                  onClick={() => toggleStatus(consultant)}
                  className={`${
                    consultant.status === 'active'
                      ? 'text-red-600 hover:text-red-900'
                      : 'text-green-600 hover:text-green-900'
                  } ${busyById[consultant.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!!busyById[consultant.id]}
                >
                  {busyById[consultant.id] ? '⏳' : consultant.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>

              <AnimatePresence>
                {expandedRow === consultant.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t pt-4"
                  >
                    <div className="space-y-2 text-sm">
                      <div><strong>Created:</strong> {new Date(consultant.createdAt).toLocaleDateString()}</div>
                      <div><strong>Subscription:</strong> {consultant.subscriptionId || 'None'}</div>
                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditing(consultant);
                          setForm({
                            name: consultant.name,
                            email: consultant.email,
                            plan: (consultant.subscriptionId as any) || consultant.plan,
                            status: consultant.status,
                          });
                        }}>
                          ✏️ Edit
                        </Button>
                        <Button size="sm" variant="ghost">
                          👁 View Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        ))}
      </div>

  {/* Create/Edit Consultant Modal */}
      {(showCreateForm || editing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Consultant' : 'Create Consultant'}</h2>
              <button
                onClick={() => { editing ? setEditing(null) : setShowCreateForm(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => handleChange('plan', e.target.value as Consultant['plan'])}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    {subscriptions.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value as Consultant['status'])}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { editing ? setEditing(null) : setShowCreateForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <LoadingButton type="submit" loading={isSubmitting} loadingLabel={editing ? 'Saving…' : 'Creating…'}>
                  {editing ? 'Save Changes' : 'Create'}
                </LoadingButton>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete Consultant"
        description="This will permanently remove the consultant. This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        loading={!!confirmDeleteId && deletingId === confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          const id = confirmDeleteId!;
          setDeletingId(id);
          setConfirmDeleteId(null);
          try {
            const c = consultants.find(c => c.id === id);
            await deleteConsultant(id);
            showToast({ title: 'Consultant Deleted', message: `${c?.name || 'Consultant'} removed`, type: 'info' });
          } catch (err: any) {
            showToast({ title: 'Delete Failed', message: err?.message || 'Could not delete consultant', type: 'error' });
          } finally {
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}