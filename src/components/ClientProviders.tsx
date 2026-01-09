"use client";

import type { ReactNode } from "react";
import { RepairProvider } from "@/context/RepairContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { ClientProvider } from "@/context/ClientContext"; // Import ClientProvider
import { Toaster } from "@/components/ui/sonner";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <InventoryProvider>
      <RepairProvider>
        <ClientProvider>
          {" "}
          {/* Add ClientProvider */}
          {children}
          <Toaster />
        </ClientProvider>
      </RepairProvider>
    </InventoryProvider>
  );
}
