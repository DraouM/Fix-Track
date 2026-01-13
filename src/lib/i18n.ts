import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from '@/locales/en/common.json';
import frCommon from '@/locales/fr/common.json';
import arCommon from '@/locales/ar/common.json';

// Translation resources
const resources = {
    en: {
        common: enCommon,
    },
    fr: {
        common: frCommon,
    },
    ar: {
        common: arCommon,
    },
};

// Initialize i18next
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Default language
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common'],
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        react: {
            useSuspense: false, // Disable suspense for SSR compatibility
        },
    });

/**
 * Change the application language
 * @param language - Language code ('en', 'fr', 'ar')
 */
export const changeLanguage = (language: string): void => {
    i18n.changeLanguage(language);

    // Apply RTL direction for Arabic
    if (typeof document !== 'undefined') {
        const htmlElement = document.documentElement;
        if (language === 'ar') {
            htmlElement.setAttribute('dir', 'rtl');
            htmlElement.setAttribute('lang', 'ar');
        } else {
            htmlElement.setAttribute('dir', 'ltr');
            htmlElement.setAttribute('lang', language);
        }
    }
};

/**
 * Get the current language
 */
export const getCurrentLanguage = (): string => {
    return i18n.language;
};

export default i18n;
