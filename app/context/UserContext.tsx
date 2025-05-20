// UserContext.tsx
// Provides user authentication state and actions throughout the app.
// This context wraps the useSupabaseUser hook for modularity and clarity.
// Use this context to access user info, loading, error, and auth actions in any component.

import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseUser } from '../hooks/useSupabaseUser';

// Define the shape of the context value for clarity and type safety.
interface UserContextValue {
  user: any; // Replace 'any' with your actual user type if available
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Delegate logic to the modular hook
  const { user, loading, error, signIn, signOut } = useSupabaseUser();

  return (
    <UserContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for consuming the user context
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}

// Why: Centralises user/auth state for easy access and avoids prop drilling. Use this context instead of calling the auth hook directly in deeply nested components.
