"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppSettings, Currency } from "@/types/settings";
import { getSettings, saveSettings, applyTheme } from "@/lib/settings";
import { CURRENCY_SYMBOLS } from "@/types/settings";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  getCurrencySymbol: () => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(settings.theme);
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
      value={{ settings, updateSettings, resetSettings, getCurrencySymbol }}
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
