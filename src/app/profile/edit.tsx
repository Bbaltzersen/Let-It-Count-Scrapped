import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/themeContext';
import { CustomPicker, PickerOption } from '../../components/customPicker';
import { ScrollableValuePicker } from '../../components/scrollableValuePicker';

const PROFILE_MODE_KEY = 'profileMode';
const MANUAL_GOAL_KEY = 'profileManualGoal';
const AGE_KEY = 'profileAge';
const SEX_KEY = 'profileSex';
const HEIGHT_KEY = 'profileHeight';
const WEIGHT_KEY = 'profileWeight';
const ACTIVITY_LEVEL_KEY = 'profileActivityLevel';
const WEIGHT_GOAL_KEY = 'profileWeightGoal';
const CALCULATED_GOAL_KEY = 'profileCalculatedGoal';
const ACTIVE_GOAL_TYPE_KEY = 'profileActiveGoalType';

type ProfileMode = 'simple' | 'advanced';
type Sex = 'male' | 'female' | '';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | '';

export default function ProfileEditScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [mode, setMode] = useState<ProfileMode>('simple');
  const [manualGoal, setManualGoal] = useState('2000');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('');
  const [weightGoalValue, setWeightGoalValue] = useState(0);
  const [calculatedGoal, setCalculatedGoal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [
          savedMode,
          savedManualGoal,
          savedAge,
          savedSex,
          savedHeight,
          savedWeight,
          savedActivityLevel,
          savedWeightGoalStr,
          savedCalculatedStr,
        ] = await Promise.all([
          AsyncStorage.getItem(PROFILE_MODE_KEY),
          AsyncStorage.getItem(MANUAL_GOAL_KEY),
          AsyncStorage.getItem(AGE_KEY),
          AsyncStorage.getItem(SEX_KEY),
          AsyncStorage.getItem(HEIGHT_KEY),
          AsyncStorage.getItem(WEIGHT_KEY),
          AsyncStorage.getItem(ACTIVITY_LEVEL_KEY),
          AsyncStorage.getItem(WEIGHT_GOAL_KEY),
          AsyncStorage.getItem(CALCULATED_GOAL_KEY),
        ]);

        setMode(savedMode === 'advanced' ? 'advanced' : 'simple');
        setManualGoal(savedManualGoal ?? '2000');
        if (savedAge) setAge(savedAge);
        if (savedSex === 'male' || savedSex === 'female') setSex(savedSex);
        if (savedHeight) setHeight(savedHeight);
        if (savedWeight) setWeight(savedWeight);
        if (
          savedActivityLevel &&
          ['sedentary', 'light', 'moderate', 'very'].includes(savedActivityLevel)
        ) {
          setActivityLevel(savedActivityLevel as ActivityLevel);
        }
        const wk = parseFloat(savedWeightGoalStr ?? '0');
        setWeightGoalValue(isNaN(wk) ? 0 : wk);

        const cg = parseInt(savedCalculatedStr ?? '', 10);
        if (!isNaN(cg)) setCalculatedGoal(cg);
      } catch (err) {
        console.error(err);
        Alert.alert(
          t('error.title', 'Error'),
          t('profile.loadError', 'Failed to load profile data.')
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [t]);

  const saveData = useCallback(
    async (key: string, value: string | number | null) => {
      try {
        if (value === null || value === '') {
          await AsyncStorage.removeItem(key);
        } else {
          await AsyncStorage.setItem(key, String(value));
        }
      } catch (err) {
        console.error(err);
        Alert.alert(
          t('error.title', 'Error'),
          t('profile.saveError', 'Failed to save setting.')
        );
      }
    },
    [t]
  );

  useEffect(() => {
    if (mode !== 'advanced') return;

    const a = parseInt(age, 10);
    const h = parseInt(height, 10);
    const w = parseFloat(weight);
    const delta = weightGoalValue;
    
    if (!isNaN(a) && sex && !isNaN(h) && !isNaN(w) && activityLevel) {
      const bmr =
        sex === 'male'
          ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
          : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;

      const activityFactor =
        activityLevel === 'light'
          ? 1.375
          : activityLevel === 'moderate'
          ? 1.55
          : activityLevel === 'very'
          ? 1.725
          : 1.2;

      const tdee = bmr * activityFactor;
      const adj = (delta * 7700) / 7;
      const total = Math.round(tdee + adj);

      if (total > 0) {
        setCalculatedGoal(total);
        saveData(CALCULATED_GOAL_KEY, total);
        saveData(ACTIVE_GOAL_TYPE_KEY, 'calculated');
      } else {
        setCalculatedGoal(null);
        saveData(CALCULATED_GOAL_KEY, null);
      }
    } else {
      setCalculatedGoal(null);
      saveData(CALCULATED_GOAL_KEY, null);
    }
  }, [mode, age, sex, height, weight, activityLevel, weightGoalValue, saveData]);

  const onModeChange = (m: ProfileMode) => {
    setMode(m);
    saveData(PROFILE_MODE_KEY, m);
    saveData(
      ACTIVE_GOAL_TYPE_KEY,
      m === 'simple' ? 'manual' : 'calculated'
    );
  };
  const onManualGoal = (text: string) => {
    const numOnly = text.replace(/[^0-9]/g, '');
    setManualGoal(numOnly);
    saveData(MANUAL_GOAL_KEY, numOnly);
    if (mode === 'simple') saveData(ACTIVE_GOAL_TYPE_KEY, 'manual');
  };
  const onWeightGoal = (val: number) => {
    setWeightGoalValue(val);
    saveData(WEIGHT_GOAL_KEY, val);
  };

  const sexOptions: PickerOption<Sex>[] = useMemo(
    () => [
      { label: t('profile.sexMale', 'Male'), value: 'male' },
      { label: t('profile.sexFemale', 'Female'), value: 'female' },
    ],
    [t]
  );
  const activityOptions: PickerOption<ActivityLevel>[] = useMemo(
    () => [
      { label: t('profile.activitySedentary', 'Sedentary'), value: 'sedentary' },
      { label: t('profile.activityLight', 'Lightly Active'), value: 'light' },
      { label: t('profile.activityModerate', 'Moderately Active'), value: 'moderate' },
      { label: t('profile.activityVery', 'Very Active'), value: 'very' },
    ],
    [t]
  );

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.text }}>
          {t('common.loading', 'Loading...')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.modeToggle, { backgroundColor: colors.card, shadowColor: colors.shadow }]}> 
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === 'simple' && { backgroundColor: colors.primary }
            ]}
            onPress={() => onModeChange('simple')}
          >
            <Text
              style={[
                styles.modeText,
                mode === 'simple' && styles.modeTextActive,
              ]}
            >
              {t('profile.simpleMode', 'Simple')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === 'advanced' && { backgroundColor: colors.primary }
            ]}
            onPress={() => onModeChange('advanced')}
          >
            <Text
              style={[
                styles.modeText,
                mode === 'advanced' && styles.modeTextActive,
              ]}
            >
              {t('profile.advancedMode', 'Advanced')}
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'simple' && (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}> 
            <Text style={[styles.label, { color: colors.text }]}> {t('profile.manualGoal', 'Manual Daily Goal (kcal):')} </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
              value={manualGoal}
              onChangeText={onManualGoal}
              placeholder={t('profile.goalPlaceholder', 'e.g. 2000')}
              placeholderTextColor={colors.text}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        )}

        {mode === 'advanced' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}> 
              <Text style={[styles.label, { color: colors.text }]}> {t('profile.age', 'Age:')} </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={age}
                onChangeText={(v) => {
                  const n = v.replace(/[^0-9]/g, '');
                  setAge(n);
                  saveData(AGE_KEY, n);
                }}
                placeholder={t('common.select', 'Select...')}
                placeholderTextColor={colors.text}
                keyboardType="numeric"
                maxLength={3}
              />

              <CustomPicker<Sex>
                label={t('profile.sex', 'Sex:')}
                options={sexOptions}
                selectedValue={sex}
                onValueChange={(v) => {
                  setSex(v);
                  saveData(SEX_KEY, v);
                }}
                placeholder={t('common.select', 'Select...')}
              />

              <Text style={[styles.label, { color: colors.text }]}> {t('profile.height', 'Height (cm):')} </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={height}
                onChangeText={(v) => {
                  const n = v.replace(/[^0-9]/g, '');
                  setHeight(n);
                  saveData(HEIGHT_KEY, n);
                }}
                placeholder={t('common.select', 'Select...')}
                placeholderTextColor={colors.text}
                keyboardType="numeric"
                maxLength={3}
              />

              <Text style={[styles.label, { color: colors.text }]}> {t('profile.weight', 'Weight (kg):')} </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={weight}
                onChangeText={(v) => {
                  const n = v.replace(/[^0-9.]/g, '');
                  setWeight(n);
                  saveData(WEIGHT_KEY, n);
                }}
                placeholder={t('common.select', 'Select...')}
                placeholderTextColor={colors.text}
                keyboardType="decimal-pad"
                maxLength={5}
              />

              <CustomPicker<ActivityLevel>
                label={t('profile.activityLevel', 'Activity Level:')}
                options={activityOptions}
                selectedValue={activityLevel}
                onValueChange={(v) => {
                  setActivityLevel(v);
                  saveData(ACTIVITY_LEVEL_KEY, v);
                }}
                placeholder={t('common.select', 'Select...')}
              />

              <ScrollableValuePicker
                label={t('profile.weightGoalNumerical', 'Weekly Weight Goal (kg):')}
                selectedValue={weightGoalValue}
                onValueChange={onWeightGoal}
                minValue={-2}
                maxValue={2}
                step={0.25}
                unit="kg/week"
              />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow, alignItems: 'center' }]}> 
              <Text style={[styles.label, { color: colors.text }]}> {t('profile.calculatedGoal', 'Calculated Goal:')} </Text>
              <Text style={[styles.calculatedValue, { color: colors.primary }]}> 
                {calculatedGoal != null
                  ? `${calculatedGoal} kcal`
                  : t('profile.incomplete', 'Enter details above')} 
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modeText: { fontSize: 16, fontWeight: '500', color: '#666' },
  modeTextActive: { color: '#fff' },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  input: {
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  calculatedValue: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
});
