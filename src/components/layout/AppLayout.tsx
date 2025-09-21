"use client";

import { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: AppLayoutProps) {
  const { state } = useSidebar();

  return (
    <SidebarInset>
      {/* <header
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
          state === "expanded" ? "ml-0 pl-64" : "ml-0 pl-8"
        )}
      >
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">FixTrack Dashboard</h1>
        </div>
      </header> */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          state === "expanded" ? "ml-0 pl-64" : "ml-0 pl-0"
        )}
      >
        {children}
      </main>
    </SidebarInset>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
