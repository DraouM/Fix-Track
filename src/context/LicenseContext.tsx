"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isLicenseActive } from "@/lib/license";

interface LicenseContextType {
  isActivated: boolean;
  isLoading: boolean;
  setActivated: (value: boolean) => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check cached license via Rust backend (async IPC call)
    isLicenseActive()
      .then((active) => {
        setIsActivated(active);
      })
      .catch((err) => {
        console.error("License check failed:", err);
        setIsActivated(false); // Fail closed
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <LicenseContext.Provider value={{ isActivated, isLoading, setActivated: setIsActivated }}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
}
