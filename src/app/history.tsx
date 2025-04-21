// src/app/history.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView, // Use SafeAreaView for screen content
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons'; // For dropdown icon

// Adjust path based on your structure
import { getAllEntries, Entry } from 'services/database';

// Interface for our grouped daily data
interface DailyData {
  date: string; // YYYY-MM-DD format
  entries: Entry[];
  totalCalories: number;
}

// Helper function to calculate calories for a single entry (copied for now)
// TODO: Consider moving this to a shared utility file
const calculateCalories = (item: Entry): number => {
  if (!item || typeof item.amount_in_g !== 'number' || typeof item.calories_per_100_g !== 'number') {
    return 0;
  }
  return Math.round((item.amount_in_g / 100.0) * item.calories_per_100_g);
};

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null); // Store date string of expanded day

  // Function to group entries by day and calculate totals
  const processEntries = useCallback((allEntries: Entry[]): DailyData[] => {
    if (!allEntries || allEntries.length === 0) {
        return [];
    }

    const grouped: { [date: string]: { entries: Entry[]; totalCalories: number } } = {};

    allEntries.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      // Format date as YYYY-MM-DD string for grouping key
      const dateString = entryDate.toISOString().split('T')[0];

      if (!grouped[dateString]) {
        grouped[dateString] = { entries: [], totalCalories: 0 };
      }

      const calculatedEntryCalories = calculateCalories(entry);
      grouped[dateString].entries.push(entry);
      grouped[dateString].totalCalories += calculatedEntryCalories;
    });

    // Convert grouped object to sorted array
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a)) // Sort dates descending (newest first)
      .map((date) => ({
        date: date,
        entries: grouped[date].entries.sort((a,b)=> b.createdAt - a.createdAt), // Sort entries within day
        totalCalories: grouped[date].totalCalories,
      }));
  }, []); // Add calculateCalories if it comes from props/context

  // Fetch and process data on mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const allEntries = await getAllEntries();
        const processedData = processEntries(allEntries);
        setDailyData(processedData);
      } catch (error) {
        console.error("Failed to load history:", error);
        // Consider showing an error message to the user
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [processEntries]);

  // Toggle expansion for a day
  const toggleDayExpansion = (date: string) => {
    setExpandedDay((currentExpanded) =>
      currentExpanded === date ? null : date // Toggle: close if already open, otherwise open this one
    );
  };

  // Render item for the main list (each day)
  const renderDayItem = ({ item }: { item: DailyData }) => {
    const isExpanded = expandedDay === item.date;
    const displayDate = new Date(item.date + 'T00:00:00'); // Ensure correct timezone handling for display if needed

    return (
      <View style={styles.dayContainer}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => toggleDayExpansion(item.date)}
          activeOpacity={0.7}
        >
          <Text style={styles.dayDateText}>
            {/* Basic date formatting, consider using a date library for better i18n later */}
            {displayDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <View style={styles.dayTotalRow}>
              <Text style={styles.dayTotalText}>{t('history.dailyTotal', 'Total:')} {item.totalCalories} kcal</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={20}
                color="#666"
              />
          </View>
        </TouchableOpacity>

        {/* Conditionally render details */}
        {isExpanded && (
          <View style={styles.dayDetails}>
            {item.entries.map((entry) => (
              <View key={entry.id} style={styles.entryItem}>
                 <View style={styles.entryRow}>
                    <Text style={styles.entryName}>{entry.name}</Text>
                    <Text style={styles.entryCalculatedKcal}>~ {calculateCalories(entry)} kcal</Text>
                 </View>
                 <View style={styles.entryRow}>
                    <Text style={styles.entryDetails}>{entry.amount_in_g}g ({entry.calories_per_100_g} kcal/100g)</Text>
                    <Text style={styles.entryTimestamp}>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                 </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // --- Component Return ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && dailyData.length === 0 ? (
        <View style={styles.centerStatus}>
            <ActivityIndicator size="large" />
            <Text>{t('common.loading', 'Loading History...')}</Text>
        </View>
      ) : (
        <FlatList
          data={dailyData}
          renderItem={renderDayItem}
          keyExtractor={(item) => item.date}
          ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>{t('history.noHistory', 'No history data found.')}</Text> : null}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Slightly different background for history
  },
  centerStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContentContainer: {
      padding: 10,
  },
  dayContainer: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden', // Keep details contained
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
  },
  dayHeader: {
    padding: 15,
    backgroundColor: '#f9f9f9', // Header slightly different background
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
   dayTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dayDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayTotalText: {
    fontSize: 15,
    color: '#555',
  },
  dayDetails: {
    paddingHorizontal: 15,
    paddingBottom: 5, // Add padding below last item
    borderTopWidth: 1, // Separator line
    borderTopColor: '#eee',
  },
  entryItem: {
    // Using similar styles to index screen, maybe slightly less padding
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5', // Lighter separator
  },
  entryItemLast: { // Style to remove border on last item if needed
     borderBottomWidth: 0,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3, // Smaller margin
  },
  entryName: {
      fontWeight: 'bold',
      fontSize: 15, // Slightly smaller
      flex: 1,
      marginRight: 10,
      color: '#2c3e50',
  },
  entryCalculatedKcal: {
      fontWeight: 'bold',
      fontSize: 15, // Slightly smaller
      color: '#e74c3c',
  },
  entryDetails: {
      fontSize: 13, // Slightly smaller
      color: '#7f8c8d',
  },
  entryTimestamp: {
    fontSize: 11, // Slightly smaller
    color: '#95a5a6',
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: '#666',
  }
});