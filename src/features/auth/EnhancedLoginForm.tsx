/**
 * Enhanced Login Form with ConsultFlow Database Integration
 * Provides role-based login with demo credential hints
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './store';
import { getDemoCredentials } from '../../shared/hooks/useConsultFlowDB';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'consultant' | 'client' | 'superadmin' | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  
  const { login, isLoading, error, clearError, mode } = useAuthStore();
  const router = useRouter();

  const demoCredentials = getDemoCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!username.trim() || !password.trim()) {
      return;
    }

    const success = await login({ username: username.trim(), password: password.trim() });
    
    if (success) {
      onSuccess?.();
      // Router will handle redirect based on role
      router.push('/dashboard');
    }
  };

  const handleDemoLogin = (credentials: { email?: string; username?: string; password: string }, role: string) => {
    const loginId = credentials.email || credentials.username || '';
    setUsername(loginId);
    setPassword(credentials.password);
    setSelectedRole(role as any);
    setShowCredentials(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl bg-white/80 backdrop-blur-sm border-0">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
            >
              CF
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to ConsultFlow
            </h1>
            <p className="text-gray-600 text-sm">
              Mode: <span className="font-semibold capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{mode}</span>
            </p>
          </div>

          {/* Role Selection Hints */}
          <div className="mb-6 space-y-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {(['superadmin', 'consultant', 'client'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role === 'superadmin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Email / Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email or username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo Credentials Toggle */}
          {mode === 'demo' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showCredentials ? 'Hide' : 'Show'} Demo Credentials
              </button>

              {showCredentials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {/* SuperAdmin */}
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-red-800 text-sm mb-2 flex items-center">
                      🛡️ SuperAdmin
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin(demoCredentials.superAdmin, 'superadmin')}
                      className="w-full text-left text-xs bg-white p-2 rounded border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-mono">
                        <div><strong>User:</strong> {demoCredentials.superAdmin.username}</div>
                        <div><strong>Pass:</strong> {demoCredentials.superAdmin.password}</div>
                      </div>
                    </button>
                  </div>

                  {/* Consultants */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 text-sm mb-2 flex items-center">
                      👩‍💼 Consultants
                    </h4>
                    <div className="space-y-2">
                      {demoCredentials.consultants.map((consultant, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDemoLogin(consultant, 'consultant')}
                          className="w-full text-left text-xs bg-white p-2 rounded border hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-mono">
                            <div><strong>Name:</strong> {consultant.name}</div>
                            <div><strong>Email:</strong> {consultant.email}</div>
                            <div><strong>Pass:</strong> {consultant.password}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 text-sm mb-2 flex items-center">
                      👨‍💼 Clients
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {demoCredentials.clients.map((client, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDemoLogin(client, 'client')}
                          className="w-full text-left text-xs bg-white p-2 rounded border hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-mono">
                            <div><strong>Name:</strong> {client.name}</div>
                            <div><strong>Email:</strong> {client.email}</div>
                            <div><strong>Pass:</strong> {client.password}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}