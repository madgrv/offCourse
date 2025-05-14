'use client';
// AuthContext provides a global authentication state for the app.
// This ensures all components react to login/logout and avoids stale user state.

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

export type UserType = { email: string; name?: string } | null;

interface AuthContextType {
  user: UserType;
  setUser: (u: UserType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType>(null);

  useEffect(() => {
    // On mount, set user if session exists
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser({
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
        });
      } else {
        setUser(null);
      }
    });

    // Listen to Supabase auth state changes for robust session handling
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
          });
        } else {
          setUser(null);
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
