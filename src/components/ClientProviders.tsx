
'use client';

import type { ReactNode } from 'react';
import { RepairProvider } from '@/context/RepairContext';
import { Toaster } from '@/components/ui/toaster';
import { useEffect, useState } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // You can render a loader here or null
    return null; 
  }

  return (
    <RepairProvider>
      {children}
      <Toaster />
    </RepairProvider>
  );
}
