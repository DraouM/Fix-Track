// lib/printerConfig.ts
// Printer configuration persistence utilities

import { PrinterConfig, DEFAULT_PRINTER_CONFIG } from "@/types/settings";

const PRINTER_CONFIG_KEY = "printerConfig";

/**
 * Load printer config from localStorage, falling back to defaults.
 */
export function getPrinterConfig(): PrinterConfig {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(PRINTER_CONFIG_KEY);
    if (raw) {
      try {
        return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(raw) };
      } catch (e) {
        console.error("Failed to parse printer config from localStorage", e);
      }
    }
  }
  return { ...DEFAULT_PRINTER_CONFIG };
}

/**
 * Save printer config to localStorage.
 */
export function savePrinterConfig(config: PrinterConfig): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error("Failed to save printer config to localStorage", e);
      throw new Error("Failed to save printer configuration");
    }
  }
}

/**
 * Get the effective print width in mm based on printer config.
 */
export function getEffectiveWidth(config: PrinterConfig): number {
  switch (config.printerType) {
    case "58mm":
      return 58;
    case "80mm":
      return 80;
    case "custom":
      return config.customWidth || 80;
  }
}

/**
 * Get the effective print height in mm (null = auto for receipts).
 */
export function getEffectiveHeight(config: PrinterConfig): number | null {
  if (config.printerType === "custom" && config.customHeight) {
    return config.customHeight;
  }
  return null; // auto height for receipts
}
