import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link, useFocusEffect } from 'expo-router';
import { useTheme } from 'context/themeContext'; // Using camelCase filename
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

// Constants for keys
const ACTIVE_GOAL_TYPE_KEY = 'profileActiveGoalType';
const MANUAL_GOAL_KEY = 'profileManualGoal';
const CALCULATED_GOAL_KEY = 'profileCalculatedGoal';
const DEFAULT_GOAL = 2000; // Default goal

export default function ProfileIndexScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // --- Set initial state to defaults ---
  const [activeGoal, setActiveGoal] = useState<string | number>(DEFAULT_GOAL);
  const [goalType, setGoalType] = useState<string>('simple'); // Default to simple
  // ------------------------------------
  const [isLoading, setIsLoading] = useState(true);

  // Load the active goal to display whenever the screen focuses
  useFocusEffect(
    useCallback(() => {
      const loadActiveGoal = async () => {
          console.log("Profile screen focused, loading active goal...");
          setIsLoading(true);
          try {
              const type = await AsyncStorage.getItem(ACTIVE_GOAL_TYPE_KEY);
              let goalValue: string | null = null;
              let goalNum: number = DEFAULT_GOAL;
              // --- Use 'simple' as default goalType if null ---
              const currentGoalType = type === 'calculated' ? 'calculated' : 'simple';
              // ---------------------------------------------
              setGoalType(currentGoalType);

              if (currentGoalType === 'calculated') {
                  goalValue = await AsyncStorage.getItem(CALCULATED_GOAL_KEY);
                  console.log("Profile Index: Loading calculated goal", goalValue);
              } else {
                  goalValue = await AsyncStorage.getItem(MANUAL_GOAL_KEY);
                  console.log("Profile Index: Loading manual goal", goalValue);
              }

              if (goalValue !== null) {
                  const parsedGoal = parseInt(goalValue, 10);
                  if (!isNaN(parsedGoal) && parsedGoal > 0) {
                      goalNum = parsedGoal;
                  } else {
                      console.warn(`Invalid goal value found ('${goalValue}'), using default.`);
                      // --- Use 2000 as default if stored value invalid ---
                      goalNum = DEFAULT_GOAL;
                      // -------------------------------------------------
                  }
              } else {
                  // --- Use 2000 as default if no value found ---
                  goalNum = DEFAULT_GOAL;
                  // ------------------------------------------
              }
              setActiveGoal(goalNum);

          } catch (e) {
              console.error("Failed to load active goal for display", e);
              // --- Fallback to defaults on error ---
              setGoalType('simple');
              setActiveGoal(DEFAULT_GOAL);
              // ------------------------------------
          } finally {
              setIsLoading(false);
          }
      };
      loadActiveGoal();
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Link/Button to the Edit screen */}
        <View style={ styles.preferencesTitle }>
          <Text style={[styles.editButtonText, { color: colors.text }]}>{t('profile.preferences', 'Current preferences:')}</Text>
        <Link href="/profile/edit" asChild>
          <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="pencil-outline" size={24} color={colors.primary} style={{ marginRight: 8 }}/>
          </TouchableOpacity>
        </Link>
        </View>
        
      <View style={styles.content}>
        {/* Goal Type Display */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.currentGoalType', 'Current Goal Type:')}</Text>
            <Text style={[styles.value, { color: colors.text }]}>
                {/* --- Use 'simple' instead of 'manual' for display --- */}
                {goalType === 'calculated' ? t('profile.advancedMode', 'Advanced') : t('profile.simpleMode', 'Simple')}
                {/* ------------------------------------------------ */}
            </Text>
        </View>

        {/* Active Goal Display */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.activeGoal', 'Active Daily Goal:')}</Text>
            {isLoading ? (
                <ActivityIndicator color={colors.text} />
             ) : (
                <Text style={[styles.value, { color: colors.text }]}>{activeGoal} kcal</Text>
             )}
        </View>

        

        {/* Placeholder for future analytics */}
        <View style={styles.placeholderSection}>
            <Text style={[styles.analyticsPlaceholder, { color: colors.textSecondary }]}>
                {t('profile.analyticsComingSoon', 'Analytics coming soon...')}
            </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, },
  preferencesTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 16,
    fontWeight: 'bold',
    paddingRight: 30,
    paddingLeft: 30,
    paddingTop: 20,
  },
  content: { flex: 1, padding: 20, },
  section: { marginBottom: 20, padding: 15, borderRadius: 8, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.1, shadowRadius: 2.00, elevation: 2, },
  label: { fontSize: 14, marginBottom: 5, fontWeight: '500', },
  value: { fontSize: 18, fontWeight: 'bold', },
  editButton: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, minHeight: 44, },
  editButtonText: { fontSize: 16, fontWeight: 'bold', },
  placeholderSection: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  analyticsPlaceholder: { textAlign: 'center', fontStyle: 'italic', }
});
