'use client';

import { useSuperAdminStore } from '../../../features/superadmin/store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function SuperAdminDashboardPage() {
  const consultants = useSuperAdminStore((state) => state.consultants);
  const clients = useSuperAdminStore((state) => state.clients);
  const subscriptions = useSuperAdminStore((state) => state.consultantSubscriptions);

  const totalConsultants = consultants.length;
  const totalClients = clients.length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const totalReports = 0; // TODO: calculate from reports

  // Mock data for charts
  const consultantGrowthData = [
    { month: 'Jan', consultants: 1 },
    { month: 'Feb', consultants: 1 },
    { month: 'Mar', consultants: 2 },
    { month: 'Apr', consultants: 2 },
    { month: 'May', consultants: 2 },
    { month: 'Jun', consultants: totalConsultants },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 49 },
    { month: 'Feb', revenue: 49 },
    { month: 'Mar', revenue: 98 },
    { month: 'Apr', revenue: 98 },
    { month: 'May', revenue: 98 },
    { month: 'Jun', revenue: activeSubscriptions * 50 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Consultants</h3>
          <p className="text-2xl font-semibold text-gray-900">{totalConsultants}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
          <p className="text-2xl font-semibold text-gray-900">{totalClients}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Reports Generated</h3>
          <p className="text-2xl font-semibold text-gray-900">{totalReports}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Subscriptions Active</h3>
          <p className="text-2xl font-semibold text-gray-900">{activeSubscriptions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Consultant Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consultantGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="consultants" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}