import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'config/i18n';
import { CustomPicker, PickerOption } from '../components/customPicker';
import { useTheme, ThemeMode } from '../context/themeContext';
import { commonStyles } from '../styles/commonStyles';

const STORE_LANGUAGE_KEY = 'userLanguage';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { setThemeMode, colors, isDarkMode } = useTheme();

  const currentLanguage = i18n.language as 'en' | 'es';

  const languageOptions: PickerOption<'en' | 'es'>[] = useMemo(() => [ { label: "🇬🇧 English", value: "en" }, { label: "🇪🇸 Español", value: "es" }, ], []);

  const changeLanguage = async (lang: 'en' | 'es') => {
      if (lang === currentLanguage) return;
      console.log(`Attempting to change language to: ${lang}`);
      try {
          await i18n.changeLanguage(lang);
          await AsyncStorage.setItem(STORE_LANGUAGE_KEY, lang);
          console.log(`Language changed and preference saved: ${lang}`);
      } catch (error) {
          console.error('Failed to change language or save preference:', error);
          Alert.alert(t('error.title'), t('error.changeLanguage'));
      }
  };

  const toggleTheme = async (isNowDark: boolean) => {
      const newMode: ThemeMode = isNowDark ? 'dark' : 'light';
      console.log(`Attempting to toggle theme mode to: ${newMode}`);
      try {
          await setThemeMode(newMode);
          console.log(`Theme preference saved: ${newMode}`);
      } catch (error) {
           console.error('Failed to save theme preference:', error);
           Alert.alert(t('error.title'), t('error.changeTheme'));
      }
  };

  return (
    <View style={[commonStyles.paddedContainer, { backgroundColor: colors.background }]}>

      <View style={[commonStyles.section, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <CustomPicker
          // Removed labelStyle prop - CustomPicker styles its own label
          label={t('settings.selectLanguage')}
          options={languageOptions}
          selectedValue={currentLanguage}
          onValueChange={(value) => { changeLanguage(value as 'en' | 'es'); }}
        />
      </View>

      <View style={[commonStyles.section, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.toggleRow}>
            {/* Note: commonStyles.label is used here, combined with local toggleLabel style */}
            <Text style={[commonStyles.label, styles.toggleLabel, { color: colors.text }]}>
              {t('settings.enableDarkMode')}
            </Text>
            <Switch
              trackColor={{ false: "#767577", true: colors.primary }}
              thumbColor={isDarkMode ? "#f4f3f4" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  currentLangDisplay: {
      fontSize: 14,
      marginTop: 15,
      textAlign: 'center',
  },
  currentLangValue: {
      fontWeight: 'bold',
  },
  toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  toggleLabel: {
      flex: 1,
      marginRight: 10,
      marginBottom: 0, // Override marginBottom from commonStyles.label
  }
});
