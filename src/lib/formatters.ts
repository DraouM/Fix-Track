import { Currency } from '@/types/settings';

/**
 * Formats a currency amount based on the selected currency and locale
 * @param amount - The numerical amount to format
 * @param currency - The currency code (USD, EUR, MAD, etc.)
 * @param locale - The locale string (en-US, fr-FR, ar-MA)
 * @returns Formatted currency string
 */
export const formatCurrency = (
    amount: number,
    currency: Currency,
    locale: string = 'en-US'
): string => {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    } catch (error) {
        // Fallback if formatting fails
        console.warn(`Formatting currency failed for ${currency} in ${locale}`, error);
        return `${amount} ${currency}`;
    }
};

/**
 * Formats a date based on the selected locale
 * @param date - Date object or string
 * @param locale - The locale string (en-US, fr-FR, ar-MA)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
    date: Date | string | number,
    locale: string = 'en-US',
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }
): string => {
    try {
        const dateObj = new Date(date);
        return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
        console.warn(`Formatting date failed for ${date} in ${locale}`, error);
        return String(date);
    }
};

/**
 * Maps app locale codes (en, fr, ar) to standard BCP 47 language tags
 */
export const getLocaleForIntl = (appLocale: string): string => {
    const map: Record<string, string> = {
        en: 'en-US',
        fr: 'fr-FR',
        ar: 'ar-MA',
    };
    return map[appLocale] || 'en-US';
};
