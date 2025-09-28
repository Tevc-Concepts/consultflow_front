'use client';

import { useState } from 'react';
import { useSuperAdminStore } from '../../../features/superadmin/store';
import { Consultant } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuperAdminConsultantsPage() {
  const consultants = useSuperAdminStore((state) => state.consultants);
  const updateConsultant = useSuperAdminStore((state) => state.updateConsultant);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const toggleStatus = (consultant: Consultant) => {
    const newStatus = consultant.status === 'active' ? 'suspended' : 'active';
    updateConsultant(consultant.id, { status: newStatus });
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
                          }`}
                        >
                          {consultant.status === 'active' ? '🚫' : '✅'}
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
                  }`}
                >
                  {consultant.status === 'active' ? 'Suspend' : 'Activate'}
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
                        <Button size="sm" variant="ghost">
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

      {/* Create Consultant Modal/Form would go here */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-4">Create Consultant</h2>
              <p className="text-gray-600 mb-4">Form implementation coming soon...</p>
              <Button onClick={() => setShowCreateForm(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}