import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function HistoryScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text>{t('history.title', 'Entry History')}</Text>
      {/* History content will go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});