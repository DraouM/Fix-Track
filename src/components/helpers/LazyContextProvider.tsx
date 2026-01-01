"use client";

import React from "react";
import { InventoryProvider } from "@/context/InventoryContext";
import { RepairProvider } from "@/context/RepairContext";
import { SupplierProvider } from "@/context/SupplierContext";
import { ClientProvider } from "@/context/ClientContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { EventProvider } from "@/context/EventContext";
import { ContextInitializer } from "./ContextInitializer";

interface LazyContextProviderProps {
  children: React.ReactNode;
}

export function LazyContextProvider({ children }: LazyContextProviderProps) {
  return (
    <EventProvider>
      <InventoryProvider>
        <RepairProvider>
          <SupplierProvider>
            <ClientProvider>
              <TransactionProvider>
                <ContextInitializer>{children}</ContextInitializer>
              </TransactionProvider>
            </ClientProvider>
          </SupplierProvider>
        </RepairProvider>
      </InventoryProvider>
    </EventProvider>
  );
}
