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
import { useLicense } from "@/context/LicenseContext";
import { ActivationScreen } from "@/components/license/ActivationScreen";
import { SplashScreen } from "@/components/layout/SplashScreen";

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
  const { isActivated, isLoading, setActivated } = useLicense();
  // const [showSplash, setShowSplash] = useState(true);

  if (isLoading) {
      return null; // Or a minimal loader, but context loads fast
  }

  // If not activated, we must show ActivationScreen.
  // However, we might want to show SplashScreen first?
  // If we want to show SplashScreen on EVERY launch, regardless of auth:
  // We can handle it here or leave it in page.tsx.
  // But if we are in Activation mode, page.tsx is NOT rendered.
  // So we lose SplashScreen for non-activated users if we block here.
  
  if (!isActivated) {
    return <ActivationScreen onActivated={() => setActivated(true)} />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <LayoutContent>{children}</LayoutContent>
      <Toaster />
    </SidebarProvider>
  );
}
