/**
 * Backend Mode Switcher Component
 * Allows switching between local database and Frappe backend modes
 */

'use client';

import React from 'react';
import { clientRepository } from '../repositories/clientRepository';
import Button from '../../components/ui/Button';

export default function BackendSwitcher() {
  const [currentMode, setCurrentMode] = React.useState<'local' | 'frappe'>('local');
  const [isSwitching, setIsSwitching] = React.useState(false);

  React.useEffect(() => {
    setCurrentMode(clientRepository.getApiMode());
  }, []);

  const handleModeSwitch = async (newMode: 'local' | 'frappe') => {
    if (newMode === currentMode) return;
    
    setIsSwitching(true);
    try {
      clientRepository.setApiMode(newMode);
      setCurrentMode(newMode);
      
      // Store the preference
      localStorage.setItem('consultflow:api:mode', newMode);
      
      // Show feedback
      console.log(`✅ Switched to ${newMode} backend mode`);
      
      // Refresh the page to reload data from new backend
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch backend mode:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  // Load saved preference on mount
  React.useEffect(() => {
    const savedMode = localStorage.getItem('consultflow:api:mode') as 'local' | 'frappe';
    if (savedMode && savedMode !== currentMode) {
      clientRepository.setApiMode(savedMode);
      setCurrentMode(savedMode);
    }
  }, [currentMode]);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-deep-navy">Backend:</span>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={currentMode === 'local' ? 'primary' : 'ghost'}
          onClick={() => handleModeSwitch('local')}
          disabled={isSwitching}
        >
          📁 Local DB
        </Button>
        
        <Button
          size="sm"
          variant={currentMode === 'frappe' ? 'primary' : 'ghost'}
          onClick={() => handleModeSwitch('frappe')}
          disabled={isSwitching || true} // Disabled until Frappe implementation is ready
        >
          🌐 Frappe {currentMode === 'frappe' ? '' : '(Soon)'}
        </Button>
      </div>
      
      {isSwitching && (
        <span className="text-xs text-deep-navy/70">Switching...</span>
      )}
    </div>
  );
}

// Hook to access backend mode state
export function useBackendMode() {
  const [mode, setMode] = React.useState<'local' | 'frappe'>('local');

  React.useEffect(() => {
    setMode(clientRepository.getApiMode());
  }, []);

  const switchMode = (newMode: 'local' | 'frappe') => {
    clientRepository.setApiMode(newMode);
    setMode(newMode);
    localStorage.setItem('consultflow:api:mode', newMode);
  };

  return { mode, switchMode };
}