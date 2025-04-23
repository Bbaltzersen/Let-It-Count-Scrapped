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
import { Entry } from 'types';
import { calculateCalories } from 'utils/calorieUtils';
import { getAllEntries } from 'services/database';
import { useTheme } from '../context/themeContext';
import { commonStyles } from '../styles/commonStyles';

interface DailyData {
  date: string;
  entries: Entry[];
  totalCalories: number;
}

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

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
              entries: grouped[date].entries.sort((a, b) => b.createdAt - a.createdAt),
              totalCalories: grouped[date].totalCalories,
          }));
  }, []);

  useFocusEffect(
      useCallback(() => {
          const loadHistory = async () => {
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

  const toggleDayExpansion = (date: string) => {
      setExpandedDay((current) => (current === date ? null : date));
  };

  const renderDayItem = ({ item }: { item: DailyData }) => {
    const isExpanded = expandedDay === item.date;
    const displayDate = new Date(item.date + 'T00:00:00');
    const currentLanguage = i18n.language;

    return (
      <View style={[commonStyles.cardLook, styles.dayContainer, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <TouchableOpacity
          style={[styles.dayHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleDayExpansion(item.date)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayDateText, { color: colors.text }]}>
            {displayDate.toLocaleDateString(currentLanguage, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
          <View style={[commonStyles.row, styles.dayTotalRow]}>
              <Text style={[styles.dayTotalText, { color: colors.textSecondary }]}>
                {t('history.dailyTotal')} {item.totalCalories} kcal
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={20}
                color={colors.icon}
              />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.dayDetails, { borderTopColor: colors.border }]}>
            {item.entries.map((entry, index, arr) => (
              <View
                key={entry.id}
                style={[
                    styles.entryItem,
                    index === arr.length - 1 ? { borderBottomWidth: 0 } : { borderBottomColor: colors.border }
                ]}
              >
                  <View style={commonStyles.entryRow}>
                    <Text style={[commonStyles.entryName, { color: colors.text }]}>{entry.name}</Text>
                    <Text style={[commonStyles.entryCalculatedKcal, { color: colors.kcalHighlight }]}>~ {calculateCalories(entry)} kcal</Text>
                  </View>
                  <View style={commonStyles.entryRow}>
                    <Text style={[commonStyles.entryDetails, { color: colors.textSecondary }]}>{entry.amount_in_g}g ({entry.calories_per_100_g} kcal/100g)</Text>
                    <Text style={[commonStyles.entryTimestamp, { color: colors.textSecondary }]}>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[commonStyles.safeArea, { backgroundColor: colors.background }]}>
      {isLoading && dailyData.length === 0 ? (
        <View style={[commonStyles.centerContent, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary}/>
            <Text style={[commonStyles.secondaryText, {marginTop: 10, color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={dailyData}
          renderItem={renderDayItem}
          keyExtractor={(item) => item.date}
          ListEmptyComponent={!isLoading ? <Text style={[commonStyles.emptyListText, { color: colors.textSecondary }]}>{t('history.noHistory')}</Text> : null}
          contentContainerStyle={commonStyles.listContentContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dayContainer: {
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 1,
  },
  dayHeader: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayTotalRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dayDateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayTotalText: {
    fontSize: 15,
  },
  dayDetails: {
    paddingHorizontal: 15,
    paddingBottom: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  entryItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
