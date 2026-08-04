"use client";

import { useEffect, useState } from "react";
import TransactionsPage from "@/app/transactions/page";
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
        isReady={true}
        finishLoading={() => {
          setIsLoading(false);
          setShowMainUI(true);
        }} 
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showMainUI && (
        <TransactionsPage key="transactions" />
      )}
    </AnimatePresence>
  );
}


