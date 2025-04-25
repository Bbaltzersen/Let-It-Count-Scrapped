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
import { useFocusEffect } from 'expo-router'; // Import useFocusEffect
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { Entry } from 'types'; // Ensure this path is correct
import { calculateCalories } from 'utils/calorieUtils'; // Ensure this path is correct
import { addEntry, getEntriesForDay } from 'services/database'; // Ensure this path is correct
import { useTheme } from '../context/themeContext'; // Ensure this path is correct
import { commonStyles } from '../styles/commonStyles'; // Ensure this path is correct
import CameraModal from '@/components/cameraModal'; // Import the CameraModal

import Icon from 'react-native-vector-icons/Ionicons';

// Constants for keys (ensure these match profile screen)
const ACTIVE_GOAL_TYPE_KEY = 'profileActiveGoalType';
const MANUAL_GOAL_KEY = 'profileManualGoal';
const CALCULATED_GOAL_KEY = 'profileCalculatedGoal';
const DEFAULT_GOAL = 2000; // Default goal

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Helper function to determine the color based on progress
const getGoalProgressColor = (current: number, target: number, colors: any): string => {
    if (target <= 0) return colors.text; // Avoid division by zero or invalid target

    const percentage = (current / target) * 100;

    // Define color thresholds (adjust as needed)
    const underThreshold = 90; // Below 90% = Green (or primary)
    const overThreshold = 110; // Above 110% = Red (Danger)
                                // Between 90% and 110% = Yellow/Orange (Warning)

    // Define fallback colors if theme doesn't provide them
    const successColor = colors.success || '#4CAF50'; // Green
    const warningColor = colors.warning || '#FF9800'; // Orange
    const dangerColor = colors.danger || '#F44336';   // Red

    if (percentage < underThreshold) {
        return successColor;
    } else if (percentage <= overThreshold) {
        return warningColor;
    } else {
        return dangerColor;
    }
};


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
    const [isLoadingEntries, setIsLoadingEntries] = useState(true);
    const [isLoadingGoal, setIsLoadingGoal] = useState(true); // Separate loading for goal
    const [showOptionalFields, setShowOptionalFields] = useState(false);
    const [targetCalories, setTargetCalories] = useState<number>(DEFAULT_GOAL); // State for target goal
    const [isCameraModalVisible, setCameraModalVisible] = useState(false); // State for Camera Modal visibility

    const loadEntries = useCallback(async () => {
        setIsLoadingEntries(true);
        try {
            const todayEntries = await getEntriesForDay(new Date());
            setEntries(todayEntries);
        } catch (error) {
            console.error("Failed to load entries:", error);
            Alert.alert(t('error.title'), t('error.loadEntries'));
        } finally {
            setIsLoadingEntries(false);
        }
    }, [t]);

    // Load target goal when screen focuses
    useFocusEffect(
        useCallback(() => {
            const loadTargetGoal = async () => {
                setIsLoadingGoal(true);
                try {
                    const type = await AsyncStorage.getItem(ACTIVE_GOAL_TYPE_KEY);
                    let goalValue: string | null = null;
                    const currentGoalType = type === 'calculated' ? 'calculated' : 'simple';

                    if (currentGoalType === 'calculated') {
                        goalValue = await AsyncStorage.getItem(CALCULATED_GOAL_KEY);
                    } else {
                        goalValue = await AsyncStorage.getItem(MANUAL_GOAL_KEY);
                    }

                    let goalNum = DEFAULT_GOAL;
                    if (goalValue !== null) {
                        const parsedGoal = parseInt(goalValue, 10);
                        if (!isNaN(parsedGoal) && parsedGoal > 0) {
                            goalNum = parsedGoal;
                        }
                    }
                    setTargetCalories(goalNum);

                } catch (e) {
                    console.error("Failed to load target goal", e);
                    setTargetCalories(DEFAULT_GOAL); // Fallback on error
                } finally {
                    setIsLoadingGoal(false);
                }
            };

            loadTargetGoal();
            loadEntries(); // Also load entries on focus
        }, [loadEntries]) // Include loadEntries dependency
    );


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
            await loadEntries(); // Reload entries after adding
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

    // Calculate the dynamic color for the total value
    const totalValueColor = useMemo(() => {
        if (isLoadingGoal) return colors.textSecondary; // Use a neutral color while loading goal
        return getGoalProgressColor(totalCaloriesToday, targetCalories, colors);
    }, [totalCaloriesToday, targetCalories, colors, isLoadingGoal]);

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

    // --- Camera Modal Handlers ---
    const handleCameraPress = () => {
        console.log('Opening Camera Modal...');
        setCameraModalVisible(true); // Open the modal
    };

    const handleCloseCamera = () => {
        console.log('Closing Camera Modal...');
        setCameraModalVisible(false); // Close the modal
    };

    const handleTextScanned = (scannedText: string) => {
        console.log("Scanned Text Received in HomeScreen:", scannedText);
        setCameraModalVisible(false); // Close the modal after scanning

        // ** TODO: Implement Robust Text Parsing Logic Here **
        // This is where you'd analyze 'scannedText' to extract nutritional info
        // (e.g., using regex or a more sophisticated parsing library).
        // For now, we'll just show an alert.
        Alert.alert(
            t('camera.scanCompleteTitle', 'Scan Complete'),
            t('camera.scanCompleteMessage', 'Text scanned successfully! You can now implement logic to parse it and fill the fields.') + `\n\nDetected:\n${scannedText.substring(0, 100)}...` // Show first 100 chars
        );

        // Example of potential parsing (requires a parsing function):
        /*
        try {
            const nutritionData = parseNutritionLabel(scannedText); // You need to create this function
            if (nutritionData.name) setName(nutritionData.name);
            if (nutritionData.kcalPer100g) setKcalPer100g(String(nutritionData.kcalPer100g));
            if (nutritionData.protein) setProtein(String(nutritionData.protein));
            if (nutritionData.carbs) setCarbs(String(nutritionData.carbs));
            if (nutritionData.fat) setFat(String(nutritionData.fat));
            // ... set other fields if available
            if (Object.keys(nutritionData).length > 2) { // If more than name/kcal found
                 setShowOptionalFields(true); // Show optional fields if data was found
            }
        } catch (error) {
            console.error("Error parsing scanned text:", error);
            Alert.alert(t('error.title'), t('camera.parseError', 'Could not automatically parse nutrition information. Please enter manually.'));
        }
        */
    };
    // --- End Camera Modal Handlers ---


    return (
        <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]}>
            <View style={styles.formSectionContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('entry.addTitle')}</Text>
                    {/* Updated TouchableOpacity to open the modal */}
                    <TouchableOpacity onPress={handleCameraPress} style={styles.cameraButton}>
                        <Icon name="camera-outline" size={28} color={colors.primary || '#007AFF'} />
                    </TouchableOpacity>
                </View>

                <View style={[commonStyles.cardLook, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
                    <TextInput
                        style={[commonStyles.inputBase, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                        placeholder={t('entry.namePlaceholder')}
                        placeholderTextColor={colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                        returnKeyType="next"
                    />
                    <View style={commonStyles.row}>
                        <TextInput
                            style={[commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                            placeholder={t('entry.amountPlaceholder')}
                            placeholderTextColor={colors.textSecondary}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            returnKeyType="next"
                        />
                        <TextInput
                            style={[commonStyles.inputBase, commonStyles.inputSmall, { color: colors.inputText, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
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
                {/* Apply the dynamic color */}
                <Text style={[styles.totalValue, { color: totalValueColor }]}>
                    {totalCaloriesToday} kcal
                </Text>
            </View>

            <FlatList
                style={styles.list}
                data={entries}
                renderItem={renderEntry}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={<Text style={[commonStyles.listTitle, { color: colors.text }]}>{t('entry.todayTitle')}</Text>}
                ListEmptyComponent={
                    isLoadingEntries ? ( // Check entries loading state
                        <View style={commonStyles.centerContent}><ActivityIndicator color={colors.primary} /></View>
                    ) : (
                        <View style={commonStyles.centerContent}><Text style={[commonStyles.emptyListText, { color: colors.textSecondary }]}>{t('entry.noEntries')}</Text></View>
                    )
                }
                contentContainerStyle={commonStyles.listContentContainer}
            />

            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            {/* --- Render the CameraModal --- */}
            {/* It's placed here so it renders on top of other content */}
            <CameraModal
                visible={isCameraModalVisible}
                onClose={handleCloseCamera}
                onTextScanned={handleTextScanned}
            />
            {/* --- End Render the CameraModal --- */}
        </SafeAreaView>
    );
}

// Styles remain the same as provided in the original code
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
        // Apply cardLook padding here if needed, or ensure cardLook handles it
        paddingHorizontal: 15,
        paddingVertical: 10,
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
        elevation: 1, // Keep specific elevation if needed
        marginBottom: 10, // Ensure spacing between items
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        // Removed marginVertical and added paddingHorizontal to match cardLook
        paddingHorizontal: 15,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        // Add padding to align with cardLook elements visually
        paddingHorizontal: 15,
    },
    cameraButton: {
        padding: 5, // Makes the touch target slightly larger
    }
});