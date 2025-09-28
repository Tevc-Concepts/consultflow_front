'use client';

import { useSuperAdminStore } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SuperAdminReportsPage() {
  const reports = useSuperAdminStore((state) => state.reports);
  const consultants = useSuperAdminStore((state) => state.consultants);

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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Mock data for demonstration */}
              {[
                { consultant: 'John Smith', client: 'ABC Corp', type: 'P&L Statement', status: 'approved', date: '2024-09-25' },
                { consultant: 'Sarah Johnson', client: 'Tech Solutions', type: 'Balance Sheet', status: 'pending', date: '2024-09-24' },
                { consultant: 'John Smith', client: 'XYZ Ltd', type: 'Tax Summary', status: 'approved', date: '2024-09-23' },
                { consultant: 'Sarah Johnson', client: 'ABC Corp', type: 'Cash Flow', status: 'rejected', date: '2024-09-22' },
              ].map((report, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.consultant}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}