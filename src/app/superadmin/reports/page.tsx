'use client';

import { useSuperAdminStore } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo, useState } from 'react';
import { showToast } from '../../../shared/components/Toast';
import Spinner from '../../../shared/components/Spinner';
import LoadingButton from '../../../shared/components/LoadingButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuperAdminReportsPage() {
  const reports = useSuperAdminStore((state) => state.reports);
  const consultants = useSuperAdminStore((state) => state.consultants);
  const clients = useSuperAdminStore((state) => state.clients);
  const createReport = useSuperAdminStore((state) => state.createReport);
  const updateReport = useSuperAdminStore((state) => state.updateReport);
  const [showCreate, setShowCreate] = useState(false);
  const initial = useMemo(() => ({ consultantId: consultants[0]?.id || '', clientId: '', type: 'P&L', status: 'pending' }), [consultants]);
  const [form, setForm] = useState(initial);
  const [isCreating, setIsCreating] = useState(false);
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const change = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      await createReport({ ...form } as any);
      setShowCreate(false);
      setForm(initial);
      showToast({ title: 'Report Created', message: 'The report has been created successfully.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Create Failed', message: err?.message || 'Unable to create report.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  // Mock data for demonstration
  const reportStatusData = [
    { name: 'Approved', value: 45, color: '#10b981' },
    { name: 'Rejected', value: 12, color: '#ef4444' },
    { name: 'Pending', value: 23, color: '#f59e0b' },
  ];

  const monthlyReportsData = [
    { month: 'Jan', reports: 12 },
    { month: 'Feb', reports: 19 },
    { month: 'Mar', reports: 15 },
    { month: 'Apr', reports: 22 },
    { month: 'May', reports: 28 },
    { month: 'Jun', reports: 35 },
  ];

  const consultantReportsData = consultants.map(consultant => ({
    name: consultant.name.split(' ')[0], // First name only
    reports: consultant.clientsCount * 3, // Mock calculation
  }));

  const handleExportCSV = () => {
    // Mock CSV export
    const csvContent = 'Consultant,Reports,Status\n' +
      consultants.map(c => `${c.name},${c.clientsCount * 3},Active`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consultant-reports.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Mock PDF export - in real app would use jsPDF or similar
    alert('PDF export functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <Button variant="ghost" onClick={handleExportCSV}>
            📊 Export CSV
          </Button>
          <Button variant="ghost" onClick={handleExportPDF}>
            📄 Export PDF
          </Button>
          <Button onClick={() => setShowCreate(true)}>+ Create Report</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{reports.length + 80}</div>
            <div className="text-sm text-gray-500">Total Reports</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round((45/80)*100)}%</div>
            <div className="text-sm text-gray-500">Approval Rate</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{consultants.length}</div>
            <div className="text-sm text-gray-500">Active Consultants</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{consultants.reduce((sum, c) => sum + c.clientsCount, 0)}</div>
            <div className="text-sm text-gray-500">Total Clients</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Status Distribution */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {reportStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Reports Trend */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Reports Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyReportsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="reports" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Consultant Performance */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Consultant Report Generation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={consultantReportsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="reports" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Reports Table */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consultant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.slice(-10).reverse().map((r) => {
                const consultant = consultants.find(c => c.id === r.consultantId);
                const client = clients.find(cl => cl.id === r.clientId);
                const statusClass = r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
                return (
                  <tr key={r.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{consultant?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>{r.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={r.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          if (savingById[r.id]) return;
                          setSavingById((s) => ({ ...s, [r.id]: true }));
                          try {
                            await updateReport(r.id, { status: newStatus as any });
                            showToast({ title: 'Status Updated', message: `Report status set to ${newStatus}.`, type: 'success' });
                          } catch (err: any) {
                            showToast({ title: 'Update Failed', message: err?.message || 'Could not update status.', type: 'error' });
                          } finally {
                            setSavingById((s) => ({ ...s, [r.id]: false }));
                          }
                        }}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                        disabled={!!savingById[r.id]}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="under_review">Under Review</option>
                      </select>
                      {savingById[r.id] && (
                        <span className="ml-2 align-middle"><Spinner size="xs" /></span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Report Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Create Report</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultant</label>
                  <select value={form.consultantId} onChange={(e) => change('consultantId', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select value={form.clientId} onChange={(e) => change('clientId', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={form.type} onChange={(e) => change('type', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="P&L">P&L</option>
                      <option value="Balance Sheet">Balance Sheet</option>
                      <option value="Cash Flow">Cash Flow</option>
                      <option value="Forecast">Forecast</option>
                      <option value="Tax Report">Tax Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => change('status', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="under_review">Under Review</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} disabled={isCreating}>Cancel</Button>
                  <LoadingButton type="submit" loading={isCreating} loadingLabel="Creating…">Create</LoadingButton>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}