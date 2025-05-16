'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/app/context/auth-context';
import { DietPlanProvider } from '@/app/context/DietPlanContext';

// Providers wraps the app with ThemeProvider, AuthProvider, and DietPlanProvider for global state
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
      <AuthProvider>
        <DietPlanProvider>
          {children}
        </DietPlanProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
