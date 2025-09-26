/**
 * Database Seeder Component
 * Automatically seeds the local database with demo data on app initialization
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../features/auth/store';

export default function DatabaseSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const { mode } = useAuthStore();

  useEffect(() => {
    // Only seed in demo mode and if not already seeded
    if (mode === 'demo' && !isSeeded && !isSeeding) {
      seedDatabase();
    }
  }, [mode, isSeeded, isSeeding]);

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/local/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Database seeded successfully:', result.message);
        setIsSeeded(true);
        
        // Store seeding status in localStorage to avoid re-seeding
        localStorage.setItem('consultflow:db:seeded', 'true');
      } else {
        console.error('❌ Database seeding failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Database seeding error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  // Check if already seeded from localStorage
  useEffect(() => {
    const wasSeeded = localStorage.getItem('consultflow:db:seeded');
    if (wasSeeded === 'true') {
      setIsSeeded(true);
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}

// Export a hook for manual seeding if needed
export function useManualSeed() {
  const [isSeeding, setIsSeeding] = useState(false);

  const triggerSeed = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/local/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Manual seeding error:', error);
      return { success: false, error: (error as Error).message || 'Unknown error' };
    } finally {
      setIsSeeding(false);
    }
  };

  return { triggerSeed, isSeeding };
}