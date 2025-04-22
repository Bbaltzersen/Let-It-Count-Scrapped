import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from 'context/themeContext'; // Using camelCase filename
import { useTranslation } from 'react-i18next';

export default function ProfileStackLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation(); // For potential future use in header options

  return (
    <Stack
      screenOptions={{
        // Apply theme colors to the stack header
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleAlign: 'center', // Center titles within this stack
      }}
    >
      {/* The main display screen for the profile tab */}
      <Stack.Screen
        name="index" // Corresponds to profile/index.tsx
        options={{
          // Hide this stack's header, the Drawer header will be used.
          headerShown: false,
        }}
      />
      {/* The screen for editing profile details */}
      <Stack.Screen
        name="edit" // Corresponds to profile/edit.tsx
        options={{
          // Use translation key for the edit screen title
          title: t('profile.editTitle', 'Edit Profile & Goals'),
          // Optionally set presentation style
          // presentation: 'modal',
        }}
      />
    </Stack>
  );
}
