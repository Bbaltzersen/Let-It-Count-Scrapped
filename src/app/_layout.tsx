// src/app/_layout.tsx
import '../config/i18n'; // Initialize i18n first
import React, { useEffect, useState } from 'react'; // Added useEffect, useState
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native'; // Added components for status display

// Adjust path based on your structure (assuming src/config, src/services)
import { initializeDatabase } from 'services/database'; // Added DB import

export default function RootLayout() {
  // --- State Hooks ---
  // Note: Hooks like useTranslation must be called at the top level, unconditionally.
  const { t } = useTranslation();
  const [isDbReady, setIsDbReady] = useState(false); // State for DB readiness
  const [dbError, setDbError] = useState<string | null>(null); // State for DB errors

  // --- Effects ---
  useEffect(() => {
    // Effect for database initialization
    const setupDatabase = async () => {
      try {
        await initializeDatabase();
        console.log("Database initialization complete in _layout.");
        setIsDbReady(true); // Set state to true when DB is ready
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
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Conditional Rendering based on DB status ---
  if (dbError) {
    // Render error state if DB initialization failed
    return (
        <View style={styles.centerStatus}>
            {/* TODO: Translate error messages using i18n if desired */}
            <Text style={styles.errorText}>Database Error: {dbError}</Text>
            <Text>Please restart the app.</Text>
        </View>
    );
  }

  if (!isDbReady) {
    // Render loading state while DB initializes
    return (
        <View style={styles.centerStatus}>
            <ActivityIndicator size="large" />
            {/* Use i18n for loading text */}
            <Text>{t('common.loading', 'Loading Database...')}</Text>
        </View>
    );
  }

  // --- Render Main Navigator (DB is Ready) ---
  // Now that DB is ready and `t` is available, render the Stack
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          // Use the 't' function from useTranslation for the title
          title: t('home.title'),
        }}
      />
      {/* Add other screens later */}
    </Stack>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  centerStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  }
});