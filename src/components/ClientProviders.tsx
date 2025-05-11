
'use client';

import type { ReactNode } from 'react';
import { RepairProvider } from '@/context/RepairContext';
import { InventoryProvider } from '@/context/InventoryContext'; // Import InventoryProvider
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <InventoryProvider> {/* InventoryProvider wraps RepairProvider */}
      <RepairProvider>
        {children}
        <Toaster />
      </RepairProvider>
    </InventoryProvider>
  );
}
