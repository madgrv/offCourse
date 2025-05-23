'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { DietData } from '@/app/lib/types';
import { useDietPlanData } from '@/app/hooks/useDietPlanData';

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
  const { dietPlan, isLoading, error, refreshDietPlan } = useDietPlanData();

  return (
    <DietPlanContext.Provider
      value={{ dietPlan, loading: isLoading, error, refreshDietPlan }}
    >
      {children}
    </DietPlanContext.Provider>
  );
}
