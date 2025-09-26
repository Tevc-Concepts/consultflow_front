/**
 * Responsive Login Page
 * Mobile-first design with demo/live mode switching
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { useAuthStore } from '@features/auth/store';
import type { AuthMode } from '@features/auth/repository';

export default function LoginPage() {
  const router = useRouter();
  const { 
    login, 
    setMode, 
    isLoading, 
    error, 
    clearError, 
    mode, 
    isAuthenticated 
  } = useAuthStore();

  const [formData, setFormData] = React.useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [selectedMode, setSelectedMode] = React.useState<AuthMode>(mode);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const { user } = useAuthStore.getState();
      if (user?.role === 'consultant') {
        router.push('/dashboard');
      } else if (user?.role === 'client') {
        router.push('/client');
      }
    }
  }, [isAuthenticated, router]);

  // Clear error when form changes
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !formData.username.trim() || !formData.password.trim()) {
      return;
    }

    // Set mode before login
    if (selectedMode !== mode) {
      setMode(selectedMode);
    }

    const success = await login({
      username: formData.username.trim(),
      password: formData.password
    });

    if (success) {
      const { user } = useAuthStore.getState();
      
      // Show success toast
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Login Successful',
          message: `Welcome back, ${user?.firstName || user?.username}!`,
          type: 'success'
        }
      });
      window.dispatchEvent(event);

      // Redirect based on role
      if (user?.role === 'consultant') {
        router.push('/dashboard');
      } else if (user?.role === 'client') {
        router.push('/client');
      }
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const isValid = formData.username.trim() && formData.password.trim();

  // Demo user credentials for easy access
  const demoUsers = [
    { username: 'consultant1', password: 'demo123', role: 'Consultant', name: 'Sarah Johnson' },
    { username: 'client1', password: 'demo123', role: 'Client', name: 'Emily Rodriguez' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
        data-testid="login-page"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-deep-navy to-cobalt bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            ConsultFlow
          </motion.h1>
          <motion.p 
            className="text-deep-navy/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Financial Analytics & Advisory Platform
          </motion.p>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 md:p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0">
          {/* Mode Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-deep-navy mb-3">
              Environment
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-medium/10 rounded-xl">
              {(['demo', 'live'] as AuthMode[]).map((modeOption) => (
                <button
                  key={modeOption}
                  type="button"
                  onClick={() => setSelectedMode(modeOption)}
                  className={`
                    flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedMode === modeOption
                      ? modeOption === 'demo'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                      : 'text-deep-navy/60 hover:text-deep-navy hover:bg-medium/20'
                    }
                  `}
                  data-testid={`mode-${modeOption}`}
                >
                  <span>{modeOption === 'demo' ? '🟠' : '🟢'}</span>
                  <span>{modeOption === 'demo' ? 'Demo Mode' : 'Live Mode'}</span>
                </button>
              ))}
            </div>
            {selectedMode === 'demo' && (
              <p className="text-xs text-amber-600 mt-2">
                Demo mode uses mock data for testing and exploration
              </p>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-deep-navy mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-medium/60 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 transition-colors"
                data-testid="username-input"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-deep-navy mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="w-full rounded-xl border border-medium/60 px-4 py-3 pr-12 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 transition-colors"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-navy/40 hover:text-deep-navy/70 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-800">
                    <span className="mr-2">❌</span>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full py-3 text-sm font-medium"
              data-testid="login-button"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Card>

        {/* Demo Credentials */}
        {selectedMode === 'demo' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6"
          >
            <Card className="p-4 bg-amber-50/80 border border-amber-200/50">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                Demo Credentials
              </h3>
              <div className="space-y-2">
                {demoUsers.map((user) => (
                  <button
                    key={user.username}
                    onClick={() => {
                      setFormData({
                        username: user.username,
                        password: user.password
                      });
                      clearError();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-amber-100/50 transition-colors group"
                    disabled={isLoading}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-amber-800">
                        {user.name} ({user.role})
                      </span>
                      <span className="text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to fill
                      </span>
                    </div>
                    <div className="text-xs text-amber-600 font-mono">
                      {user.username} / {user.password}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p 
          className="text-center text-xs text-deep-navy/50 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          © 2025 ConsultFlow. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
