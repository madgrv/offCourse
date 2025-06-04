'use client';

import { useEffect, useState, ReactNode } from 'react';

// This component ensures that its children are only rendered on the client side
// It prevents hydration errors and issues with client-only hooks like useSearchParams
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render children after component has mounted on the client
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}
