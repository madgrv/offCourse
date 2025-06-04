'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/app/context/auth-context';
import { ProfileProvider } from '@/app/context/profile-context';
import { DietPlanProvider } from '@/app/context/DietPlanContext';
import { SuspenseBoundary } from '@/app/context/SuspenseBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
      <AuthProvider>
        <ProfileProvider>
          {/* Wrap DietPlanProvider in SuspenseBoundary to handle useSearchParams properly */}
          <SuspenseBoundary fallback={<div className="p-4">Loading diet plan data...</div>}>
            <DietPlanProvider>{children}</DietPlanProvider>
          </SuspenseBoundary>
        </ProfileProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
