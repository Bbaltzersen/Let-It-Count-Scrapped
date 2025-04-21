// src/app/_layout.tsx
import '../config/i18n';             // ← make sure this runs first!
import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          // localize the header title
          title: t('home.title'),
        }}
      />
      {/*
        // later, if you add more screens, you can do:
        <Stack.Screen 
          name="settings" 
          options={{ title: t('common.settings') }} 
        />
      */}
    </Stack>
  );
}
