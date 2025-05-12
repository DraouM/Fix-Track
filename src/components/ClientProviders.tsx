
'use client';

import type { ReactNode } from 'react';
import { RepairProvider } from '@/context/RepairContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <InventoryProvider>
      <RepairProvider>
        {children}
        <Toaster />
      </RepairProvider>
    </InventoryProvider>
  );
}
