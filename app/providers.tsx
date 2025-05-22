'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/app/context/auth-context';
import { ProfileProvider } from '@/app/context/profile-context';
import { DietPlanProvider } from '@/app/context/DietPlanContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
      <AuthProvider>
        <ProfileProvider>
          <DietPlanProvider>{children}</DietPlanProvider>
        </ProfileProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
