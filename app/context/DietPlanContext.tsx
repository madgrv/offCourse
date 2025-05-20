'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { DietData } from '@/app/lib/types';
import { getDietData } from '@/app/lib/data';
import { useAuth } from './auth-context';

interface DietPlanContextType {
  dietPlan: DietData | null;
  loading: boolean;
  error: string | null;
  refreshDietPlan: () => Promise<void>;
}

const DietPlanContext = createContext<DietPlanContextType>({
  dietPlan: null,
  loading: true,
  error: null,
  refreshDietPlan: async () => {},
});

export const useDietPlan = () => useContext(DietPlanContext);

export function DietPlanProvider({ children }: { children: ReactNode }) {
  const [dietPlan, setDietPlan] = useState<DietData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDietPlan = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDietData();
      setDietPlan(data);
    } catch (err) {
      console.error('Error in fetchDietPlan:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load diet plan data'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDietPlan();
  }, [user, fetchDietPlan]);

  const refreshDietPlan = async () => {
    await fetchDietPlan();
  };

  return (
    <DietPlanContext.Provider
      value={{ dietPlan, loading, error, refreshDietPlan }}
    >
      {children}
    </DietPlanContext.Provider>
  );
}
