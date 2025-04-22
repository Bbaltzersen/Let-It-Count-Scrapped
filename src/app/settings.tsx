import React, { useMemo } from 'react'; // Added useMemo
import { View, Text, StyleSheet, Alert, Platform, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'config/i18n'; // Adjust path if needed
// Remove native Picker import
// import { Picker } from '@react-native-picker/picker';
// Import CustomPicker and its option type
import { CustomPicker, PickerOption } from '../components/customPicker'; // Adjust path if needed
import { useTheme, ThemeMode } from '../context/themeContext'; // Corrected import path

const STORE_LANGUAGE_KEY = 'userLanguage';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    setThemeMode,
    colors,
    isDarkMode
  } = useTheme();

  const currentLanguage = i18n.language as 'en' | 'es'; // Type assertion

  // Define language options for the CustomPicker
  const languageOptions: PickerOption<'en' | 'es'>[] = useMemo(() => [
      { label: "🇬🇧 English", value: "en" },
      { label: "🇪🇸 Español", value: "es" },
  ], []); // Empty dependency array, options are static

  // Function to change language preference (remains the same)
  const changeLanguage = async (lang: 'en' | 'es') => {
    if (lang === currentLanguage) return;
    console.log(`Attempting to change language to: ${lang}`);
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, lang);
      console.log(`Language changed and preference saved: ${lang}`);
    } catch (error) {
      console.error('Failed to change language or save preference:', error);
      Alert.alert(t('error.title', 'Error'), t('error.changeLanguage', 'Failed to change language.'));
    }
  };

  // Function to toggle theme preference (remains the same)
  const toggleTheme = async (isNowDark: boolean) => {
    const newMode: ThemeMode = isNowDark ? 'dark' : 'light';
    console.log(`Attempting to toggle theme mode to: ${newMode}`);
    try {
      await setThemeMode(newMode);
      console.log(`Theme preference saved: ${newMode}`);
    } catch (error) {
        console.error('Failed to save theme preference:', error);
        Alert.alert(t('error.title', 'Error'), t('error.changeTheme', 'Failed to save theme preference.'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* --- Language Selection Section using CustomPicker --- */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Use CustomPicker component */}
        <CustomPicker
          label={t('settings.selectLanguage', 'Select Language:')}
          options={languageOptions}
          selectedValue={currentLanguage}
          onValueChange={(value) => {
            // Type assertion might be needed if value type isn't inferred correctly
            changeLanguage(value as 'en' | 'es');
          }}
        />
        {/* Display current language below picker for confirmation */}
        {/* This might be redundant now as the picker trigger shows the selection */}
        {/* <Text style={[styles.currentLangDisplay, { color: colors.textSecondary }]}>
          {t('settings.currentLanguage', 'Current Language:')}
          <Text style={styles.currentLangValue}> {currentLanguage === 'en' ? 'English' : 'Español'}</Text>
        </Text> */}
      </View>
      {/* ---------------------------------------------------- */}


      {/* Theme Toggle Section (remains the same) */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <View style={styles.toggleRow}>
            <Text style={[styles.label, styles.toggleLabel, { color: colors.text }]}>
              {t('settings.enableDarkMode', 'Enable Dark Mode')}
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

// --- Styles --- (Remove pickerContainer and picker styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor applied dynamically
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor, borderColor applied dynamically
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.1,
    shadowRadius: 2.00,
    elevation: 2,
  },
  label: { // Style still used by CustomPicker label prop
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
    // color applied dynamically
  },
  // Removed pickerContainer style
  // Removed picker style
  currentLangDisplay: { // Kept in case you want to add it back
      fontSize: 14,
      marginTop: 15, // Add margin if re-enabled
      textAlign: 'center',
      // color applied dynamically
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
      marginBottom: 0, // Ensure no extra margin
  }
});
