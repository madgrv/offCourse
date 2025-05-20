'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/app/context/auth-context';
import { UserProvider } from '@/app/context/UserContext';
import { DietPlanProvider } from '@/app/context/DietPlanContext';

// Providers wraps the app with ThemeProvider, AuthProvider, UserProvider, and DietPlanProvider for global state
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
      <AuthProvider>
        <UserProvider>
          <DietPlanProvider>
            {children}
          </DietPlanProvider>
        </UserProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
