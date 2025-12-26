"use client";

import { ReactNode, Suspense } from "react";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AppLoader } from "@/components/helpers/AppLoader";
import { ErrorBoundary } from "@/components/helpers/ErrorBoundary";
import { ContextInitializer } from "@/components/helpers/ContextInitializer";

// Import context providers directly instead of dynamically
import { InventoryProvider } from "@/context/InventoryContext";
import { RepairProvider } from "@/context/RepairContext";
import { SupplierProvider } from "@/context/SupplierContext";
import { ClientProvider } from "@/context/ClientContext";
import { TransactionProvider } from "@/context/TransactionContext";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: AppLayoutProps) {
  const { state } = useSidebar();

  return (
    <SidebarInset>
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          state === "expanded" ? "ml-0 pl-64" : "ml-0 pl-0"
        )}
      >
        <ErrorBoundary>
          <Suspense
            fallback={<AppLoader message="Initializing application..." />}
          >
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
          </Suspense>
        </ErrorBoundary>
      </main>
    </SidebarInset>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <LayoutContent>{children}</LayoutContent>
      <Toaster />
    </SidebarProvider>
  );
}
