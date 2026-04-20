"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppSettings, Currency } from "@/types/settings";
import { getSettings, saveSettings, applyTheme } from "@/lib/settings";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import { invoke } from "@tauri-apps/api/core";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  getCurrencySymbol: () => string;
  availablePrinters: string[];
  refreshPrinters: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);

  const refreshPrinters = async () => {
    try {
      // The backend command is list_printers (returns Vec<PrinterInfo>)
      const printerInfos = await invoke<any[]>("list_printers");
      if (Array.isArray(printerInfos)) {
        setAvailablePrinters(printerInfos.map(p => p.name));
      }
    } catch (error) {
      console.error("Failed to fetch printers:", error);
    }
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(settings.theme);
    refreshPrinters();
  }, [settings.theme]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  const resetSettings = () => {
    const defaultSettings = getSettings();
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[settings.currency];
  };

  return (
    <SettingsContext.Provider
      value={{ 
        settings, 
        updateSettings, 
        resetSettings, 
        getCurrencySymbol, 
        availablePrinters, 
        refreshPrinters 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
