// src/app/index.tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next'; // Import the hook

export default function HomeScreen() {
  const { t } = useTranslation(); // Get the translation function 't'

  return (
    <View style={styles.container}>
      {/* Use t() function with keys from your JSON files */}
      <Text>{t('home.title')}</Text>
      <Text>{t('home.greeting')}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});