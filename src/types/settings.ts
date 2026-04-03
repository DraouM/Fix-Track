// Settings type definitions for Fixary POS system

export type ThemeMode = "light" | "dark";
export type Language = "en" | "fr" | "ar";
export type Currency = "USD" | "EUR" | "MAD" | "GBP" | "DZD";

export interface PrintDimensions {
    receipt: {
        width: number; // in mm
        unit: "mm";
    };
    sticker: {
        width: number; // in mm
        height: number; // in mm
        unit: "mm";
    };
}

export type PrinterType = "58mm" | "80mm" | "custom";

export interface PrinterConfig {
    printerType: PrinterType;
    customWidth?: number;    // mm, used when printerType is "custom"
    customHeight?: number;   // mm, used when printerType is "custom"
    offsetTop: number;       // mm, calibration offset
    offsetLeft: number;      // mm, calibration offset
    printerName?: string;    // OS printer name for native printing
    useNativePrint: boolean; // prefer Rust backend over browser print
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
    printerType: "80mm",
    offsetTop: 0,
    offsetLeft: 0,
    useNativePrint: false,
};

export interface AppSettings {
    theme: ThemeMode;
    language: Language;
    currency: Currency;
    printDimensions: PrintDimensions;
    printerConfig: PrinterConfig;
}

// Currency symbol mapping
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    USD: "$",
    EUR: "€",
    MAD: "MAD",
    GBP: "£",
    DZD: "DA",
};

// Language display names
export const LANGUAGE_NAMES: Record<Language, string> = {
    en: "English",
    fr: "Français",
    ar: "العربية",
};

// Common receipt width presets
export const RECEIPT_WIDTH_PRESETS = [
    { label: "58mm (Compact)", value: 58 },
    { label: "80mm (Standard)", value: 80 },
] as const;

// Common sticker dimension presets
export const STICKER_PRESETS = [
    { label: '2" × 1" (50.8mm × 25.4mm)', width: 50.8, height: 25.4 },
    { label: '4" × 6" (101.6mm × 152.4mm)', width: 101.6, height: 152.4 },
    { label: '3" × 2" (76.2mm × 50.8mm)', width: 76.2, height: 50.8 },
] as const;
