import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Why: Centralises all Supabase user/auth state and actions for use throughout the app
export function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Listen for auth state changes and fetch the current user on mount
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) setUser(data?.session?.user || null);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load user');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Sign in function (expand as needed for your auth flow)
  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      // Example: sign in with magic link or OAuth (customise as needed)
      // await supabase.auth.signInWithPassword({ ... });
      // For now, throw to indicate this should be implemented per your auth flow
      throw new Error('Sign-in method not implemented');
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Sign out function
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Sign-out failed');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Why: Expose user, loading, error, and auth actions for use in context and components
  return { user, loading, error, signIn, signOut };
}

