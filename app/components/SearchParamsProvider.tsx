'use client';

import { ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClientOnly from './ClientOnly';

// Type for the render prop function
type SearchParamsRenderProps = {
  searchParams: ReturnType<typeof useSearchParams>;
};

// Component that safely provides search params to its children
export function SearchParamsProvider({
  children,
}: {
  children: (props: SearchParamsRenderProps) => ReactNode;
}) {
  // Use the hook safely within a client component
  const searchParams = useSearchParams();

  // Render the children with the search params
  return <>{children({ searchParams })}</>;
}

// Wrapper component that combines ClientOnly and Suspense boundaries
export default function SafeSearchParams({
  children,
  fallback = null,
}: {
  children: (props: SearchParamsRenderProps) => ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <ClientOnly>
        <SearchParamsProvider>{children}</SearchParamsProvider>
      </ClientOnly>
    </Suspense>
  );
}
