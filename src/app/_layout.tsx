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
import { ThemeProvider, useTheme } from 'context/themeContext'; // Using camelCase filename

// Navigation component - Renders the Drawer navigator and uses the theme context
function RootLayoutNav() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();

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
    headerLeft: () => null,
    headerTitleAlign: 'left' as 'left' | 'center',
    headerRight: () => (
      <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
        <Ionicons name="menu" size={28} color={colors.icon} />
      </TouchableOpacity>
    ),
    drawerPosition: 'right' as 'left' | 'right',
  };

  return (
    // Pass drawerPosition directly to Drawer component
    <Drawer screenOptions={screenOptions}>
      {/* Configure each screen */}
      <Drawer.Screen
        name="index" // Home
        options={{
          drawerLabel: t('drawer.home', 'Home'),
          title: t('home.title'), // Title for the Home screen header
        }}
      />
      {/* --- Profile Screen Entry (Points to Stack Layout) --- */}
      <Drawer.Screen
        name="profile" // This now points to the profile stack layout
        options={{
          // Set the label for the drawer item only
          drawerLabel: t('drawer.profile', 'Profile & Goals'),
          // The title displayed in the header is controlled by profile/_layout.tsx
          // and the specific screen within that stack (e.g., profile/index or profile/edit)
          // We can optionally hide the Drawer's header for this item if the Stack handles it
          headerShown: true, // Keep drawer header, stack header is hidden for profile/index
          title: t('profile.title'), // Set the Drawer header title for this section
        }}
      />
      {/* ---------------------------------------------------- */}
      <Drawer.Screen
        name="history"
        options={{
          drawerLabel: t('drawer.history', 'History'),
          title: t('history.title'), // Title for the History screen header
        }}
      />
       <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: t('drawer.settings', 'Settings'),
          title: t('settings.title'), // Title for the Settings screen header
        }}
      />
    </Drawer>
  );
}

// Component to handle the initialization logic and display loading/error states
// (InitialLoadingGate remains the same as before)
function InitialLoadingGate({ children }: { children: React.ReactNode }) {
  const [isDbReady, setIsDbReady] = useState(false);
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      try {
        console.log("Starting app initialization...");
        await initializeDatabase(); if (!isMounted) return; setIsDbReady(true); console.log("Database initialized.");
        await initializeI18n(); if (!isMounted) return; setIsI18nReady(true); console.log("i18n initialized.");
        console.log("App initialization complete.");
      } catch (error) {
        console.error("App initialization failed:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        if (isMounted) { setInitError(message); }
      }
    };
    initializeApp();
    return () => { isMounted = false; };
  }, []);

  if (initError) { return ( <View style={styles.centerStatus}><Text style={styles.errorText}>Initialization Error: {initError}</Text><Text>Please restart the app.</Text></View> ); }
  if (!isDbReady || !isI18nReady) { return ( <View style={styles.centerStatus}><ActivityIndicator size="large" color="#0000ff" /><Text>Loading...</Text></View> ); }
  return <>{children}</>;
}

// Main layout component: Provides Theme and delegates loading/nav rendering
// (RootLayout remains the same as before)
export default function RootLayout() {
  return (
    <ThemeProvider>
      <InitialLoadingGate>
        <RootLayoutNav />
      </InitialLoadingGate>
    </ThemeProvider>
  );
}

// Styles (remains the same as before)
const styles = StyleSheet.create({
  centerStatus: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
  headerButton: { paddingHorizontal: 15, paddingVertical: 5, }
});
