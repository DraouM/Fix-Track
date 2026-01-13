"use client";

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { changeLanguage } from "@/lib/i18n";
import { useSettings } from "@/context/SettingsContext";

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { settings } = useSettings();

  // Sync language changes from settings to i18next
  useEffect(() => {
    changeLanguage(settings.language);
  }, [settings.language]);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
