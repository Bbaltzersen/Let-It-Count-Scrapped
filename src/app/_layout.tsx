// src/app/_layout.tsx
import 'config/i18n'; // Initialize i18n first
import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer'; // Import Drawer
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router'; // To get navigation prop for header button
import { DrawerActions } from '@react-navigation/native'; // To get drawer actions
import Ionicons from '@expo/vector-icons/Ionicons'; // Example icon library

// Adjust path based on your structure
import { initializeDatabase } from 'services/database';

export default function RootLayout() {
  const { t } = useTranslation();
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const navigation = useNavigation(); // Get navigation object

  useEffect(() => {
    const setupDatabase = async () => {
      // ... (database initialization logic - same as before)
      try {
        await initializeDatabase();
        console.log("Database initialization complete in _layout.");
        setIsDbReady(true);
      } catch (error) {
        console.error("Database initialization failed in _layout:", error);
        if (error instanceof Error) {
          setDbError(error.message);
        } else {
          setDbError("An unknown error occurred during DB initialization.");
        }
      }
    };
    setupDatabase();
  }, []);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // --- Conditional Rendering based on DB status ---
  if (dbError) {
    // ... (Error display - same as before)
    return ( <View style={styles.centerStatus}><Text style={styles.errorText}>Database Error: {dbError}</Text><Text>Please restart the app.</Text></View> );
  }
  if (!isDbReady) {
    // ... (Loading display - same as before)
    return ( <View style={styles.centerStatus}><ActivityIndicator size="large" /><Text>{t('common.loading', 'Loading Database...')}</Text></View> );
  }

  // --- Render Main Drawer Navigator (DB is Ready) ---
  return (
    <Drawer
      screenOptions={{
        // Add a button to open the drawer to all screen headers
        headerLeft: () => (
          <TouchableOpacity onPress={openDrawer} style={{ marginLeft: 15 }}>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Drawer.Screen
        name="index" // This is the filename src/app/index.tsx
        options={{
          drawerLabel: t('drawer.home', 'Home'), // Label in the drawer menu
          title: t('home.title'), // Header title for the screen
        }}
      />
      <Drawer.Screen
        name="history" // Corresponds to src/app/history.tsx
        options={{
          drawerLabel: t('drawer.history', 'History'),
          title: t('history.title', 'Entry History'), // Add translation key
        }}
      />
       <Drawer.Screen
        name="settings" // Corresponds to src/app/settings.tsx
        options={{
          drawerLabel: t('drawer.settings', 'Settings'),
          title: t('settings.title', 'Settings'), // Add translation key
        }}
      />
      {/* Add more screens here as needed */}
    </Drawer>
  );
}

// --- Styles --- (same as before)
const styles = StyleSheet.create({
  centerStatus: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' }
});