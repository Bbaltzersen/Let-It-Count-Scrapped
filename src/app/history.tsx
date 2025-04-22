// src/app/history.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import shared type and utility function
import { Entry } from 'types';
import { calculateCalories } from 'utils/calorieUtils';
// Import database functions
import { getAllEntries } from 'services/database';
// Import theme hook
import { useTheme } from 'context/themeContext'; // Adjust path if needed


// Interface for our grouped daily data
interface DailyData {
  date: string; // YYYY-MM-DD format
  entries: Entry[];
  totalCalories: number;
}

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  // --- FIX: Destructure isDarkMode along with colors ---
  const { colors, isDarkMode } = useTheme();
  // ----------------------------------------------------
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Function to group entries by day and calculate totals
  const processEntries = useCallback((allEntries: Entry[]): DailyData[] => {
    if (!allEntries || allEntries.length === 0) return [];
    const grouped: { [date: string]: { entries: Entry[]; totalCalories: number } } = {};
    allEntries.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      const dateString = entryDate.toISOString().split('T')[0];
      if (!grouped[dateString]) {
        grouped[dateString] = { entries: [], totalCalories: 0 };
      }
      const calculatedEntryCalories = calculateCalories(entry);
      grouped[dateString].entries.push(entry);
      grouped[dateString].totalCalories += calculatedEntryCalories;
    });
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date: date,
        entries: grouped[date].entries.sort((a,b)=> b.createdAt - a.createdAt),
        totalCalories: grouped[date].totalCalories,
      }));
  }, []);

  // Fetch data when screen focuses
  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        console.log("History screen focused, loading data...");
        setIsLoading(true);
        try {
          const allEntries = await getAllEntries();
          const processedData = processEntries(allEntries);
          setDailyData(processedData);
        } catch (error) {
          console.error("Failed to load history:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    }, [processEntries])
  );

  // Toggle expansion for a day
  const toggleDayExpansion = (date: string) => {
    setExpandedDay((current) => (current === date ? null : date));
  };

  // Render item for the main list (each day)
  const renderDayItem = ({ item }: { item: DailyData }) => {
    const isExpanded = expandedDay === item.date;
    const displayDate = new Date(item.date + 'T00:00:00');
    const currentLanguage = i18n.language;

    return (
      // Apply theme colors to day container
      // Use isDarkMode here (now it's defined)
      <View style={[styles.dayContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? '#000' : '#555' }]}>
        <TouchableOpacity
          // Apply theme colors to day header
          style={[styles.dayHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleDayExpansion(item.date)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayDateText, { color: colors.text }]}>
            {displayDate.toLocaleDateString(currentLanguage, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
          <View style={styles.dayTotalRow}>
              {/* Apply theme colors to total text */}
              <Text style={[styles.dayTotalText, { color: colors.textSecondary }]}>{t('history.dailyTotal', 'Total:')} {item.totalCalories} kcal</Text>
              {/* Apply theme color to icon */}
              <Ionicons
                name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={20}
                color={colors.icon} // Use theme icon color
              />
          </View>
        </TouchableOpacity>

        {/* Conditionally render details */}
        {isExpanded && (
          // Apply theme colors to details container
          <View style={[styles.dayDetails, { borderTopColor: colors.border }]}>
            {item.entries.map((entry, index, arr) => (
              // Apply theme colors to entry item
              <View
                key={entry.id}
                style={[
                    styles.entryItem,
                    // Remove bottom border for the last item in the expanded list
                    index === arr.length - 1 ? { borderBottomWidth: 0 } : { borderBottomColor: colors.border }
                ]}
              >
                 <View style={styles.entryRow}>
                    <Text style={[styles.entryName, { color: colors.text }]}>{entry.name}</Text>
                    {/* Use kcalHighlight color */}
                    <Text style={[styles.entryCalculatedKcal, { color: colors.kcalHighlight }]}>~ {calculateCalories(entry)} kcal</Text>
                 </View>
                 <View style={styles.entryRow}>
                    <Text style={[styles.entryDetails, { color: colors.textSecondary }]}>{entry.amount_in_g}g ({entry.calories_per_100_g} kcal/100g)</Text>
                    <Text style={[styles.entryTimestamp, { color: colors.textSecondary }]}>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
    // Apply theme background color
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {isLoading && dailyData.length === 0 ? (
        // Apply theme colors to loading state
        <View style={[styles.centerStatus, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary}/>
            <Text style={{ color: colors.textSecondary }}>{t('common.loading', 'Loading History...')}</Text>
        </View>
      ) : (
        <FlatList
          data={dailyData}
          renderItem={renderDayItem}
          keyExtractor={(item) => item.date}
          // Apply theme color to empty text
          ListEmptyComponent={!isLoading ? <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('history.noHistory', 'No history data found.')}</Text> : null}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles --- (Base structural styles - colors applied dynamically above)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor applied dynamically
  },
  centerStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    // backgroundColor applied dynamically
  },
  listContentContainer: {
      padding: 10,
  },
  dayContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden', // Keep details contained
    elevation: 1,
    // backgroundColor applied dynamically
    // shadowColor adjusted dynamically for better visibility on dark bg
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
  },
  dayHeader: {
    padding: 15,
    // backgroundColor: '#f9f9f9', // Use theme card color or slightly different shade
    borderBottomWidth: StyleSheet.hairlineWidth, // Thinner border
    // borderBottomColor applied dynamically
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
    // color applied dynamically
  },
  dayTotalText: {
    fontSize: 15,
    // color applied dynamically
  },
  dayDetails: {
    paddingHorizontal: 15,
    paddingBottom: 5,
    borderTopWidth: StyleSheet.hairlineWidth, // Thinner border
    // borderTopColor applied dynamically
  },
  entryItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, // Thinner border
    // borderBottomColor applied dynamically (or removed for last item)
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  entryName: {
      fontWeight: 'bold',
      fontSize: 15,
      flex: 1,
      marginRight: 10,
      // color applied dynamically
  },
  entryCalculatedKcal: {
      fontWeight: 'bold',
      fontSize: 15,
      // color applied dynamically
  },
  entryDetails: {
      fontSize: 13,
      // color applied dynamically
  },
  entryTimestamp: {
    fontSize: 11,
    // color applied dynamically
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      // color applied dynamically
  }
});
