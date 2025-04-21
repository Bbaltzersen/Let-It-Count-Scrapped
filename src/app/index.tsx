// src/app/index.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button, // Or use TouchableOpacity + Text for custom styling
  FlatList,
  SafeAreaView, // Use SafeAreaView for content area within the screen
  Alert,
  Keyboard,
  ActivityIndicator, // For loading state in list
  Platform, // For potential platform-specific adjustments
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

// Adjust path based on your structure (assuming src/services)
// Ensure database.ts exports these correctly
import { addEntry, getEntriesForDay, Entry } from 'services/database';

export default function HomeScreen() {
  const { t } = useTranslation(); // Get translation function

  // --- State ---
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kcalPer100g, setKcalPer100g] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially

  // --- Data Fetching ---
  const loadEntries = useCallback(async () => {
    console.log("Loading entries...");
    setIsLoading(true);
    try {
      // Fetch entries for the current date
      const todayEntries = await getEntriesForDay(new Date());
      setEntries(todayEntries);
    } catch (error) {
      console.error("Failed to load entries:", error);
      // Use translated error messages
      Alert.alert(t('error.title', 'Error'), t('error.loadEntries', 'Failed to load entries.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]); // Include t in dependency array

  // Load entries when the component mounts
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // --- Actions ---
  const handleAddEntry = async () => {
    const amountNum = parseInt(amount, 10);
    const kcalNum = parseInt(kcalPer100g, 10);

    // Validation
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
      // Clear inputs
      setName('');
      setAmount('');
      setKcalPer100g('');
      // Reload entries
      await loadEntries();
    } catch (error) {
      console.error("Failed to add entry:", error);
      Alert.alert(t('error.title', 'Error'), t('error.addEntry', 'Failed to add entry.'));
    }
  };

  // --- Helpers ---
  const calculateCalories = useCallback((item: Entry): number => {
    if (!item || typeof item.amount_in_g !== 'number' || typeof item.calories_per_100_g !== 'number') {
        return 0;
    }
    return Math.round((item.amount_in_g / 100.0) * item.calories_per_100_g);
  }, []); // Empty dependency array as it doesn't depend on component state/props

  // --- Calculated Values ---
  const totalCaloriesToday = useMemo(() => {
    return entries.reduce((sum, entry) => {
      return sum + calculateCalories(entry);
    }, 0);
  }, [entries, calculateCalories]); // Recalculate if entries or the calculation logic changes

  // --- Rendering ---
  const renderEntry = ({ item }: { item: Entry }) => (
    <View style={styles.entryItem}>
      <View style={styles.entryRow}>
        <Text style={styles.entryName}>{item.name}</Text>
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
            onSubmitEditing={handleAddEntry} // Optional: submit on keyboard 'done'
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

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  form: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center'
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  inputSmall: {
      flex: 1,
      marginRight: 5,
      // Basic way to remove margin on the very last input in the row
      // This assumes only two inputs. A more robust solution might involve mapping or different styling.
      // If you add more inputs to the row, adjust this logic.
      // Alternatively, set marginRight on all and negative margin on the container, or use gap styling.
      // For simplicity, we target the second input assuming it's the last.
      // This specific application isn't robust but works for 2 inputs.
      // A better approach might involve conditional styling or a different layout strategy.
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#e9edf5', // Slightly different background
    borderBottomWidth: 1,
    borderBottomColor: '#d0d8e8',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  list: {
    flex: 1,
  },
  listContentContainer: {
      paddingHorizontal: 10,
      paddingBottom: 20,
  },
  listTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 15,
      marginBottom: 10,
      paddingHorizontal: 10,
  },
  emptyList: {
    marginTop: 30,
    alignItems: 'center',
    padding: 20,
  },
  entryItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // Add space between rows within an item
    // Ensure last row doesn't have margin bottom if needed (usually fine)
    // &:last-child { marginBottom: 0 } // Not possible directly
  },
  entryName: {
      fontWeight: 'bold',
      fontSize: 16,
      flex: 1,
      marginRight: 10,
      color: '#2c3e50',
  },
  entryCalculatedKcal: {
      fontWeight: 'bold',
      fontSize: 16,
      color: '#e74c3c', // Kcal color
  },
  entryDetails: {
      fontSize: 14,
      color: '#7f8c8d', // Lighter details color
  },
  entryTimestamp: {
    fontSize: 12,
    color: '#95a5a6', // Even lighter timestamp
  }
});