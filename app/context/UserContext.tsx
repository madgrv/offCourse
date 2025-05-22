// UserContext.tsx
// DEPRECATED: This context is maintained for backward compatibility.
// New components should use the enhanced auth-context.tsx directly.
// Why: We are consolidating user and auth state into a single source of truth.

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './auth-context';

// Maintain the same interface for backward compatibility
interface UserContextValue {
  user: any; // Will contain the full Supabase user object
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

// This provider now wraps the enhanced auth context instead of useSupabaseUser
export function UserProvider({ children }: { children: ReactNode }) {
  // Use the enhanced auth context directly
  const { user, loading, error, signIn, signOut } = useAuth();

  return (
    <UserContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

// This hook now returns the same data as useAuth, maintaining compatibility
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}

// Why: This compatibility layer allows for gradual migration from UserContext to AuthContext
// without breaking existing components. Once all components have been updated to use
// useAuth directly, this file can be removed.
