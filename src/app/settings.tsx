import React from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native'; // Removed Button
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'config/i18n'; // Adjust path if needed
import { Picker } from '@react-native-picker/picker'; // Import Picker

const STORE_LANGUAGE_KEY = 'userLanguage';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = async (lang: 'en' | 'es') => {
    if (lang === currentLanguage) return; // No change needed

    console.log(`Attempting to change language to: ${lang}`);
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, lang);
      // Alert might be slightly annoying after every picker change, consider removing
      // Alert.alert(
      //   t('common.success', 'Success'),
      //   t('settings.languageChanged', `Language changed to ${lang === 'en' ? 'English' : 'Spanish'}.`)
      // );
      console.log(`Language changed and preference saved: ${lang}`);
    } catch (error) {
      console.error('Failed to change language or save preference:', error);
      Alert.alert(t('error.title', 'Error'), t('error.changeLanguage', 'Failed to change language.'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Section for language selection using Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>{t('settings.selectLanguage', 'Select Language:')}</Text>
        {/* Wrap Picker in a View for better style control if needed */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={currentLanguage}
            onValueChange={(itemValue, itemIndex) => {
              if (itemValue === 'en' || itemValue === 'es') {
                changeLanguage(itemValue);
              }
            }}
            style={styles.picker}
            // Dropdown icon color can sometimes be styled with itemStyle on iOS
            // itemStyle={{ color: '#333' }} // Example for iOS item text color
          >
            {/* English Option */}
            <Picker.Item label="🇬🇧 English" value="en" />
            {/* Spanish Option */}
            <Picker.Item label="🇪🇸 Español" value="es" />
          </Picker>
        </View>
         {/* Display current language below picker for confirmation */}
         <Text style={styles.currentLangDisplay}>
           {t('settings.currentLanguage', 'Current Language:')}
           <Text style={styles.currentLangValue}> {currentLanguage === 'en' ? 'English' : 'Español'}</Text>
         </Text>
      </View>

      {/* Add other settings sections here later */}

    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 15, // Adjust padding
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.1,
    shadowRadius: 2.00,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 5, // Less space needed above picker
    color: '#444',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15, // Space below picker
    backgroundColor: '#fff', // Background for the container view
    overflow: 'hidden', // Helps with border radius on Android sometimes
  },
  picker: {
    // Height might be needed on Android, adjust as necessary
    // height: 50,
    width: '100%',
    // Note: Direct styling of Picker can be limited. Style the container.
    // Color applies to selected item text on Android sometimes
    // color: '#000',
  },
  currentLangDisplay: {
      fontSize: 14,
      color: '#666',
      marginTop: 5, // Space above current language display
      textAlign: 'center',
  },
  currentLangValue: {
      fontWeight: 'bold',
  },
  // Removed buttonContainer style
});
