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
import { LazyContextProvider } from "@/components/helpers/LazyContextProvider";

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
          state === "expanded" ? "ms-0 ps-64" : "ms-0 ps-0"
        )}
      >
        <ErrorBoundary>
          <Suspense
            fallback={<AppLoader message="Initializing application..." />}
          >
            <LazyContextProvider>{children}</LazyContextProvider>
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
