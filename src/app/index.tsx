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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Entry } from 'types';
import { calculateCalories } from 'utils/calorieUtils';
import { addEntry, getEntriesForDay } from 'services/database';
import { useTheme } from '../context/themeContext';
import { commonStyles } from '../styles/commonStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kcalPer100g, setKcalPer100g] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [sugars, setSugars] = useState('');
  const [salt, setSalt] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const loadEntries = useCallback(async () => {
      setIsLoading(true);
      try {
          const todayEntries = await getEntriesForDay(new Date());
          setEntries(todayEntries);
      } catch (error) {
          console.error("Failed to load entries:", error);
          Alert.alert(t('error.title'), t('error.loadEntries'));
      } finally {
          setIsLoading(false);
      }
  }, [t]);

  useEffect(() => {
      loadEntries();
  }, [loadEntries]);

  const handleAddEntry = async () => {
      const amountNum = parseInt(amount, 10);
      const kcalNum = parseInt(kcalPer100g, 10);
      if (!name.trim() || isNaN(amountNum) || amountNum <= 0 || isNaN(kcalNum) || kcalNum < 0) {
          Alert.alert(t('error.invalidInputTitle'), t('error.invalidInputMsg'));
          return;
      }
      const parseOptional = (value: string): number => {
          const parsed = parseFloat(value.replace(',', '.'));
          return isNaN(parsed) || parsed < 0 ? 0 : parsed;
      };
      const proteinNum = parseOptional(protein);
      const carbsNum = parseOptional(carbs);
      const fatNum = parseOptional(fat);
      const saturatedFatNum = parseOptional(saturatedFat);
      const sugarsNum = parseOptional(sugars);
      const saltNum = parseOptional(salt);

      Keyboard.dismiss();
      try {
          await addEntry(name, amountNum, kcalNum, proteinNum, carbsNum, fatNum, saturatedFatNum, sugarsNum, saltNum);
          Alert.alert(t('common.success'), t('entry.addedSuccess'));
          setName(''); setAmount(''); setKcalPer100g('');
          setProtein(''); setCarbs(''); setFat('');
          setSaturatedFat(''); setSugars(''); setSalt('');
          setShowOptionalFields(false);
          await loadEntries();
      } catch (error) {
          console.error("Failed to add entry:", error);
          Alert.alert(t('error.title'), t('error.addEntry'));
      }
  };

  const toggleOptionalFields = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowOptionalFields(!showOptionalFields);
  };

  const totalCaloriesToday = useMemo(() => entries.reduce((sum, entry) => sum + calculateCalories(entry), 0), [entries]);

  const renderEntry = ({ item }: { item: Entry }) => (
    <View style={[commonStyles.entryItemContainer, commonStyles.cardLook, styles.entryItemSpecific, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <View style={commonStyles.entryRow}>
        <Text style={[commonStyles.entryName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[commonStyles.entryCalculatedKcal, { color: colors.kcalHighlight }]}>
           ~ {calculateCalories(item)} kcal
        </Text>
      </View>
      <View style={commonStyles.entryRow}>
        <Text style={[commonStyles.entryDetails, { color: colors.textSecondary }]}>
            {item.amount_in_g}g ({item.calories_per_100_g} kcal/100g)
        </Text>
        <Text style={[commonStyles.entryTimestamp, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {(item.protein_per_100_g > 0 || item.carbs_per_100_g > 0 || item.fat_per_100_g > 0) && (
        <View style={[commonStyles.macroRow, { borderColor: colors.border }]}>
            <Text style={[commonStyles.macroText, { color: colors.textSecondary }]}>
                P: {item.protein_per_100_g}g | C: {item.carbs_per_100_g}g | F: {item.fat_per_100_g}g
            </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formSectionContainer}>
        <Text style={[commonStyles.formTitle, { color: colors.text }]}>{t('entry.addTitle')}</Text>

        <View style={[commonStyles.cardLook, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <TextInput
            style={[ commonStyles.inputBase, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
            placeholder={t('entry.namePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
          <View style={commonStyles.row}>
            <TextInput
              style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
              placeholder={t('entry.amountPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              returnKeyType="next"
            />
            <TextInput
              style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
              placeholder={t('entry.kcalPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={kcalPer100g}
              onChangeText={setKcalPer100g}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          <TouchableOpacity
            style={[commonStyles.toggleButton, { borderColor: colors.border }]}
            onPress={toggleOptionalFields}
            activeOpacity={0.6}
          >
            <Text style={[commonStyles.toggleButtonText, { color: colors.primary }]}>
              {showOptionalFields ? t('entry.hideOptional') : t('entry.showOptional')}
            </Text>
          </TouchableOpacity>

          {showOptionalFields && (
            <View>
              <View style={commonStyles.row}>
                 <TextInput style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
                    placeholder={t('entry.fatPlaceholder')}
                    placeholderTextColor={colors.textSecondary} value={fat} onChangeText={setFat} keyboardType="numeric" returnKeyType="next" />
                 <TextInput style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
                    placeholder={t('entry.saturatedFatPlaceholder')}
                    placeholderTextColor={colors.textSecondary} value={saturatedFat} onChangeText={setSaturatedFat} keyboardType="numeric" returnKeyType="next" />
              </View>
               <View style={commonStyles.row}>
                 <TextInput style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
                    placeholder={t('entry.carbsPlaceholder')}
                    placeholderTextColor={colors.textSecondary} value={carbs} onChangeText={setCarbs} keyboardType="numeric" returnKeyType="next" />
                 <TextInput style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
                    placeholder={t('entry.sugarsPlaceholder')}
                    placeholderTextColor={colors.textSecondary} value={sugars} onChangeText={setSugars} keyboardType="numeric" returnKeyType="next" />
              </View>
               <View style={commonStyles.row}>
                 <TextInput style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
                    placeholder={t('entry.proteinPlaceholder')}
                    placeholderTextColor={colors.textSecondary} value={protein} onChangeText={setProtein} keyboardType="numeric" returnKeyType="next" />
                 <TextInput style={[ commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder } ]}
                    placeholder={t('entry.saltPlaceholder')}
                    placeholderTextColor={colors.textSecondary} value={salt} onChangeText={setSalt} keyboardType="numeric" returnKeyType="done" onSubmitEditing={handleAddEntry} />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[commonStyles.buttonBase, { backgroundColor: colors.primary }]}
            onPress={handleAddEntry}
            activeOpacity={0.7}
          >
            <Text style={commonStyles.buttonText}>{t('entry.addButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[commonStyles.cardLook, styles.totalContainer, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
         <Text style={[styles.totalLabel, { color: colors.text }]}>{t('entry.totalToday')}</Text>
         <Text style={[styles.totalValue, { color: colors.primary }]}>{totalCaloriesToday} kcal</Text>
       </View>

      <FlatList
        style={styles.list}
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<Text style={[commonStyles.listTitle, { color: colors.text }]}>{t('entry.todayTitle')}</Text>}
        ListEmptyComponent={
            isLoading ? (
              <View style={commonStyles.centerContent}><ActivityIndicator color={colors.primary} /></View>
            ) : (
              <View style={commonStyles.centerContent}><Text style={[commonStyles.emptyListText, { color: colors.textSecondary }]}>{t('entry.noEntries')}</Text></View>
            )
        }
        contentContainerStyle={commonStyles.listContentContainer}
      />

      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formSectionContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15,
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
  entryItemSpecific: {
    elevation: 1,
  }
});
