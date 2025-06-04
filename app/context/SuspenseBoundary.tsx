'use client';

import React, { Suspense, ReactNode } from 'react';

// A simple component that wraps its children in a Suspense boundary
// This is used to properly handle client-side hooks like useSearchParams
export function SuspenseBoundary({ 
  children,
  fallback = <div>Loading...</div>
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
