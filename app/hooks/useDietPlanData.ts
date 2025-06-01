import useSWR, { mutate } from 'swr';
import { getDietData } from '../lib/data';
import { useAuth } from '../context/auth-context';
import { DietData } from '../lib/types';
import { useSearchParams } from 'next/navigation';

export const DIET_PLAN_CACHE_KEY = '/api/diet-plan';

// Helper function to get a cookie value by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null; // Not in browser environment
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function useDietPlanData() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Check for plan ID in URL parameters and cookies
  const planIdFromUrl = searchParams?.get('planId');
  const planIdFromCookie = getCookie('selected_diet_plan_id');
  
  // URL parameter takes precedence over cookie
  const planId = planIdFromUrl || planIdFromCookie;
  
  // Create a stable cache key that includes the plan ID when specified
  const cacheKey = user ? 
    (planId ? `${DIET_PLAN_CACHE_KEY}/${planId}` : DIET_PLAN_CACHE_KEY) : 
    null;
  
  const { data, error, isLoading, isValidating } = useSWR<DietData | null>(
    cacheKey,
    async () => {
      if (!user) return null;
      
      // Use the combined plan ID from URL or cookie
      return getDietData(planId || undefined);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      focusThrottleInterval: 120000, // 2 minutes
    }
  );

  const refreshDietPlan = async () => {
    // Simple approach - just invalidate the cache and trigger a revalidation
    await mutate(cacheKey);
  };

  return {
    dietPlan: data || null,
    isLoading,
    isValidating,
    error: error ? error.message : null,
    refreshDietPlan,
  };
}
