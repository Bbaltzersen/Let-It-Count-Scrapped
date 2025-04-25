import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  ListRenderItemInfo,
  AccessibilityInfo,
} from 'react-native';
// Adjust the import paths based on your project structure
import { useTheme } from 'context/themeContext'; // Example path
import Ionicons from '@expo/vector-icons/Ionicons'; // Ensure @expo/vector-icons is installed
import { useTranslation } from 'react-i18next'; // Ensure react-i18next is configured

// --- Constants ---
const ITEM_HEIGHT = 50; // Height of each item in the list
const DEFAULT_VISIBLE_ITEMS_ABOVE_BELOW = 3; // Number of items visible above and below the selected one
const FLOAT_PRECISION_THRESHOLD = 1e-9; // Threshold for comparing floating point numbers
const screenHeight = Dimensions.get('window').height; // Get screen height for modal sizing
const screenWidth = Dimensions.get('window').width; // Get screen width for responsive sizing
const DEBUG_MODE = __DEV__; // Only log in development mode

const HARDCODED_VALUES = [
  2.0,  1.75,  1.5,  1.25,  1.0,  0.75,  0.5,  0.25, 0.0,
 -0.25, -0.5, -0.75, -1.0, -1.25, -1.5, -1.75, -2.0,
];
// Note: Min/Max values remain numerically the same, but are derived from the new array order
const HARDCODED_MIN_VALUE = HARDCODED_VALUES[HARDCODED_VALUES.length - 1]; // Smallest value is now at the end
const HARDCODED_MAX_VALUE = HARDCODED_VALUES[0]; // Largest value is now at the beginning

// --- Utility Functions ---
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log('[ScrollablePicker]', ...args);
  }
};

// Helper for comparing floating point numbers reliably
const floatEquals = (a: number, b: number): boolean => {
  return Math.abs(a - b) < FLOAT_PRECISION_THRESHOLD;
};

// --- Types ---
interface ScrollableValuePickerProps {
  label?: string; // Optional label displayed above the picker trigger
  selectedValue: number; // The currently selected value (controlled component)
  onValueChange: (value: number) => void; // Callback when a value is confirmed
  minValue?: number; // Minimum value for clamping initial selectedValue (defaults to hardcoded min)
  maxValue?: number; // Maximum value for clamping initial selectedValue (defaults to hardcoded max)
  unit?: string; // Optional unit string to display next to the value (e.g., "kg")
  placeholder?: string; // Text to display in the trigger when selectedValue is NaN
  visibleItemsAboveBelow?: number; // How many items to show above/below the center in the modal (1-5)
  disabled?: boolean; // If true, the picker trigger is disabled
  decimals?: number; // Number of decimal places for formatting (if valueFormatter is not provided)
  testID?: string; // Test ID for automation/testing
  valueFormatter?: (value: number) => string; // Custom function to format the displayed value
  accessibilityLabel?: string; // Custom accessibility label for the trigger
  onModalOpen?: () => void; // Callback when the modal opens
  onModalClose?: () => void; // Callback when the modal closes
}

// Internal type for FlatList data items (includes padding)
interface ItemData {
  value: number; // The numeric value (NaN for padding)
  isPadding: boolean; // True if this is a padding item
  id: string; // Unique key for FlatList rendering
}

// --- ItemComponent (Memoized for Performance) ---
// Renders a single item (or padding) in the FlatList
const ItemComponent = React.memo(
  ({
    itemData,
    index,
    selectedIndex, // Index of the currently centered item in the 'data' array
    unit,
    colors,
    handlePress, // Callback function when the item is pressed
    decimals = 2,
    valueFormatter,
    testID,
  }: {
    itemData: ItemData;
    index: number;
    selectedIndex: number;
    unit: string;
    colors: ReturnType<typeof useTheme>['colors'];
    handlePress: (value: number, index: number) => void;
    decimals?: number;
    valueFormatter?: (value: number) => string;
    testID?: string;
  }) => {
    // Render an empty view for padding items
    if (itemData.isPadding) {
      return <View style={{ height: ITEM_HEIGHT }} />;
    }

    const value = itemData.value;
    const isSelected = index === selectedIndex; // Check if this item is the visually centered one
    const distance = Math.abs(index - selectedIndex); // Distance from the center for visual effects
    const opacity = Math.max(0.4, 1 - distance * 0.15); // Fade out items further from the center
    const scale = isSelected ? 1.1 : 1.0; // Slightly scale up the centered item

    // Format the value using the custom formatter or default toFixed
    const formattedValue = valueFormatter
      ? valueFormatter(value)
      : value.toFixed(decimals);

    // Apply different text colors based on value (example: positive/negative)
    let textColor = colors.text;
    if (value < 0) textColor = colors.danger; // Use danger color for negative values
    else if (value > 0) textColor = colors.primary; // Use primary color for positive values

    // Generate a unique testID for the item
    const itemTestID = testID
      ? `${testID}-item-${index}`
      : `picker-item-${index}`;

    return (
      <TouchableOpacity
        onPress={() => handlePress(value, index)} // Trigger the callback on press
        activeOpacity={0.7} // Standard touch feedback opacity
        style={styles.itemTouchArea} // Ensure the touchable area covers the full item height
        accessible={true} // Make it accessible
        accessibilityRole="button"
        // Provide clear accessibility label and hint based on selection state
        accessibilityLabel={`${formattedValue}${unit ? ` ${unit}` : ''}${isSelected ? ', selected' : ''}`}
        accessibilityHint={isSelected ? 'Tap again to confirm' : 'Tap to select'}
        accessibilityState={{ selected: isSelected }} // Indicate selection state to screen readers
        testID={itemTestID}
      >
        {/* Apply visual styles (opacity, scale) to the inner View */}
        <View style={[styles.itemContainer, { opacity, transform: [{ scale }] }] }>
          <Text
            style={[
              styles.itemText, // Base text style
              { color: textColor }, // Apply dynamic text color
              isSelected && styles.selectedItemText, // Apply specific style for the centered item
            ]}
            numberOfLines={1} // Prevent text wrapping
            ellipsizeMode="tail" // Add ellipsis if text is too long
          >
            {/* Display the formatted value and unit */}
            {formattedValue}
            {unit ? ` ${unit}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);
ItemComponent.displayName = 'ItemComponent'; // Set display name for debugging


// --- Main ScrollableValuePicker Component ---
export function ScrollableValuePicker({
  label,
  selectedValue,
  onValueChange,
  minValue = HARDCODED_MIN_VALUE, // Default min prop to hardcoded min
  maxValue = HARDCODED_MAX_VALUE, // Default max prop to hardcoded max
  unit = '',
  placeholder = 'Select...',
  visibleItemsAboveBelow = DEFAULT_VISIBLE_ITEMS_ABOVE_BELOW,
  disabled = false,
  decimals = 2,
  testID,
  valueFormatter,
  accessibilityLabel,
  onModalOpen,
  onModalClose,
}: ScrollableValuePickerProps) {

  // --- Hooks and State Initialization ---
  // Calculate effective min/max values (used for clamping initial prop value)
  const safeMinValue = useMemo(() => {
    if (isNaN(minValue)) {
      debugLog('Invalid minValue prop, using hardcoded minimum:', HARDCODED_MIN_VALUE);
      return HARDCODED_MIN_VALUE;
    }
    return minValue;
  }, [minValue]);

  const safeMaxValue = useMemo(() => {
    if (isNaN(maxValue)) {
      debugLog('Invalid maxValue prop, using hardcoded maximum:', HARDCODED_MAX_VALUE);
      return HARDCODED_MAX_VALUE;
    }
    if (maxValue < safeMinValue) {
       debugLog('maxValue prop cannot be less than minValue prop, using hardcoded maximum:', HARDCODED_MAX_VALUE);
       return HARDCODED_MAX_VALUE;
    }
    return maxValue;
  }, [maxValue, safeMinValue]);

  // Clamping function: Ensures a value is within the effective min/max bounds
  const clampValue = useCallback((value: number): number => {
    if (isNaN(value)) return safeMinValue; // Default to min if NaN
    return Math.max(safeMinValue, Math.min(value, safeMaxValue));
  }, [safeMinValue, safeMaxValue]);

  // Log initial props and effective values
  useEffect(() => {
    debugLog('Component initialized/updated with props:', {
      label,
      selectedValue,
      effectiveMinValue: safeMinValue,
      effectiveMaxValue: safeMaxValue,
      unit,
      placeholder,
      disabled,
    });
    // Warn if the provided selectedValue is outside the actual hardcoded range
    if (!isNaN(selectedValue) && (selectedValue < HARDCODED_MIN_VALUE || selectedValue > HARDCODED_MAX_VALUE)) {
        debugLog(`Warning: selectedValue (${selectedValue}) is outside the hardcoded range [${HARDCODED_MIN_VALUE}, ${HARDCODED_MAX_VALUE}]`);
    }
  }, [label, selectedValue, safeMinValue, safeMaxValue, unit, placeholder, disabled]);

  // Calculate FlatList dimensions based on visible items
  const validVisibleItems = Math.max(1, Math.min(5, visibleItemsAboveBelow)); // Clamp between 1 and 5
  const VISIBLE_ITEMS = validVisibleItems * 2 + 1; // Total visible slots (center + above/below)
  const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // Total height of the visible portion of the list

  // Theme and translation hooks
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Refs for FlatList and scroll timeout
  const flatListRef = useRef<FlatList<ItemData>>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // State variables
  const [modalVisible, setModalVisible] = useState(false); // Controls modal visibility
  // Stores the currently centered value in the modal picker (updated by scroll/tap)
  const [tempValue, setTempValue] = useState<number>(() => {
      const initialClamped = clampValue(selectedValue);
      // Initialize tempValue to the hardcoded value closest to the initial (clamped) selectedValue
      const closestHardcoded = HARDCODED_VALUES.reduce((prev, curr) =>
          Math.abs(curr - initialClamped) < Math.abs(prev - initialClamped) ? curr : prev
      );
      return closestHardcoded;
  });
  // Index of the currently centered item within the *padded* 'data' array
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // State to track if a screen reader is enabled (for conditional UI/behavior)
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // --- Effect for Screen Reader Detection ---
  useEffect(() => {
    let isMounted = true;
    const checkScreenReader = async () => {
      try {
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        if (isMounted) {
          setIsScreenReaderEnabled(screenReaderEnabled);
          debugLog('Screen reader enabled:', screenReaderEnabled);
        }
      } catch (error) {
        debugLog('Error checking screen reader status:', error);
      }
    };
    checkScreenReader();
    // Subscribe to changes in screen reader status
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setIsScreenReaderEnabled);
    // Cleanup listener and timeout on unmount
    return () => {
      isMounted = false;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // --- Data Preparation ---
  // Use the hardcoded value list directly
  const valueList = useMemo<number[]>(() => {
    debugLog(`Using hardcoded values: ${HARDCODED_VALUES.join(', ')}`);
    return HARDCODED_VALUES;
  }, []); // Empty dependency array as the list is constant

  // Function to create padding items for the FlatList
  const createPadding = useCallback(
    (idx: number): ItemData => ({
      value: NaN,
      isPadding: true,
      id: `padding-${idx}`,
    }),
    []
  );

  // Memoized data array for the FlatList, including padding at start and end
  const data = useMemo(() => {
    const padCount = validVisibleItems; // Number of padding items = visible items above/below
    const padStart = Array(padCount).fill(0).map((_, i) => createPadding(i));
    const padEnd = Array(padCount).fill(0).map((_, i) => createPadding(i + padCount));
    // Map hardcoded values to ItemData objects
    const items = valueList.map((v, i) => ({
      value: v,
      isPadding: false,
      id: `value-${i}-${v}`, // Ensure unique ID, including value
    }));
    // Combine padding and actual items
    return [...padStart, ...items, ...padEnd];
  }, [valueList, validVisibleItems, createPadding]);

  // Calculate indices and offsets based on padding
  const firstValueIndexInData = validVisibleItems; // Index of the first *actual* value in the 'data' array
  const lastValueIndexInData = firstValueIndexInData + valueList.length - 1; // Index of the last *actual* value
  const CENTER_OFFSET = (LIST_HEIGHT - ITEM_HEIGHT) / 2; // Vertical offset to center the highlight view

  // --- Utility Functions ---
  // Finds the index in the 'data' array for a given numeric value
  const getIndexForValue = useCallback(
    (v: number): number => {
        if (isNaN(v) || valueList.length === 0) return firstValueIndexInData; // Default to first value if input is invalid

        // Find the index in the *hardcoded* valueList that's closest to v
        let closestIndexInValueList = 0;
        let minDiff = Infinity;

        valueList.forEach((val, i) => {
            const diff = Math.abs(val - v);
            if (diff < minDiff) { // Found a closer value
                minDiff = diff;
                closestIndexInValueList = i;
            }
            // Prioritize exact match if found (within float precision)
            if (floatEquals(val, v)) {
                minDiff = 0;
                closestIndexInValueList = i;
                return; // Exit forEach early if exact match found
            }
        });

        // Calculate the corresponding index in the padded 'data' array
        const indexInData = closestIndexInValueList + firstValueIndexInData;
        debugLog(`Value ${v} mapped to index ${indexInData} in data array (value: ${valueList[closestIndexInValueList]})`);
        return indexInData;
    },
    [valueList, firstValueIndexInData] // Depends only on the hardcoded list and padding size
  );

  // --- Scroll Event Handlers ---
  // Called continuously during scrolling
  const handleScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!nativeEvent || typeof nativeEvent.contentOffset === 'undefined') return;

      const offsetY = nativeEvent.contentOffset?.y || 0;
      // Calculate the index closest to the center based on scroll offset
      const rawIdx = Math.round(offsetY / ITEM_HEIGHT);
      const currentCenterIndex = Math.max(firstValueIndexInData, Math.min(rawIdx, lastValueIndexInData));

      // Update visual selection and temporary value state if the centered item changes
      if (currentCenterIndex !== selectedIndex) {
        setSelectedIndex(currentCenterIndex); // Update visual center index

        // Update tempValue based on the newly centered item
        const valueIndexInList = currentCenterIndex - firstValueIndexInData;
        if (valueIndexInList >= 0 && valueIndexInList < valueList.length) {
          const newValue = valueList[valueIndexInList];
          // Check before setting state to avoid unnecessary re-renders if value hasn't changed
          if (!floatEquals(newValue, tempValue)) {
              setTempValue(newValue);
              debugLog(`Scroll updated tempValue to: ${newValue} at index ${currentCenterIndex}`);
          }
        }
      }
    },
    [firstValueIndexInData, lastValueIndexInData, selectedIndex, valueList, tempValue] // Dependencies
  );

  // Called when momentum scrolling finishes
  const handleMomentumScrollEnd = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!nativeEvent || typeof nativeEvent.contentOffset === 'undefined') return;

      const offsetY = nativeEvent.contentOffset?.y || 0;
      // Calculate the final centered index
      const rawIdx = Math.round(offsetY / ITEM_HEIGHT);
      const finalCenterIndex = Math.max(firstValueIndexInData, Math.min(rawIdx, lastValueIndexInData));

      // Ensure state reflects the final position
      setSelectedIndex(finalCenterIndex);
      const valueIndexInList = finalCenterIndex - firstValueIndexInData;
      if (valueIndexInList >= 0 && valueIndexInList < valueList.length) {
        const newValue = valueList[valueIndexInList];
        // Check before setting state
        if (!floatEquals(newValue, tempValue)) {
            setTempValue(newValue);
            debugLog(`Momentum scroll ended, final tempValue: ${newValue} at index ${finalCenterIndex}`);
        }
      }

      // Snap the list precisely to the center of the final item
      const targetOffset = finalCenterIndex * ITEM_HEIGHT;
      if (Math.abs(offsetY - targetOffset) > 1 && flatListRef.current) { // Check if snapping is needed
        flatListRef.current.scrollToOffset({ offset: targetOffset, animated: true });
      }
    },
    [firstValueIndexInData, lastValueIndexInData, valueList, tempValue] // Dependencies
  );

  // --- Modal and Interaction Handlers ---
  // Closes the modal and triggers the callback
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    if (onModalClose) {
      onModalClose(); // Call external callback if provided
    }
  }, [onModalClose]);

  // Handles tapping on an item in the list
  const handleItemPress = useCallback(
    (value: number, indexInData: number) => {
      if (isNaN(value)) return; // Ignore taps on padding items

      debugLog(`Item pressed: Value=${value}, Index=${indexInData}, CurrentSelectedIndex=${selectedIndex}`);

      if (indexInData === selectedIndex) {
        // Tapped the currently centered item: Confirm the value and close the modal
        debugLog(`Confirming value: ${tempValue}`); // Use the value stored in tempValue state
        onValueChange(tempValue); // Trigger the external callback with the confirmed value
        handleCloseModal();
      } else {
        // Tapped a different item: Scroll that item to the center
        debugLog(`Scrolling to index: ${indexInData}, Value: ${value}`);
        setSelectedIndex(indexInData); // Update the visual selection index
        setTempValue(value);        // Update the temporary value state to match the tapped item

        // Programmatically scroll the FlatList
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({
            offset: indexInData * ITEM_HEIGHT, // Calculate target offset
            animated: true, // Animate the scroll
          });
        }
      }
    },
    [selectedIndex, tempValue, onValueChange, handleCloseModal] // Dependencies
  );

  // Opens the modal
  const handleOpenModal = useCallback(() => {
    if (disabled) return; // Do nothing if disabled

    // Clear any pending scroll timeouts
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }

    try {
      // Determine the initial value to center based on the external selectedValue
      const initialClampedValue = clampValue(selectedValue);
      // Find the closest value *within the hardcoded list*
      const closestInitialValue = valueList.reduce((prev, curr) =>
          Math.abs(curr - initialClampedValue) < Math.abs(prev - initialClampedValue) ? curr : prev
      );
      // Get the index in the 'data' array for this closest value
      const initialIndexInData = getIndexForValue(closestInitialValue);

      debugLog(`Opening modal. Initial selectedValue=${selectedValue}, Clamped=${initialClampedValue}, Closest Hardcoded=${closestInitialValue}, Initial Index=${initialIndexInData}`);

      // Set initial state for the modal
      setTempValue(closestInitialValue); // Set temp state to the closest hardcoded value
      setSelectedIndex(initialIndexInData); // Set the visual index
      setModalVisible(true); // Show the modal

      if (onModalOpen) {
        onModalOpen(); // Call external callback
      }
    } catch (err) {
      debugLog('Error opening modal:', err);
    }
  }, [
    disabled,
    selectedValue,
    clampValue,
    valueList,
    getIndexForValue,
    onModalOpen
  ]);

  // --- Effect to Sync External Prop Changes ---
  // Updates internal state if the selectedValue prop changes while the modal is closed
  useEffect(() => {
    if (!modalVisible && !isNaN(selectedValue)) {
        const clampedExternalValue = clampValue(selectedValue);
        // Find the closest hardcoded value to the new external value
        const closestHardcoded = valueList.reduce((prev, curr) =>
            Math.abs(curr - clampedExternalValue) < Math.abs(prev - clampedExternalValue) ? curr : prev
        );

        // Only update if the closest hardcoded value differs from current tempValue
        if (!floatEquals(closestHardcoded, tempValue)) {
             debugLog(`External selectedValue changed to ${selectedValue}. Updating internal tempValue to closest hardcoded: ${closestHardcoded}`);
             setTempValue(closestHardcoded);
             // Update selectedIndex as well to keep it consistent for the next modal open
             setSelectedIndex(getIndexForValue(closestHardcoded));
        }
    }
  }, [selectedValue, clampValue, valueList, modalVisible, tempValue, getIndexForValue]);


  // --- Initial Scroll Logic for Modal ---
  // Scrolls the list to the initial selected index when the modal becomes visible
  const performInitialScroll = useCallback(() => {
    // Ensure FlatList ref is available and index is valid
    if (!flatListRef.current || selectedIndex < 0) {
        debugLog('Initial scroll skipped: Ref not ready or selectedIndex invalid', { hasRef: !!flatListRef.current, selectedIndex });
        return;
    }

    try {
        const offset = selectedIndex * ITEM_HEIGHT; // Calculate target offset
        debugLog(`Performing initial scroll to index ${selectedIndex}, offset ${offset}`);
        // Scroll immediately without animation
        flatListRef.current.scrollToOffset({ offset, animated: false });

        // HACK/Workaround: Sometimes immediate scroll doesn't work reliably, especially on Android.
        // Schedule another scroll after a short delay to ensure correct positioning.
        scrollTimeout.current = setTimeout(() => {
            if (flatListRef.current && modalVisible) { // Check ref and if modal is still visible
                 debugLog(`Re-checking scroll position after delay for index ${selectedIndex}`);
                 flatListRef.current?.scrollToOffset({ offset, animated: false });
            }
        }, 50); // 50ms delay, adjust if needed

    } catch (err) {
        debugLog('Error in initial scroll:', err);
    }
  }, [selectedIndex, modalVisible]); // Depend on selectedIndex and modal visibility


  // --- FlatList Configuration ---
  // Provides item layout info for optimization (avoids dynamic measurement)
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT, // Height of each item
      offset: ITEM_HEIGHT * index, // Offset from the top
      index // The item index
    }),
    [] // No dependencies, calculation is constant
  );

  // Extracts a unique key for each item
  const keyExtractor = useCallback((item: ItemData) => item.id, []);

  // Callback to render each item in the FlatList
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ItemData>) => (
      <ItemComponent
        itemData={item}
        index={index}
        selectedIndex={selectedIndex} // Pass current centered index for styling
        unit={unit}
        colors={colors}
        handlePress={handleItemPress} // Pass the interaction handler
        decimals={decimals}
        valueFormatter={valueFormatter}
        testID={testID}
      />
    ),
    // Dependencies for the renderItem callback
    [selectedIndex, unit, colors, handleItemPress, decimals, valueFormatter, testID]
  );

  // --- Display Value Formatting ---
  // Memoized calculation of the text displayed in the trigger button
  const displayValue = useMemo(() => {
    if (isNaN(selectedValue)) return placeholder; // Show placeholder if value is NaN

    // Find the value in the hardcoded list closest to the external selectedValue
    // This ensures the displayed value matches an actual option if possible
    const closestDisplayValue = valueList.reduce((prev, curr) =>
        Math.abs(curr - selectedValue) < Math.abs(prev - selectedValue) ? curr : prev
    );

    // Format the closest value
    const valueStr = valueFormatter
      ? valueFormatter(closestDisplayValue)
      : closestDisplayValue.toFixed(decimals);

    // Append unit if provided
    return `${valueStr}${unit ? ` ${unit}` : ''}`;
  }, [selectedValue, placeholder, valueFormatter, decimals, unit, valueList]); // Dependencies


  // --- Accessibility Props ---
  // Props for the main trigger button
  const triggerAccessibilityProps = {
    accessible: true,
    accessibilityRole: 'button' as const,
    // Construct a meaningful label
    accessibilityLabel: accessibilityLabel ||
      (label ? `${label}, ${displayValue}` : displayValue),
    accessibilityState: {
      disabled, // Indicate if disabled
    },
    // Hint for screen reader users
    accessibilityHint: t ? t('picker.openModalHint', 'Tap to open value selector') : 'Tap to open value selector',
  };

  // Props for the modal itself
  const modalAccessibilityProps = {
    accessible: true,
    accessibilityViewIsModal: true, // Indicate it's a modal view
    // Label for the modal container
    accessibilityLabel: t ? t('picker.modalTitle', 'Select a value') : 'Select a value',
  };

  // --- Component JSX ---
  return (
    <View style={styles.wrapper} testID={testID}>
      {/* Optional Label */}
      {label && (
        <Text
          style={[styles.label, { color: colors.text }]}
          accessibilityRole="header" // Semantically a header for the control
        >
          {label}
        </Text>
      )}

      {/* Trigger Button */}
      <TouchableOpacity
         style={[
           styles.trigger, // Base styles
           { // Theme-dependent styles
             backgroundColor: colors.card,
             shadowColor: colors.shadow,
             opacity: disabled ? 0.5 : 1 // Dim if disabled
           },
         ]}
         onPress={handleOpenModal} // Open modal on press
         activeOpacity={0.7}
         disabled={disabled} // Disable touchable if needed
         testID={testID ? `${testID}-trigger` : 'picker-trigger'}
         {...triggerAccessibilityProps} // Apply accessibility props
      >
        {/* Display Value Text */}
        <Text
          style={[
            styles.triggerText,
            // Use placeholder color if value is NaN, otherwise use text color
            { color: isNaN(selectedValue) ? colors.text || '#999' : colors.text }
          ]}
        >
          {displayValue}
        </Text>
        {/* Down Arrow Icon */}
        <Ionicons
          name="chevron-down-outline"
          size={24}
          color={colors.icon}
          accessibilityElementsHidden={true} // Hide decorative icon from screen readers
          importantForAccessibility="no"
        />
      </TouchableOpacity>

      {/* Picker Modal */}
      <Modal
        transparent // Overlay effect
        animationType="fade" // Simple fade animation
        visible={modalVisible} // Controlled by state
        onRequestClose={handleCloseModal} // Handle hardware back button (Android) / swipe gesture (iOS)
        onShow={performInitialScroll} // Scroll to initial position when modal appears
        supportedOrientations={['portrait', 'landscape']} // Allow rotation
        {...modalAccessibilityProps} // Apply accessibility props
      >
        {/* Overlay Pressable (closes modal on tap outside) */}
        <Pressable
          style={styles.overlay}
          onPress={handleCloseModal}
          accessibilityRole="button"
          accessibilityLabel={t ? t('picker.closeModal', 'Close selector') : 'Close selector'}
          testID={testID ? `${testID}-overlay` : 'picker-overlay'}
        >
          {/* Content Wrapper Pressable (prevents taps inside modal from closing it) */}
          <Pressable
            style={[
              styles.modalContentWrapper,
              { // Responsive sizing
                maxHeight: screenHeight * 0.6, // Limit height
                width: Platform.OS === 'web' ? 320 : Math.min(screenWidth * 0.9, 320) // Limit width
              },
            ]}
            onPress={(e) => e.stopPropagation()} // Stop tap propagation
            testID={testID ? `${testID}-modal-content` : 'picker-modal-content'}
          >
            {/* Modal Card View */}
            <View
              style={[
                styles.modal,
                { backgroundColor: colors.card, shadowColor: colors.shadow },
              ]}
            >
              {/* Optional Header with Close Button (shown only if screen reader is enabled) */}
              {isScreenReaderEnabled && (
                 <View style={styles.modalHeader}>
                   <TouchableOpacity
                     onPress={handleCloseModal}
                     accessibilityRole="button"
                     accessibilityLabel={t ? t('picker.close', 'Close') : 'Close'}
                     style={styles.closeButton}
                     testID={testID ? `${testID}-close-button` : 'picker-close-button'}
                   >
                     <Ionicons name="close" size={24} color={colors.icon} />
                   </TouchableOpacity>
                 </View>
               )}

              {/* List Container */}
              <View style={styles.listContainer}>
                {/* Center Highlight View */}
                <View
                  style={[
                    styles.highlight,
                    { // Position and style the highlight
                      backgroundColor: colors.primary + '20', // Semi-transparent primary color
                      top: CENTER_OFFSET, // Center vertically
                      height: ITEM_HEIGHT, // Match item height
                      borderColor: colors.primary + '40', // Slightly darker border
                    },
                  ]}
                  pointerEvents="none" // Make it non-interactive
                  accessibilityElementsHidden={true} // Hide from screen readers
                  importantForAccessibility="no"
                />
                {/* The Scrollable List */}
                <FlatList
                    ref={flatListRef} // Assign ref
                    data={data} // Provide padded data
                    renderItem={renderItem} // Use the memoized render function
                    keyExtractor={keyExtractor} // Use the key extractor
                    getItemLayout={getItemLayout} // Provide layout info for performance
                    contentContainerStyle={{
                        paddingVertical: CENTER_OFFSET, // Add padding to center the first/last items
                    }}
                    // Snapping configuration
                    snapToInterval={ITEM_HEIGHT} // Snap to item height boundaries
                    snapToAlignment="start" // Align snapped items to the top of the interval (effectively centers them due to padding)
                    decelerationRate="fast" // Faster deceleration for snappier feel
                    showsVerticalScrollIndicator={false} // Hide scrollbar
                    style={{ height: LIST_HEIGHT }} // Set fixed height for the list viewport

                    // --- Performance Props Modified for Pre-rendering ---
                    initialNumToRender={data.length} // Render all items initially
                    maxToRenderPerBatch={data.length} // Keep batch size large (less relevant when initialNumToRender is full length)
                    windowSize={data.length} // Keep all items mounted in the render window
                    removeClippedSubviews={false} // Disable view removal on Android (consider performance for very long lists)
                    // --- End of Modified Props ---

                    // Android fading edge effect
                    fadingEdgeLength={
                        Platform.OS === 'android' ? LIST_HEIGHT / 2 : undefined
                    }
                    // Assign scroll event handlers
                    onScroll={handleScroll}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    testID={testID ? `${testID}-list` : 'picker-list'}
                />
              </View>
              {/* Footer with confirm button is intentionally removed */}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// --- Styles ---
// Define styles using StyleSheet.create
const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 16, // Add some vertical spacing around the component
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
    opacity: 0.8, // Slightly muted label text
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14, // Platform-specific padding
    // Shadow for elevation effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android elevation
    borderRadius: 8, // Rounded corners
    // Subtle border for Android consistency
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    flex: 1, // Take up full screen
    backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent black background
    justifyContent: 'center', // Center modal vertically
    alignItems: 'center', // Center modal horizontally
    padding: 20, // Add padding around the modal content
  },
  modalContentWrapper: {
    // Wrapper around the modal card for sizing and overflow
    borderRadius: 12, // Match modal border radius
    overflow: 'hidden', // Clip content within rounded corners
  },
  modal: {
    // The main modal card appearance
    borderRadius: 12,
    backgroundColor: 'white', // Default background (overridden by theme)
    // Shadow for modal elevation
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6, // Android elevation
    paddingTop: 12, // Add padding at the top inside the modal card
    overflow: 'hidden', // Ensure content respects border radius
  },
  modalHeader: {
    // Header container (only shown for screen readers)
    flexDirection: 'row',
    justifyContent: 'flex-end', // Position close button to the right
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeButton: {
    // Touchable area for the close button
    padding: 4,
  },
  listContainer: {
    position: 'relative', // Needed for absolute positioning of the highlight view
    overflow: 'hidden', // Clip the list items
    borderRadius: 4, // Slight rounding for the list area itself
    marginHorizontal: 8, // Add horizontal margin around the list
  },
  highlight: {
    // The visual highlight bar in the center
    position: 'absolute', // Position over the list
    left: 0,
    right: 0,
    zIndex: 1, // Ensure it's above the list items but below touch events
    borderRadius: 6, // Rounded corners for the highlight
    borderWidth: 1.5, // Border for definition
    pointerEvents: 'none', // Allow touches to pass through to the list items
  },
  itemTouchArea: {
    // Ensure the touchable area covers the full height
    height: ITEM_HEIGHT,
    justifyContent: 'center',
  },
  itemContainer: {
    // Container for the text within each item slot
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8, // Horizontal padding for text
  },
  itemText: {
    // Base style for item text
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '400',
  },
  selectedItemText: {
    // Style applied to the text of the centered/selected item
    fontSize: 18, // Slightly larger font size
    fontWeight: '600', // Bolder font weight
  },
  // modalFooter, confirmButton, confirmButtonText styles are no longer used
});