import React from 'react';
import { View, Text, StyleSheet, Alert, Platform, Switch } from 'react-native'; // Added Switch
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'config/i18n'; // Adjust path if needed
import { Picker } from '@react-native-picker/picker';

// Import Theme context hook and type
import { useTheme, ThemeMode } from '../context/themeContext'; // Adjust path if needed

const STORE_LANGUAGE_KEY = 'userLanguage';
// const THEME_PREFERENCE_KEY = 'userThemePreference'; // Key is managed in ThemeContext

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    // themeMode, // We might not need the preference string directly now
    setThemeMode, // Function to change preference
    colors, // Current theme colors
    isDarkMode // Use this boolean for the switch state
  } = useTheme(); // Use the theme hook

  const currentLanguage = i18n.language;

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

  // Function to toggle theme preference between light and dark
  const toggleTheme = async (isNowDark: boolean) => {
    const newMode: ThemeMode = isNowDark ? 'dark' : 'light';
    console.log(`Attempting to toggle theme mode to: ${newMode}`);
    try {
      // Call the function from the context, which handles state update and saving
      await setThemeMode(newMode); // Explicitly set 'light' or 'dark'
      console.log(`Theme preference saved: ${newMode}`);
    } catch (error) {
        console.error('Failed to save theme preference:', error);
        Alert.alert(t('error.title', 'Error'), t('error.changeTheme', 'Failed to save theme preference.'));
    }
  };


  return (
    // Use themed background for the screen container
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Language Selection Section (remains the same) */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>{t('settings.selectLanguage', 'Select Language:')}</Text>
        <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
          <Picker
            selectedValue={currentLanguage}
            onValueChange={(itemValue) => {
              if (itemValue === 'en' || itemValue === 'es') {
                changeLanguage(itemValue);
              }
            }}
            style={[styles.picker, { color: colors.inputText }]}
            dropdownIconColor={colors.icon}
          >
            <Picker.Item label="🇬🇧 English" value="en" color={Platform.OS === 'android' ? colors.inputText : undefined} />
            <Picker.Item label="🇪🇸 Español" value="es" color={Platform.OS === 'android' ? colors.inputText : undefined} />
          </Picker>
        </View>
        <Text style={[styles.currentLangDisplay, { color: colors.textSecondary }]}>
          {t('settings.currentLanguage', 'Current Language:')}
          <Text style={styles.currentLangValue}> {currentLanguage === 'en' ? 'English' : 'Español'}</Text>
        </Text>
      </View>

      {/* --- Theme Toggle Section --- */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <View style={styles.toggleRow}>
            <Text style={[styles.label, styles.toggleLabel, { color: colors.text }]}>
              {t('settings.enableDarkMode', 'Enable Dark Mode')}
            </Text>
            <Switch
              trackColor={{ false: "#767577", true: colors.primary }} // Customize track color
              thumbColor={isDarkMode ? "#f4f3f4" : "#f4f3f4"} // Customize thumb color
              ios_backgroundColor="#3e3e3e" // Background for iOS track
              onValueChange={toggleTheme} // Calls toggleTheme with new boolean state
              value={isDarkMode} // The switch is "on" if isDarkMode is true
            />
         </View>
      </View>
      {/* ----------------------------- */}

    </View>
  );
}

// --- Styles --- (Apply theme colors and add toggle styles)
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
  label: {
    fontSize: 16,
    marginBottom: 10, // Adjusted margin
    fontWeight: '500',
    // color applied dynamically
  },
  pickerContainer: { // Keep styles for language picker
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
    // borderColor, backgroundColor applied dynamically
  },
  picker: { // Keep styles for language picker
    width: '100%',
    // color applied dynamically
    height: Platform.OS === 'android' ? 50 : undefined,
  },
  currentLangDisplay: { // Keep styles for language display
      fontSize: 14,
      marginTop: 5,
      textAlign: 'center',
      // color applied dynamically
  },
  currentLangValue: {
      fontWeight: 'bold',
  },
  // New styles for the toggle row
  toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // Remove vertical padding if label provides enough space
      // paddingVertical: 10,
  },
  toggleLabel: {
      flex: 1, // Allow label to take available space
      marginRight: 10, // Space between label and switch
      marginBottom: 0, // Remove bottom margin for toggle label
  }
});
