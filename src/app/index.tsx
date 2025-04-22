// src/app/index.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  SafeAreaView,
  Alert,
  Keyboard,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Entry } from 'types';
import { calculateCalories } from 'utils/calorieUtils';
import { addEntry, getEntriesForDay } from 'services/database';
import { useTheme } from '../context/themeContext'; // Corrected import path

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();

  // --- State, Data Fetching, Actions, Calculated Values --- (Keep as is)
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kcalPer100g, setKcalPer100g] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => { /* ... */ setIsLoading(true); try { const todayEntries = await getEntriesForDay(new Date()); setEntries(todayEntries); } catch (error) { console.error("Failed to load entries:", error); Alert.alert(t('error.title', 'Error'), t('error.loadEntries', 'Failed to load entries.')); } finally { setIsLoading(false); } }, [t]);
  useEffect(() => { loadEntries(); }, []);

  const handleAddEntry = async () => { /* ... */ const amountNum = parseInt(amount, 10); const kcalNum = parseInt(kcalPer100g, 10); if (!name.trim() || isNaN(amountNum) || amountNum <= 0 || isNaN(kcalNum) || kcalNum < 0) { Alert.alert( t('error.invalidInputTitle', "Invalid Input"), t('error.invalidInputMsg', "Please fill in all fields correctly (amount and kcal must be positive numbers).") ); return; } Keyboard.dismiss(); try { await addEntry(name, amountNum, kcalNum); Alert.alert(t('common.success', 'Success'), t('entry.addedSuccess', 'Entry added!')); setName(''); setAmount(''); setKcalPer100g(''); await loadEntries(); } catch (error) { console.error("Failed to add entry:", error); Alert.alert(t('error.title', 'Error'), t('error.addEntry', 'Failed to add entry.')); } };
  const totalCaloriesToday = useMemo(() => entries.reduce((sum, entry) => sum + calculateCalories(entry), 0), [entries]);

  // --- Rendering ---
  const renderEntry = ({ item }: { item: Entry }) => (
    // Apply theme colors to list item
    <View style={[styles.entryItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.entryRow}>
        <Text style={[styles.entryName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.entryCalculatedKcal, { color: colors.kcalHighlight }]}>
            ~ {calculateCalories(item)} kcal
        </Text>
      </View>
      <View style={styles.entryRow}>
        <Text style={[styles.entryDetails, { color: colors.textSecondary }]}>{item.amount_in_g}g ({item.calories_per_100_g} kcal/100g)</Text>
        <Text style={[styles.entryTimestamp, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </View>
  );

  // --- Component Return ---
  return (
    // Add horizontal padding to SafeAreaView to prevent content touching edges
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* --- Form Section Wrapper --- */}
      <View style={styles.formSectionContainer}>
        {/* Title moved outside the card */}
        <Text style={[styles.formTitle, { color: colors.text }]}>{t('entry.addTitle', 'Add New Entry')}</Text>

        {/* Input Form Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[ styles.input, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
            placeholder={t('entry.namePlaceholder', 'Food Name')}
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
          <View style={styles.row}>
            <TextInput
              style={[ styles.input, styles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
              placeholder={t('entry.amountPlaceholder', 'Amount (g)')}
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              returnKeyType="next"
            />
            <TextInput
              style={[ styles.input, styles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
              placeholder={t('entry.kcalPlaceholder', 'kcal/100g')}
              placeholderTextColor={colors.textSecondary}
              value={kcalPer100g}
              onChangeText={setKcalPer100g}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleAddEntry}
            />
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleAddEntry}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>{t('entry.addButton', 'Add Entry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* ------------------------------- */}


      {/* Total Display */}
      {/* Apply card styles and theme colors */}
      {/* Removed inline marginHorizontal */}
      <View style={[styles.totalContainer, styles.cardLook, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <Text style={[styles.totalLabel, { color: colors.text }]}>{t('entry.totalToday', 'Total Today:')}</Text>
         <Text style={[styles.totalValue, { color: colors.primary }]}>{totalCaloriesToday} kcal</Text>
       </View>

      {/* Entries List */}
      {/* List already has horizontal padding via contentContainerStyle */}
      <FlatList
        style={styles.list}
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<Text style={[styles.listTitle, { color: colors.text }]}>{t('entry.todayTitle', "Today's Entries")}</Text>}
        ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyList}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyList}>
                <Text style={{ color: colors.textSecondary }}>{t('entry.noEntries', 'No entries yet for today.')}</Text>
              </View>
            )
        }
        contentContainerStyle={styles.listContentContainer}
      />

      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  formSectionContainer: {
      marginTop: 10,
      marginBottom: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 10, // Align with card padding
    // textAlign: 'center', // Removed centering
  },
  // Common styles for card-like appearance
  cardLook: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  formCard: {
    // Inherit card look
    // Specific padding/margins handled here if different from other cards
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    borderWidth: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  inputSmall: {
    flex: 1,
    marginRight: 5,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 44,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalContainer: {
    // Inherit card look
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8, // Increased space below total
    // Removed inline marginHorizontal
    // paddingVertical adjusted via cardLook padding
    // paddingHorizontal adjusted via cardLook padding
    // borderRadius, borderWidth, shadow applied via cardLook
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10, // Align with card padding
  },
  emptyList: {
    marginTop: 30,
    alignItems: 'center',
    padding: 20,
  },
  entryItem: {
    // Inherit card look
    padding: 15, // Keep padding specific to entry item if needed
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1, // Slightly less elevation than form/total
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  entryName: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  entryCalculatedKcal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  entryDetails: {
    fontSize: 14,
  },
  entryTimestamp: {
    fontSize: 12,
  }
});
