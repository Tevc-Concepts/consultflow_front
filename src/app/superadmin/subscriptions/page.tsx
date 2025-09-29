'use client';

import { useMemo, useState } from 'react';
import { useSuperAdminStore } from '../../../features/superadmin/store';
import { Subscription, ConsultantSubscription } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '@shared/components/Toast';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import Spinner from '@shared/components/Spinner';
import LoadingButton from '@shared/components/LoadingButton';

export default function SuperAdminSubscriptionsPage() {
  const subscriptions = useSuperAdminStore((state) => state.subscriptions);
  const consultants = useSuperAdminStore((state) => state.consultants);
  const consultantSubscriptions = useSuperAdminStore((state) => state.consultantSubscriptions);
  const assignSubscription = useSuperAdminStore((state) => state.assignSubscription);
  const deleteSubscription = useSuperAdminStore((state) => state.deleteSubscription);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [busyPlan, setBusyPlan] = useState<Record<string, boolean>>({});
  const [assigningFor, setAssigningFor] = useState<string | null>(null);
  const createSubscription = useSuperAdminStore((state) => state.createSubscription);
  const [planForm, setPlanForm] = useState({ name: 'Pro', price: 0, maxClients: 10, maxReports: 100, storageGB: 10, features: '' });
  const updatePlanField = (k: string, v: any) => setPlanForm(prev => ({ ...prev, [k]: v }));
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: planForm.name as any,
      price: Number(planForm.price) || 0,
      maxClients: Number(planForm.maxClients) || -1,
      maxReports: Number(planForm.maxReports) || -1,
      storageGB: Number(planForm.storageGB) || 0,
      features: planForm.features.split(',').map(f => f.trim()).filter(Boolean),
    };
    if (isCreatingPlan) return;
    setIsCreatingPlan(true);
    try {
      await createSubscription(payload as any);
      setShowCreateForm(false);
      setPlanForm({ name: 'Pro', price: 0, maxClients: 10, maxReports: 100, storageGB: 10, features: '' });
      showToast({ title: 'Plan Created', message: `${payload.name} plan added`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Create Failed', message: err?.message || 'Could not create plan', type: 'error' });
    } finally {
      setIsCreatingPlan(false);
    }
  };
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAssignSubscription = async (consultantId: string, subscriptionId: string) => {
    if (assigningFor) return;
    setAssigningFor(consultantId);
    try {
      await assignSubscription(consultantId, subscriptionId);
      setSelectedConsultant(null);
      showToast({ title: 'Plan Assigned', message: 'Subscription updated successfully.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Assignment Failed', message: err?.message || 'Could not assign plan', type: 'error' });
    } finally {
      setAssigningFor(null);
    }
  };

  const getConsultantSubscription = (consultantId: string) => {
    return consultantSubscriptions.find(cs => cs.consultantId === consultantId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Subscription & Billing Management</h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <span>+</span>
          Create Plan
        </Button>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id} className="relative">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">₦{subscription.price.toLocaleString()}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-gray-600">
                <li>Max Clients: {subscription.maxClients === -1 ? 'Unlimited' : subscription.maxClients}</li>
                <li>Max Reports: {subscription.maxReports === -1 ? 'Unlimited' : subscription.maxReports}</li>
                <li>Storage: {subscription.storageGB === -1 ? 'Unlimited' : `${subscription.storageGB}GB`}</li>
                {subscription.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
              <div className="mt-4">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(subscription.id)} disabled={!!busyPlan[subscription.id]}>
                  {busyPlan[subscription.id] ? <Spinner label="Deleting…" size="xs" /> : '🗑 Delete Plan'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Confirm Delete Plan */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete Plan"
        description="This will permanently remove the subscription plan."
        confirmText="Delete"
        confirmVariant="danger"
        loading={!!(confirmDeleteId && busyPlan[confirmDeleteId])}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          const id = confirmDeleteId!;
          setBusyPlan(s => ({ ...s, [id]: true }));
          try {
            const plan = subscriptions.find(p => p.id === id);
            await deleteSubscription(id);
            showToast({ title: 'Plan Deleted', message: `${plan?.name || 'Plan'} removed`, type: 'info' });
            setConfirmDeleteId(null);
          } catch (err: any) {
            showToast({ title: 'Delete Failed', message: err?.message || 'Could not delete plan', type: 'error' });
          } finally {
            setBusyPlan(s => ({ ...s, [id]: false }));
          }
        }}
      />

      {/* Consultant Subscriptions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultant Subscriptions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consultant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultants.map((consultant) => {
                const subscription = getConsultantSubscription(consultant.id);
                const plan = subscriptions.find(s => s.id === consultant.plan);

                return (
                  <tr key={consultant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{consultant.name}</div>
                      <div className="text-sm text-gray-500">{consultant.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {plan?.name || 'No Plan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscription?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription?.status || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedConsultant(consultant.id)}
                      >
                        Change Plan
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Change Plan Modal */}
      <AnimatePresence>
        {selectedConsultant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Change Subscription Plan</h2>
              <div className="space-y-3">
                {subscriptions.map((subscription) => (
                  <button
                    key={subscription.id}
                    onClick={() => handleAssignSubscription(selectedConsultant, subscription.id)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{subscription.name}</div>
                    <div className="text-sm text-gray-500">₦{subscription.price.toLocaleString()}/month</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <LoadingButton variant="ghost" onClick={() => setSelectedConsultant(null)} loading={!!assigningFor} loadingLabel="Working…" spinnerSize="xs">
                  Cancel
                </LoadingButton>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Create Subscription Plan</h2>
              <form onSubmit={handleCreatePlan} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <select
                      value={planForm.name}
                      onChange={(e) => updatePlanField('name', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option>Free</option>
                      <option>Pro</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                    <input type="number" value={planForm.price} onChange={(e) => updatePlanField('price', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Clients</label>
                    <input type="number" value={planForm.maxClients} onChange={(e) => updatePlanField('maxClients', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Reports</label>
                    <input type="number" value={planForm.maxReports} onChange={(e) => updatePlanField('maxReports', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage (GB)</label>
                    <input type="number" value={planForm.storageGB} onChange={(e) => updatePlanField('storageGB', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                  <input type="text" value={planForm.features} onChange={(e) => updatePlanField('features', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Advanced reporting, Priority support" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)} disabled={isCreatingPlan}>Cancel</Button>
                  <LoadingButton type="submit" loading={isCreatingPlan} loadingLabel="Creating…">
                    Create Plan
                  </LoadingButton>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}