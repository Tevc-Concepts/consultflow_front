/**
 * ConsultFlow B2B SaaS Demo Page
 * Comprehensive demonstration of all features and roles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoleBasedData } from '../../shared/providers/DatabaseProvider';
import { useConsultFlowAuth } from '../../shared/hooks/useConsultFlowDB';
import { consultFlowDB } from '../../shared/api/consultflowDB';
import { getDemoCredentials } from '../../shared/hooks/useConsultFlowDB';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function DemoPage() {
  const { currentUser, login, logout, isAuthenticated } = useConsultFlowAuth();
  const { data: roleData, isLoading: dataLoading } = useRoleBasedData(currentUser);
  const [selectedView, setSelectedView] = useState<'overview' | 'data' | 'interactions'>('overview');
  const [demoStep, setDemoStep] = useState(0);

  const demoCredentials = getDemoCredentials();

  // Demo script steps
  const demoSteps = [
    {
      title: 'Welcome to ConsultFlow',
      description: 'A comprehensive B2B SaaS platform for financial consulting and client management.',
      action: 'start'
    },
    {
      title: 'SuperAdmin Access',
      description: 'Login as SuperAdmin to see platform-wide analytics and management.',
      action: 'login_superadmin'
    },
    {
      title: 'Consultant Portal',
      description: 'Experience the consultant dashboard with client management and reporting.',
      action: 'login_consultant'
    },
    {
      title: 'Client Experience',
      description: 'View the client portal with company data and support tickets.',
      action: 'login_client'
    },
    {
      title: 'Data Interactions',
      description: 'See real-time data operations and cross-role interactions.',
      action: 'show_interactions'
    }
  ];

  const quickLogin = async (type: 'superadmin' | 'consultant' | 'client', index = 0) => {
    let credentials;
    
    switch (type) {
      case 'superadmin':
        credentials = { email: demoCredentials.superAdmin.username, password: demoCredentials.superAdmin.password };
        break;
      case 'consultant':
        credentials = demoCredentials.consultants[index] || demoCredentials.consultants[0];
        break;
      case 'client':
        credentials = demoCredentials.clients[index] || demoCredentials.clients[0];
        break;
    }

    const loginCredentials = credentials.email || (credentials as any).username || '';
    await login(loginCredentials, credentials.password, type);
  };

  const executeStep = async (step: number) => {
    const action = demoSteps[step]?.action;
    
    switch (action) {
      case 'start':
        setSelectedView('overview');
        break;
      case 'login_superadmin':
        await quickLogin('superadmin');
        setSelectedView('data');
        break;
      case 'login_consultant':
        await quickLogin('consultant');
        setSelectedView('data');
        break;
      case 'login_client':
        await quickLogin('client');
        setSelectedView('data');
        break;
      case 'show_interactions':
        setSelectedView('interactions');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ConsultFlow B2B SaaS Platform
          </motion.h1>
          <p className="text-gray-600 text-lg">
            Comprehensive Financial Consulting & Client Management Solution
          </p>
        </div>

        {/* Current User Status */}
        {isAuthenticated && currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {currentUser.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentUser.name}</h3>
                    <p className="text-sm text-gray-600">
                      {currentUser.role.toUpperCase()} • {currentUser.email}
                      {currentUser.subscriptionPlan && ` • ${currentUser.subscriptionPlan}`}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Logout
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Demo Steps Navigation */}
        <div className="mb-8">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Interactive Demo Journey</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {demoSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDemoStep(index);
                    executeStep(index);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    demoStep === index
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}. {step.title}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
              <strong>{demoSteps[demoStep]?.title}:</strong> {demoSteps[demoStep]?.description}
            </div>
          </Card>
        </div>

        {/* View Selection */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {(['overview', 'data', 'interactions'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  selectedView === view
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Views */}
        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <OverviewView key="overview" />
          )}
          {selectedView === 'data' && (
            <DataView key="data" currentUser={currentUser} roleData={roleData} isLoading={dataLoading} />
          )}
          {selectedView === 'interactions' && (
            <InteractionsView key="interactions" />
          )}
        </AnimatePresence>

        {/* Quick Access Panel */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Login Demo</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {/* SuperAdmin */}
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">🛡️ SuperAdmin</h4>
                  <p className="text-sm text-red-700 mb-3">Platform administration and analytics</p>
                  <Button
                    onClick={() => quickLogin('superadmin')}
                    size="sm"
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    Login as Admin
                  </Button>
                </div>

                {/* Consultant */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">👩‍💼 Consultant</h4>
                  <p className="text-sm text-blue-700 mb-3">Client management and reporting</p>
                  <Button
                    onClick={() => quickLogin('consultant')}
                    size="sm"
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    Login as Consultant
                  </Button>
                </div>

                {/* Client */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">👨‍💼 Client</h4>
                  <p className="text-sm text-green-700 mb-3">Company data and support access</p>
                  <Button
                    onClick={() => quickLogin('client')}
                    size="sm"
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Login as Client
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Overview Component
function OverviewView() {
  const allData = consultFlowDB.getAllData();
  
  const features = [
    {
      title: 'Multi-Role Authentication',
      description: 'SuperAdmin, Consultant, and Client roles with different access levels',
      icon: '🔐',
      stats: [`${allData.consultants?.length || 0} Consultants`, `${allData.clients?.length || 0} Clients`]
    },
    {
      title: 'Company Management',
      description: 'Multi-entity client companies with financial data tracking',
      icon: '🏢',
      stats: [`${allData.companies?.length || 0} Companies`, 'Multi-currency support']
    },
    {
      title: 'Financial Reports',
      description: 'Comprehensive P&L, Balance Sheet, and Cash Flow reports',
      icon: '📊',
      stats: [`${allData.financialReports?.length || 0} Reports`, 'Multiple formats']
    },
    {
      title: 'Support System',
      description: 'Integrated ticketing system for client-consultant communication',
      icon: '🎫',
      stats: [`${allData.tickets?.length || 0} Tickets`, 'Real-time updates']
    },
    {
      title: 'Document Management',
      description: 'Secure document storage and collaboration workflows',
      icon: '📄',
      stats: [`${allData.documents?.length || 0} Documents`, 'Version control']
    },
    {
      title: 'Subscription Management',
      description: 'Flexible subscription plans with different feature tiers',
      icon: '💰',
      stats: [`${allData.subscriptionPlans?.length || 0} Plans`, 'Usage tracking']
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{feature.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <div className="space-y-1">
                    {feature.stats.map((stat, i) => (
                      <div key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mr-2">
                        {stat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Data View Component
function DataView({ currentUser, roleData, isLoading }: any) {
  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-gray-500 text-lg">Please login to view role-specific data</p>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading role data...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          {currentUser.role.toUpperCase()} Dashboard Data
        </h3>
        
        {roleData && (
          <div className="space-y-4">
            {/* Stats */}
            {roleData.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(roleData.stats).map(([key, value]: [string, any]) => (
                  <div key={key} className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{value}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Role-specific content preview */}
            <div className="mt-6">
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96 text-gray-700">
                {JSON.stringify(roleData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// Interactions View Component
function InteractionsView() {
  const [log, setLog] = useState<string[]>([]);
  const allData = consultFlowDB.getAllData();

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testInteraction = async (type: string) => {
    switch (type) {
      case 'create_ticket':
        addLog('Creating new support ticket...');
        // Simulate ticket creation
        setTimeout(() => addLog('✅ Support ticket created successfully'), 500);
        break;
      case 'generate_report':
        addLog('Generating financial report...');
        setTimeout(() => addLog('✅ P&L Report generated for Q4 2024'), 1000);
        break;
      case 'update_company':
        addLog('Updating company information...');
        setTimeout(() => addLog('✅ Company profile updated'), 750);
        break;
      case 'consultant_review':
        addLog('Consultant reviewing client data...');
        setTimeout(() => addLog('✅ Review completed with recommendations'), 1200);
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Database Overview */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Database Overview</h3>
          <div className="space-y-3">
            {[
              { key: 'Consultants', value: allData.consultants?.length || 0, color: 'blue' },
              { key: 'Clients', value: allData.clients?.length || 0, color: 'green' },
              { key: 'Companies', value: allData.companies?.length || 0, color: 'purple' },
              { key: 'Reports', value: allData.financialReports?.length || 0, color: 'yellow' },
              { key: 'Tickets', value: allData.tickets?.length || 0, color: 'red' },
              { key: 'Documents', value: allData.documents?.length || 0, color: 'indigo' },
            ].map(({ key, value, color }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-700">{key}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Test Interactions */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Test Interactions</h3>
          <div className="space-y-2">
            {[
              { label: 'Create Support Ticket', action: 'create_ticket' },
              { label: 'Generate Report', action: 'generate_report' },
              { label: 'Update Company', action: 'update_company' },
              { label: 'Consultant Review', action: 'consultant_review' },
            ].map(({ label, action }) => (
              <Button
                key={action}
                onClick={() => testInteraction(action)}
                className="w-full justify-start border border-gray-200 hover:bg-gray-50"
              >
                {label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Activity Log</h3>
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-gray-500">No activities yet. Test some interactions above.</p>
          ) : (
            log.map((entry, index) => (
              <div key={index} className="mb-1">
                {entry}
              </div>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
}