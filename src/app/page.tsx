"use client";

import { useEffect, useState } from "react";
import { UnifiedCashierDashboard } from "@/components/dashboard/UnifiedCashierDashboard";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showMainUI, setShowMainUI] = useState<boolean>(false);

  // We rely on AppLayout to handle the authentication guard.
  // If we are here, we are authorized.

  if (isLoading) {
    return (
      <SplashScreen 
        finishLoading={() => {
          setIsLoading(false);
          setTimeout(() => setShowMainUI(true), 100);
        }} 
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showMainUI && (
        <UnifiedCashierDashboard key="dashboard" />
      )}
    </AnimatePresence>
  );
}

