import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  // Set up the Stack navigator.
  return (
    <Stack>
      {/* Define screens within the Stack here later if needed,
          or configure options for the default screen (index.tsx) */}
      <Stack.Screen name="index" options={{ title: 'Let it count' }} />
      {/* Add other screens like <Stack.Screen name="settings" /> later */}
    </Stack>
  );
}