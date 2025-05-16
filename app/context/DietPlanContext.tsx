'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DietData } from '@/app/lib/types';
import { getDietData } from '@/app/lib/data';

// Define the context type
interface DietPlanContextType {
  dietPlan: DietData | null;
  loading: boolean;
  error: string | null;
  refreshDietPlan: () => Promise<void>;
}

// Create the context with default values
const DietPlanContext = createContext<DietPlanContextType>({
  dietPlan: null,
  loading: true,
  error: null,
  refreshDietPlan: async () => {},
});

// Custom hook to use the diet plan context
export const useDietPlan = () => useContext(DietPlanContext);

// Provider component
export function DietPlanProvider({ children }: { children: ReactNode }) {
  const [dietPlan, setDietPlan] = useState<DietData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch diet plan data
  const fetchDietPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDietData();
      
      setDietPlan(data);
    } catch (err) {
      
      setError('Failed to load diet plan data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch diet plan on mount
  useEffect(() => {
    fetchDietPlan();
  }, []);

  // Function to refresh diet plan data
  const refreshDietPlan = async () => {
    await fetchDietPlan();
  };

  return (
    <DietPlanContext.Provider value={{ dietPlan, loading, error, refreshDietPlan }}>
      {children}
    </DietPlanContext.Provider>
  );
}
