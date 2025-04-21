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
// Import useFocusEffect from expo-router (or fallback to @react-navigation/native if needed)
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import shared type and utility function
import { Entry } from 'types';
import { calculateCalories } from 'utils/calorieUtils';
// Import database functions
import { getAllEntries } from 'services/database';


// Interface for our grouped daily data
interface DailyData {
  date: string; // YYYY-MM-DD format
  entries: Entry[];
  totalCalories: number;
}

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Keep loading state
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Function to group entries by day and calculate totals (keep as is)
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

  // --- Replace useEffect with useFocusEffect ---
  useFocusEffect(
    useCallback(() => {
      // This function will run when the screen comes into focus
      const loadHistory = async () => {
        console.log("History screen focused, loading data...");
        // Set loading true only if data isn't already loaded maybe?
        // Or always show loading briefly for feedback
        setIsLoading(true);
        try {
          const allEntries = await getAllEntries();
          const processedData = processEntries(allEntries);
          setDailyData(processedData);
        } catch (error) {
          console.error("Failed to load history:", error);
          // Optionally show an error Alert here too
        } finally {
          setIsLoading(false);
        }
      };

      loadHistory();

      // Optional: Return a cleanup function if needed when screen goes out of focus
      // return () => console.log("History screen blurred");
    }, [processEntries]) // Dependency array for useCallback wrapper
  );
  // ---------------------------------------------

  // Toggle expansion for a day (keep as is)
  const toggleDayExpansion = (date: string) => {
    setExpandedDay((current) => (current === date ? null : date));
  };

  // Render item for the main list (each day) (keep as is)
  const renderDayItem = ({ item }: { item: DailyData }) => {
    const isExpanded = expandedDay === item.date;
    const displayDate = new Date(item.date + 'T00:00:00');
    const currentLanguage = i18n.language;

    return (
      <View style={styles.dayContainer}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => toggleDayExpansion(item.date)}
          activeOpacity={0.7}
        >
          <Text style={styles.dayDateText}>
            {displayDate.toLocaleDateString(currentLanguage, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
          <View style={styles.dayTotalRow}>
              <Text style={styles.dayTotalText}>{t('history.dailyTotal', 'Total:')} {item.totalCalories} kcal</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={20} color="#666"
              />
          </View>
        </TouchableOpacity>

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
      {/* Show loading indicator only when isLoading is true AND data is empty initially */}
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
          // Optional: Add pull-to-refresh using onRefresh prop if needed
          // onRefresh={loadHistory} // You'd need to expose loadHistory or wrap it
          // refreshing={isLoading}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles --- (Keep existing styles)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f0f0', },
  centerStatus: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  listContentContainer: { padding: 10, },
  dayContainer: { backgroundColor: '#ffffff', marginBottom: 10, borderRadius: 8, overflow: 'hidden', elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 1.00, },
  dayHeader: { padding: 15, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee', },
  dayTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, },
  dayDateText: { fontSize: 16, fontWeight: 'bold', color: '#333', },
  dayTotalText: { fontSize: 15, color: '#555', },
  dayDetails: { paddingHorizontal: 15, paddingBottom: 5, borderTopWidth: 1, borderTopColor: '#eee', },
  entryItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, },
  entryName: { fontWeight: 'bold', fontSize: 15, flex: 1, marginRight: 10, color: '#2c3e50', },
  entryCalculatedKcal: { fontWeight: 'bold', fontSize: 15, color: '#e74c3c', },
  entryDetails: { fontSize: 13, color: '#7f8c8d', },
  entryTimestamp: { fontSize: 11, color: '#95a5a6', },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666', }
});
