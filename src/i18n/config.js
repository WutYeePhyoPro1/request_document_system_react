import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import myTranslations from './locales/my.json';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    
    // Languages we support
    supportedLngs: ['en', 'my'],
    
    // Resources (translations) - no namespace, direct access
    resources: {
      en: {
        translation: enTranslations,
      },
      my: {
        translation: myTranslations,
      },
    },
    
    // Options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Return empty string instead of key when translation is missing
    returnEmptyString: false,
    returnNull: false,
    // Show key only if translation is missing (for debugging)
    // Set to false to use defaultValue instead
    returnObjects: false,
    
    // Detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys to lookup language from
      lookupLocalStorage: 'i18nextLng',
      
      // Cache user language
      caches: ['localStorage'],
    },
    
    // React options
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

export default i18n;

