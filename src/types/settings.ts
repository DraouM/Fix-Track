// Settings type definitions for Fixary POS system

export type ThemeMode = "light" | "dark";
export type Language = "en" | "fr" | "ar";
export type Currency = "USD" | "EUR" | "MAD" | "GBP";

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

export interface AppSettings {
    theme: ThemeMode;
    language: Language;
    currency: Currency;
    printDimensions: PrintDimensions;
}

// Currency symbol mapping
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    USD: "$",
    EUR: "€",
    MAD: "MAD",
    GBP: "£",
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
