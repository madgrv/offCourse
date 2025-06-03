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
  
  // Check if cache clearing is requested
  const clearCache = searchParams?.get('clearCache') === 'true';
  
  // Check if we should include template diet plans
  const includeTemplates = searchParams?.get('includeTemplates') === 'true';
  
  // Validate UUID format to avoid invalid requests
  const isValidUuid = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };
  
  // URL parameter takes precedence over cookie, but only if it's a valid UUID
  let planId = null;
  if (planIdFromUrl && isValidUuid(planIdFromUrl)) {
    planId = planIdFromUrl;
  } else if (planIdFromCookie && isValidUuid(planIdFromCookie)) {
    planId = planIdFromCookie;
  }
  
  // If we have an invalid ID, clear it from the cookie
  if ((planIdFromCookie && !isValidUuid(planIdFromCookie)) && typeof document !== 'undefined') {
    document.cookie = 'selected_diet_plan_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    console.log('Cleared invalid diet plan ID from cookie');
  }
  
  // Create a stable cache key that includes the plan ID when specified
  const cacheKey = user ? 
    (planId ? `${DIET_PLAN_CACHE_KEY}/${planId}` : DIET_PLAN_CACHE_KEY) : 
    null;
  
  const { data, error, isLoading, isValidating } = useSWR<DietData | null>(
    cacheKey,
    async () => {
      if (!user) return null;
      
      try {
        // Use the combined plan ID from URL or cookie
        const dietData = await getDietData(planId || undefined, includeTemplates);
        

        
        return dietData;
      } catch (error) {
        console.error('Error fetching diet data:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: clearCache ? 0 : 60000, // Disable deduping when clearCache is true
      focusThrottleInterval: 120000, // 2 minutes
    }
  );

  const refreshDietPlan = async () => {
    // Check if we already have data with a default structure
    if (data?.isDefaultStructure) {
  
      return;
    }
    
    // Clear the cache completely before revalidation to ensure fresh data

    await mutate(cacheKey, null, { revalidate: false }); // Clear the cache
    await mutate(cacheKey); // Then revalidate
  };

  return {
    dietPlan: data || null,
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refreshDietPlan,
  };
}
