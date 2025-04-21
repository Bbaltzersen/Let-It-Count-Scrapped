// src/app/index.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  SafeAreaView,
  Alert,
  Keyboard,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

// Import shared type and utility function
import { Entry } from 'types';
import { calculateCalories } from 'utils/calorieUtils';
// Import database functions
import { addEntry, getEntriesForDay } from 'services/database';

export default function HomeScreen() {
  const { t } = useTranslation();

  // --- State ---
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kcalPer100g, setKcalPer100g] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]); // Use imported Entry type
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetching ---
  // Memoize loadEntries function - depends on t for translated error messages
  const loadEntries = useCallback(async () => {
    console.log("Loading entries...");
    setIsLoading(true);
    try {
      const todayEntries = await getEntriesForDay(new Date());
      setEntries(todayEntries);
    } catch (error) {
      console.error("Failed to load entries:", error);
      Alert.alert(t('error.title', 'Error'), t('error.loadEntries', 'Failed to load entries.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]); // Correct dependency for useCallback

  // Load entries ONCE when the component mounts
  useEffect(() => {
    loadEntries();
  // highlight-next-line
  }, []); // FIX: Empty dependency array ensures this runs only once

  // --- Actions ---
  const handleAddEntry = async () => {
    const amountNum = parseInt(amount, 10);
    const kcalNum = parseInt(kcalPer100g, 10);
    if (!name.trim() || isNaN(amountNum) || amountNum <= 0 || isNaN(kcalNum) || kcalNum < 0) {
      Alert.alert(
        t('error.invalidInputTitle', "Invalid Input"),
        t('error.invalidInputMsg', "Please fill in all fields correctly (amount and kcal must be positive numbers).")
      );
      return;
    }
    Keyboard.dismiss();
    try {
      await addEntry(name, amountNum, kcalNum);
      Alert.alert(t('common.success', 'Success'), t('entry.addedSuccess', 'Entry added!'));
      setName('');
      setAmount('');
      setKcalPer100g('');
      await loadEntries(); // Reload entries after adding
    } catch (error) {
      console.error("Failed to add entry:", error);
      Alert.alert(t('error.title', 'Error'), t('error.addEntry', 'Failed to add entry.'));
    }
  };

  // --- Calculated Values ---
  // calculateCalories function is imported from utils

  const totalCaloriesToday = useMemo(() => {
    // Use the imported calculateCalories function
    return entries.reduce((sum, entry) => sum + calculateCalories(entry), 0);
  }, [entries]); // Dependency is only entries now

  // --- Rendering ---
  const renderEntry = ({ item }: { item: Entry }) => ( // Use imported Entry type
    <View style={styles.entryItem}>
      <View style={styles.entryRow}>
        <Text style={styles.entryName}>{item.name}</Text>
        {/* Use the imported calculateCalories function */}
        <Text style={styles.entryCalculatedKcal}>~ {calculateCalories(item)} kcal</Text>
      </View>
      <View style={styles.entryRow}>
        <Text style={styles.entryDetails}>{item.amount_in_g}g ({item.calories_per_100_g} kcal/100g)</Text>
        <Text style={styles.entryTimestamp}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </View>
  );

  // --- Component Return ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Input Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>{t('entry.addTitle', 'Add New Entry')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('entry.namePlaceholder', 'Food Name')}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder={t('entry.amountPlaceholder', 'Amount (g)')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder={t('entry.kcalPlaceholder', 'kcal/100g')}
            value={kcalPer100g}
            onChangeText={setKcalPer100g}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleAddEntry}
          />
        </View>
        <Button
          title={t('entry.addButton', 'Add Entry')}
          onPress={handleAddEntry}
        />
      </View>

      {/* Total Display */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>{t('entry.totalToday', 'Total Today:')}</Text>
        <Text style={styles.totalValue}>{totalCaloriesToday} kcal</Text>
      </View>

      {/* Entries List */}
      <FlatList
        style={styles.list}
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<Text style={styles.listTitle}>{t('entry.todayTitle', "Today's Entries")}</Text>}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <Text>{t('entry.noEntries', 'No entries yet for today.')}</Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

// --- Styles --- (Keep existing styles)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', },
  form: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eee', },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  row: { flexDirection: 'row', },
  input: { borderWidth: 1, borderColor: '#ddd', paddingVertical: Platform.OS === 'ios' ? 12 : 8, paddingHorizontal: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff', fontSize: 16, },
  inputSmall: { flex: 1, marginRight: 5, },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#e9edf5', borderBottomWidth: 1, borderBottomColor: '#d0d8e8', },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#34495e', },
  list: { flex: 1, },
  listContentContainer: { paddingHorizontal: 10, paddingBottom: 20, },
  listTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 10, paddingHorizontal: 10, },
  emptyList: { marginTop: 30, alignItems: 'center', padding: 20, },
  entryItem: { backgroundColor: '#ffffff', padding: 15, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 1.00, elevation: 1, },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, },
  entryName: { fontWeight: 'bold', fontSize: 16, flex: 1, marginRight: 10, color: '#2c3e50', },
  entryCalculatedKcal: { fontWeight: 'bold', fontSize: 16, color: '#e74c3c', },
  entryDetails: { fontSize: 14, color: '#7f8c8d', },
  entryTimestamp: { fontSize: 12, color: '#95a5a6', }
});
