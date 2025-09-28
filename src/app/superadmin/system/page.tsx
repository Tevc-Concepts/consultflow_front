'use client';

import { useState } from 'react';
import { useSuperAdminStore } from '../../../features/superadmin/store';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface SystemHealth {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  lastCheck: string;
  responseTime: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ip: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export default function SuperAdminSystemPage() {
  const [activeTab, setActiveTab] = useState<'health' | 'logs' | 'announcements'>('health');

  // Mock system health data
  const systemHealth: SystemHealth[] = [
    {
      service: 'API Gateway',
      status: 'healthy',
      uptime: '99.9%',
      lastCheck: '2024-09-25T10:00:00Z',
      responseTime: '45ms'
    },
    {
      service: 'Database',
      status: 'healthy',
      uptime: '99.8%',
      lastCheck: '2024-09-25T10:00:00Z',
      responseTime: '12ms'
    },
    {
      service: 'File Storage',
      status: 'warning',
      uptime: '98.5%',
      lastCheck: '2024-09-25T09:58:00Z',
      responseTime: '89ms'
    },
    {
      service: 'Email Service',
      status: 'healthy',
      uptime: '99.7%',
      lastCheck: '2024-09-25T10:00:00Z',
      responseTime: '67ms'
    },
    {
      service: 'Cache Layer',
      status: 'error',
      uptime: '95.2%',
      lastCheck: '2024-09-25T09:55:00Z',
      responseTime: 'Timeout'
    }
  ];

  // Mock audit logs
  const auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2024-09-25T09:45:00Z',
      user: 'admin@consultflow.com',
      action: 'LOGIN',
      resource: 'Authentication',
      details: 'Successful login from Chrome browser',
      ip: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: '2024-09-25T09:30:00Z',
      user: 'admin@consultflow.com',
      action: 'UPDATE',
      resource: 'Consultant',
      details: 'Updated consultant John Smith permissions',
      ip: '192.168.1.100'
    },
    {
      id: '3',
      timestamp: '2024-09-25T09:15:00Z',
      user: 'admin@consultflow.com',
      action: 'CREATE',
      resource: 'Client',
      details: 'Created new client ABC Corp',
      ip: '192.168.1.100'
    },
    {
      id: '4',
      timestamp: '2024-09-25T08:50:00Z',
      user: 'admin@consultflow.com',
      action: 'DELETE',
      resource: 'Report',
      details: 'Deleted outdated quarterly report',
      ip: '192.168.1.100'
    }
  ];

  // Mock announcements
  const announcements: Announcement[] = [
    {
      id: '1',
      title: 'Scheduled Maintenance',
      message: 'System maintenance scheduled for Sunday 2AM-4AM UTC. Services may be unavailable.',
      type: 'warning',
      createdAt: '2024-09-20T10:00:00Z',
      expiresAt: '2024-09-29T04:00:00Z',
      isActive: true
    },
    {
      id: '2',
      title: 'New Feature Release',
      message: 'Advanced analytics dashboard is now available for all consultants.',
      type: 'success',
      createdAt: '2024-09-15T14:30:00Z',
      isActive: true
    },
    {
      id: '3',
      title: 'Security Update',
      message: 'Security patches have been applied. All users should log out and log back in.',
      type: 'info',
      createdAt: '2024-09-10T09:00:00Z',
      isActive: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const overallHealth = systemHealth.every(s => s.status === 'healthy')
    ? 'healthy'
    : systemHealth.some(s => s.status === 'error')
    ? 'error'
    : 'warning';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">System Monitoring</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Overall Status:</span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(overallHealth)}`}>
            {overallHealth.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card>
        <div className="flex space-x-1">
          {[
            { key: 'health', label: 'System Health' },
            { key: 'logs', label: 'Audit Logs' },
            { key: 'announcements', label: 'Announcements' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* System Health Tab */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systemHealth.map((service) => (
            <Card key={service.service}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{service.service}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{service.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-medium">{service.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Check:</span>
                    <span className="font-medium">{new Date(service.lastCheck).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <Button size="sm" variant="ghost">Export Logs</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">System Announcements</h3>
            <Button size="sm">Create Announcement</Button>
          </div>
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={`border-l-4 ${getAnnouncementColor(announcement.type)}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">{announcement.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {announcement.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </div>
                </div>
                <p className="text-gray-700">{announcement.message}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                  {announcement.expiresAt && (
                    <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}