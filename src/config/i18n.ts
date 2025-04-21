// src/config/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import your translation files (adjust path if locales is elsewhere)
import en from '../locales/en.json'; // Path relative from src/config to src/locales
import es from '../locales/es.json'; // Path relative from src/config to src/locales

const resources = {
  en: en,
  es: es,
};

// Detect device language (simple version)
const deviceLanguage = Localization.locale.split('-')[0];

// Inside src/config/i18n.ts
i18n
.use(initReactI18next) // passes i18n down to react-i18next
.init({
  resources,
  lng: deviceLanguage, // Set language based on device detection
  fallbackLng: 'en', // Use English if detected language is not available
  // --- CHANGE THIS LINE ---
  compatibilityJSON: 'v4', // Use 'v4' for newer i18next versions
  // ------------------------
  interpolation: {
    escapeValue: false, // React already safes from xss
  },
  react: {
    useSuspense: false, // Set to false for React Native without Suspense for translations
  }
});

export default i18n;