'use client';
// Enhanced AuthContext provides a comprehensive global authentication state for the app.
// This consolidates user and auth state into a single source of truth.
// Why: Eliminates synchronisation issues and reduces complexity by having one auth context.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabaseClient';
import en from '@/shared/language/en';

// Define a comprehensive auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Store the complete Supabase user object (includes ID and all properties)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and set the current user
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(data?.user || null);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    fetchUser();

    // Listen to Supabase auth state changes for robust session handling
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Update user state when auth state changes
      setUser(session?.user || null);
      
      // Clear error on successful auth events
      if (session?.user) {
        setError(null);
      }
    });
    
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUser]);

  // Sign in function (customise as needed for your auth flow)
  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      // Example: redirect to sign-in page
      // You may want to implement actual sign-in logic here
      window.location.href = '/auth/login';
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Legacy type for backward compatibility during migration
export type UserType = { email: string; name?: string; id?: string } | null;
