import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link, useFocusEffect } from 'expo-router';
import { useTheme } from 'context/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { commonStyles } from '../../styles/commonStyles';

const ACTIVE_GOAL_TYPE_KEY = 'profileActiveGoalType';
const MANUAL_GOAL_KEY = 'profileManualGoal';
const CALCULATED_GOAL_KEY = 'profileCalculatedGoal';
const DEFAULT_GOAL = 2000;

export default function ProfileIndexScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [activeGoal, setActiveGoal] = useState<string | number>(DEFAULT_GOAL);
  const [goalType, setGoalType] = useState<string>('simple');
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadActiveGoal = async () => {
          setIsLoading(true);
          try {
              const type = await AsyncStorage.getItem(ACTIVE_GOAL_TYPE_KEY);
              let goalValue: string | null = null;
              let goalNum: number = DEFAULT_GOAL;
              const currentGoalType = type === 'calculated' ? 'calculated' : 'simple';
              setGoalType(currentGoalType);

              if (currentGoalType === 'calculated') {
                  goalValue = await AsyncStorage.getItem(CALCULATED_GOAL_KEY);
              } else {
                  goalValue = await AsyncStorage.getItem(MANUAL_GOAL_KEY);
              }

              if (goalValue !== null) {
                  const parsedGoal = parseInt(goalValue, 10);
                  if (!isNaN(parsedGoal) && parsedGoal > 0) {
                      goalNum = parsedGoal;
                  } else {
                      goalNum = DEFAULT_GOAL;
                  }
              } else {
                  goalNum = DEFAULT_GOAL;
              }
              setActiveGoal(goalNum);

          } catch (e) {
              console.error("Failed to load active goal for display", e);
              setGoalType('simple');
              setActiveGoal(DEFAULT_GOAL);
          } finally {
              setIsLoading(false);
          }
      };
      loadActiveGoal();
    }, [])
  );

  return (
    <SafeAreaView style={[commonStyles.paddedContainer, { backgroundColor: colors.background }]}>

      <View style={ styles.preferencesTitleRow }>
        <Text style={[commonStyles.label, styles.preferencesTitleText, { color: colors.text }]}>
            {t('profile.preferences')}
        </Text>
        <Link href="/profile/edit" asChild>
          <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </Link>
      </View>

      <View style={[commonStyles.section, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[commonStyles.secondaryText, styles.label, { color: colors.textSecondary }]}>{t('profile.currentGoalType')}</Text>
          <Text style={[styles.value, { color: colors.text }]}>
              {goalType === 'calculated' ? t('profile.advancedMode') : t('profile.simpleMode')}
          </Text>
      </View>

      <View style={[commonStyles.section, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[commonStyles.secondaryText, styles.label, { color: colors.textSecondary }]}>{t('profile.activeGoal')}</Text>
          {isLoading ? (
              <ActivityIndicator color={colors.primary} />
          ) : (
              <Text style={[styles.value, { color: colors.text }]}>{activeGoal} kcal</Text>
          )}
      </View>

      <View style={[commonStyles.centerContent, styles.placeholderSection]}>
          <Text style={[commonStyles.secondaryText, styles.analyticsPlaceholder, { color: colors.textSecondary }]}>
              {t('profile.analyticsComingSoon')}
          </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  preferencesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  preferencesTitleText: {
      marginBottom: 0,
      fontSize: 18,
  },
  label: {
      marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  placeholderSection: {
    flex: 1,
  },
  analyticsPlaceholder: {
    textAlign: 'center',
    fontStyle: 'italic',
  }
});
