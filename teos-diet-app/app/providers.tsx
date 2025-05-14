'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/app/context/auth-context';

// Providers wraps the app with ThemeProvider and AuthProvider for global state
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </NextThemesProvider>
  );
}
