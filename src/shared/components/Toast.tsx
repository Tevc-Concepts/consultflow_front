/**
 * Toast Notification System
 * Simple toast notifications for user feedback
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const toastIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Listen for custom toast events
  React.useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { title, message, type } = event.detail;
      addToast({ title, message, type });
    };

    window.addEventListener('show-toast', handleToast as EventListener);
    return () => window.removeEventListener('show-toast', handleToast as EventListener);
  }, [addToast]);

  return (
    <>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`
                p-4 rounded-xl border shadow-lg backdrop-blur-sm
                ${toastStyles[toast.type]}
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {toastIcons[toast.type]}
                </span>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">
                    {toast.title}
                  </h4>
                  <p className="text-sm opacity-90 mt-1">
                    {toast.message}
                  </p>
                </div>
                
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export const showToast = (toast: Omit<Toast, 'id'>) => {
  const event = new CustomEvent('show-toast', {
    detail: toast
  });
  window.dispatchEvent(event);
};