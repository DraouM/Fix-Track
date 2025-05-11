
'use client';

import type { ReactNode } from 'react';
import { RepairProvider } from '@/context/RepairContext';
// InventoryProvider is scoped to InventoryPageClient, so not needed globally here.
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: ReactNode }) {
  // Removed isClient state and useEffect to allow children to be SSR'd.
  // Providers like RepairProvider should handle their own client-side effects (e.g., localStorage).
  return (
    <RepairProvider>
      {children}
      <Toaster />
    </RepairProvider>
  );
}

