import useSWR, { mutate } from 'swr';
import { getDietData } from '../lib/data';
import { useAuth } from '../context/auth-context';
import { DietData } from '../lib/types';

export const DIET_PLAN_CACHE_KEY = '/api/diet-plan';

export function useDietPlanData() {
  const { user } = useAuth();
  
  const { data, error, isLoading, isValidating } = useSWR<DietData | null>(
    user ? DIET_PLAN_CACHE_KEY : null,
    async () => {
      if (!user) return null;
      return getDietData();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const refreshDietPlan = async () => {
    await mutate(DIET_PLAN_CACHE_KEY);
  };

  return {
    dietPlan: data || null,
    isLoading,
    isValidating,
    error: error ? error.message : null,
    refreshDietPlan,
  };
}
