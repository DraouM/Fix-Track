// Settings management utilities for Fixary POS system

import { AppSettings } from "@/types/settings";

// Default settings configuration
export const DEFAULT_SETTINGS: AppSettings = {
    theme: "light",
    language: "en",
    currency: "USD",
    printDimensions: {
        receipt: {
            width: 80, // 80mm standard thermal receipt width
            unit: "mm",
        },
        sticker: {
            width: 50.8, // 2 inches in mm
            height: 25.4, // 1 inch in mm
            unit: "mm",
        },
    },
};

const SETTINGS_STORAGE_KEY = "appSettings";

/**
 * Retrieves application settings from localStorage
 * Falls back to default settings if not found or invalid
 */
export const getSettings = (): AppSettings => {
    if (typeof window !== "undefined") {
        try {
            const settingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (settingsRaw) {
                const parsed = JSON.parse(settingsRaw);
                // Merge with defaults to ensure all properties exist
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (e) {
            console.error("Failed to parse settings from localStorage", e);
        }
    }
    return DEFAULT_SETTINGS;
};

/**
 * Saves application settings to localStorage
 */
export const saveSettings = (settings: AppSettings): void => {
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings to localStorage", e);
            throw new Error("Failed to save settings");
        }
    }
};

/**
 * Validates print dimensions
 */
export const validatePrintDimensions = (
    width: number,
    height?: number
): boolean => {
    const isValidWidth = width > 0 && width <= 300; // Max 300mm
    if (height !== undefined) {
        const isValidHeight = height > 0 && height <= 300;
        return isValidWidth && isValidHeight;
    }
    return isValidWidth;
};

/**
 * Applies theme to document root
 */
export const applyTheme = (theme: "light" | "dark"): void => {
    if (typeof window !== "undefined") {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }
};
