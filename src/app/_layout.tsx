// src/app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import Initializers
import { initializeI18n } from 'config/i18n';
import { initializeDatabase } from 'services/database';

// Import Theme Provider and Hook
import { ThemeProvider, useTheme } from '../context/themeContext'; // Adjust path if needed

// Navigation component - Renders the Drawer navigator and uses the theme context
// This will only be rendered AFTER the ThemeProvider and initializers are ready
function RootLayoutNav() {
  // Hooks can be used here because ThemeProvider is an ancestor
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme(); // Use the theme hook

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Configure screen options using theme colors
  const screenOptions = {
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    drawerStyle: { backgroundColor: colors.card },
    drawerActiveTintColor: colors.primary,
    drawerInactiveTintColor: colors.textSecondary,
    headerLeft: () => (
      <TouchableOpacity onPress={openDrawer} style={{ marginLeft: 15 }}>
        <Ionicons name="menu" size={28} color={colors.icon} />
      </TouchableOpacity>
    ),
  };

  return (
    <Drawer screenOptions={screenOptions}>
      {/* Configure each screen */}
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: t('drawer.home', 'Home'),
          title: t('home.title'), // t() should work correctly now
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          drawerLabel: t('drawer.history', 'History'),
          title: t('history.title'),
        }}
      />
       <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: t('drawer.settings', 'Settings'),
          title: t('settings.title'),
        }}
      />
    </Drawer>
  );
}

// Component to handle the initialization logic and display loading/error states
function InitialLoadingGate({ children }: { children: React.ReactNode }) {
  const [isDbReady, setIsDbReady] = useState(false);
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts quickly

    const initializeApp = async () => {
      try {
        console.log("Starting app initialization...");
        // Await initializers sequentially or concurrently
        // Running sequentially might be slightly safer for dependencies
        await initializeDatabase();
        if (!isMounted) return;
        setIsDbReady(true);
        console.log("Database initialized.");

        await initializeI18n();
        if (!isMounted) return;
        setIsI18nReady(true);
        console.log("i18n initialized.");

        console.log("App initialization complete.");
      } catch (error) {
        console.error("App initialization failed:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        if (isMounted) {
          setInitError(message);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false; // Cleanup function to set flag on unmount
    };
  }, []); // Empty dependency array ensures this runs only once

  if (initError) {
    // Render error state - Cannot use theme here reliably
    return (
        <View style={styles.centerStatus}>
            <Text style={styles.errorText}>Initialization Error: {initError}</Text>
            <Text>Please restart the app.</Text>
        </View>
    );
  }

  if (!isDbReady || !isI18nReady) {
    // Render loading state - Cannot use theme or i18n here reliably
    return (
        <View style={styles.centerStatus}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading...</Text>
        </View>
    );
  }

  // Initializers ready, render the children (which will be RootLayoutNav)
  return <>{children}</>;
}

// Main layout component: Provides Theme and delegates loading/nav rendering
export default function RootLayout() {
  return (
    // ThemeProvider wraps everything
    <ThemeProvider>
      {/* InitialLoadingGate handles async setup and shows loading/error */}
      <InitialLoadingGate>
        {/* RootLayoutNav renders the actual navigator once setup is complete */}
        <RootLayoutNav />
      </InitialLoadingGate>
    </ThemeProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  centerStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff', // Default background for loading/error
   },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center'
  }
});
