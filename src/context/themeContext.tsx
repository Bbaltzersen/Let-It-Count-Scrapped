// src/context/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, ThemeColors } from 'constants/colors'; // Adjust path

// Define the possible theme modes
export type ThemeMode = 'light' | 'dark' | 'system';

// Define the shape of the context value
interface ThemeContextProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>; // Make async for storage
  colors: ThemeColors; // The actual colors object for the current theme
  isDarkMode: boolean; // Convenience flag
}

// Create the context with a default value (can be undefined or initial state)
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_PREFERENCE_KEY = 'userThemePreference'; // Key for AsyncStorage

// Create the provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() ?? 'light'; // 'light' | 'dark' | null -> default to light
  const [userPreference, setUserPreference] = useState<ThemeMode>('system'); // User's choice ('light', 'dark', 'system')
  const [isLoading, setIsLoading] = useState(true); // Track loading preference

  // Load preference on initial mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference && ['light', 'dark', 'system'].includes(savedPreference)) {
          setUserPreference(savedPreference as ThemeMode);
          console.log('Loaded theme preference:', savedPreference);
        } else {
          console.log('No theme preference found, using system.');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreference();
  }, []);

  // Determine the actual theme mode to use
  const activeThemeMode = useMemo(() => {
      return userPreference === 'system' ? systemColorScheme : userPreference;
  }, [userPreference, systemColorScheme]);


  // Select the color palette based on the active theme mode
  const colors = useMemo(() => {
      return activeThemeMode === 'dark' ? darkTheme : lightTheme;
  }, [activeThemeMode]);

  // Function to update the theme mode and save preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setUserPreference(mode); // Update state immediately
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);
      console.log('Saved theme preference:', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Optionally notify user
    }
  };

  // Don't render children until preference is loaded to avoid flash
  if (isLoading) {
    return null; // Or return a loading component/splash screen
  }

  const value: ThemeContextProps = {
    themeMode: userPreference, // Provide the user's *preference*
    setThemeMode,
    colors, // Provide the *active* colors based on preference/system
    isDarkMode: activeThemeMode === 'dark', // Provide convenience flag
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Create a custom hook to use the theme context easily
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};