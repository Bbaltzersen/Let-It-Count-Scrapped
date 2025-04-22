import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
// Import AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your translation files
import en from '../locales/en.json';
import es from '../locales/es.json';

// Key for storing language preference in AsyncStorage
const STORE_LANGUAGE_KEY = 'userLanguage';

const resources = {
  en: en,
  es: es,
};

/**
 * Initializes the i18next instance asynchronously.
 * Attempts to load the user's preferred language from AsyncStorage,
 * falling back to the device's detected language.
 */
export const initializeI18n = async (): Promise<void> => {
  // Default to device language ('en', 'es', etc.)
  let lng = Localization.getLocales()[0]?.languageCode ?? 'en'; // More robust detection

  try {
    // Try to get the saved language preference using AsyncStorage
    const savedLanguage = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
    // Check if the saved language is valid ('en' or 'es')
    if (savedLanguage && resources[savedLanguage as keyof typeof resources]) {
      console.log('Loading language from AsyncStorage:', savedLanguage);
      lng = savedLanguage; // Use saved language if valid
    } else {
      console.log('No valid saved language found, using device language:', lng);
    }
  } catch (error) {
    console.error('Error reading language preference from AsyncStorage:', error);
    // Fallback to device language if error occurs during loading
  }

  // Log the language that will be used for initialization
  console.log(`Initializing i18next with language: ${lng}`);

  try {
    // Initialize i18next with the determined language
    await i18n
      .use(initReactI18next) // passes i18n down to react-i18next
      .init({
        resources,
        lng: lng, // Use loaded preference or detected language
        fallbackLng: 'en', // Fallback language if current lng resources are missing keys
        compatibilityJSON: 'v4', // Required for recent i18next versions
        interpolation: {
          escapeValue: false, // React already protects from XSS
        },
        react: {
          useSuspense: false, // Recommended for React Native
        }
      });
    // Log the final language after initialization
    console.log('i18next initialized with final language:', i18n.language);
  } catch (error) {
      console.error('Error initializing i18next:', error);
      throw error; // Re-throw error to be caught during app startup
  }
};

// Export the configured i18n instance for use elsewhere if needed (like settings screen)
export default i18n;
