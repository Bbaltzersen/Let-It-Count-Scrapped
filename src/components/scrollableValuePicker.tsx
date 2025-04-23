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
} from 'react-native';
import { useTheme } from 'context/themeContext'; // adjust path if needed
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

// --- Constants ---
const ITEM_HEIGHT = 50; // Height of each item in the list
const DEFAULT_VISIBLE_ITEMS_ABOVE_BELOW = 3; // Number of items visible above and below the selected one
const FLOAT_PRECISION_THRESHOLD = 1e-9; // Threshold for comparing floating point numbers
const screenHeight = Dimensions.get('window').height; // Get screen height for modal sizing
const DEBUG_PREFIX = '[Picker Debug]'; // Prefix for easy filtering of console logs

// --- Types ---
interface ScrollableValuePickerProps {
  label?: string;
  selectedValue: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  visibleItemsAboveBelow?: number;
}

interface ItemData {
  value: number;
  isPadding: boolean;
  id: string;
}

// --- ItemComponent ---
const ItemComponent = React.memo(
  ({
    itemData,
    index,
    selectedIndex,
    unit,
    colors,
    handlePress,
  }: {
    itemData: ItemData;
    index: number;
    selectedIndex: number;
    unit: string;
    colors: ReturnType<typeof useTheme>['colors'];
    handlePress: (value: number, index: number) => void;
  }) => {
    if (itemData.isPadding) return <View style={{ height: ITEM_HEIGHT }} />;

    const value = itemData.value;
    const isSelected = index === selectedIndex;
    const distance = Math.abs(index - selectedIndex);
    const opacity = Math.max(0.4, 1 - distance * 0.15);
    const scale = isSelected ? 1.1 : 1.0;

    return (
      <TouchableOpacity
        onPress={() => handlePress(value, index)}
        activeOpacity={0.7}
        style={styles.itemTouchArea}
      >
        <View style={[styles.itemContainer, { opacity, transform: [{ scale }] }]}>
          <Text
            style={[
              styles.itemText,
              {
                color:
                  value < 0
                    ? colors.danger
                    : value > 0
                    ? colors.primary
                    : colors.text,
              },
              isSelected && styles.selectedItemText,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value.toFixed(2)}
            {unit ? ` ${unit}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);
ItemComponent.displayName = 'ItemComponent';

// --- Main Component ---
export function ScrollableValuePicker({
  label,
  selectedValue,
  onValueChange,
  minValue = -2.0,
  maxValue = 2.0,
  step = 0.25,
  unit = '',
  placeholder = 'Select...',
  visibleItemsAboveBelow = DEFAULT_VISIBLE_ITEMS_ABOVE_BELOW,
}: ScrollableValuePickerProps) {
  useEffect(() => {
    console.log(`${DEBUG_PREFIX} Props Received:`, {
      label,
      selectedValue,
      minValue,
      maxValue,
      step,
      unit,
      placeholder,
    });
  }, [label, selectedValue, minValue, maxValue, step, unit, placeholder]);

  const validVisibleItems = Math.max(1, Math.min(5, visibleItemsAboveBelow));
  const VISIBLE_ITEMS = validVisibleItems * 2 + 1;
  const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

  const { colors } = useTheme();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList<ItemData>>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(() =>
    isNaN(selectedValue) ? minValue : selectedValue
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    console.log(`${DEBUG_PREFIX} State Update: selectedIndex changed to:`, selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    console.log(`${DEBUG_PREFIX} State Update: tempValue changed to:`, tempValue);
  }, [tempValue]);

  const valueList = useMemo(() => {
    const arr: number[] = [];
    const steps = Math.round((maxValue - minValue) / step);
    for (let i = 0; i <= steps; i++) {
      const v = minValue + i * step;
      const rounded = parseFloat((Math.round(v / step) * step).toFixed(4));
      if (rounded <= maxValue + FLOAT_PRECISION_THRESHOLD) {
        arr.push(rounded);
      }
    }
    if (
      arr.length === 0 ||
      (Math.abs(arr[arr.length - 1] - maxValue) > FLOAT_PRECISION_THRESHOLD &&
        arr[arr.length - 1] < maxValue)
    ) {
      arr.push(parseFloat(maxValue.toFixed(4)));
    }
    console.log(
      `${DEBUG_PREFIX} Calculation: valueList generated. Length:`,
      arr.length,
      arr.length > 0 ? `First: ${arr[0]}, Last: ${arr[arr.length - 1]}` : '(empty)'
    );
    return arr;
  }, [minValue, maxValue, step]);

  const createPadding = useCallback(
    (idx: number): ItemData => ({
      value: NaN,
      isPadding: true,
      id: `padding-${idx}`,
    }),
    []
  );

  const data = useMemo(() => {
    const padStart = Array(validVisibleItems)
      .fill(0)
      .map((_, i) => createPadding(i));
    const padEnd = Array(validVisibleItems)
      .fill(0)
      .map((_, i) => createPadding(i + validVisibleItems));

    const items: ItemData[] = valueList.map((v, i) => ({
      value: v,
      isPadding: false,
      id: `value-${i}-${v}`,
    }));

    const fullData = [...padStart, ...items, ...padEnd];
    console.log(
      `${DEBUG_PREFIX} Calculation: Full data array generated (with padding). Length:`,
      fullData.length
    );
    return fullData;
  }, [valueList, validVisibleItems, createPadding]);

  const firstIndex = validVisibleItems;
  const lastIndex = firstIndex + valueList.length - 1;

  const CENTER_OFFSET = (LIST_HEIGHT - ITEM_HEIGHT) / 2;

  const getIndexForValue = useCallback(
    (v: number) => {
      if (isNaN(v) || valueList.length === 0) {
        return firstIndex;
      }
      let closest = 0;
      let minD = Infinity;
      for (let i = 0; i < valueList.length; i++) {
        const d = Math.abs(valueList[i] - v);
        if (d < minD) {
          minD = d;
          closest = i;
        }
        if (d < FLOAT_PRECISION_THRESHOLD) break;
      }
      return closest + validVisibleItems;
    },
    [valueList, firstIndex, validVisibleItems]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(firstIndex, Math.min(index, lastIndex));
      if (selectedIndex !== clampedIndex) {
        setSelectedIndex(clampedIndex);
        const valueIndex = clampedIndex - validVisibleItems;
        if (valueIndex >= 0 && valueIndex < valueList.length) {
          setTempValue(valueList[valueIndex]);
        }
      }
    },
    [firstIndex, lastIndex, validVisibleItems, valueList, selectedIndex]
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(firstIndex, Math.min(index, lastIndex));

      if (selectedIndex !== clampedIndex) {
        setSelectedIndex(clampedIndex);
        const valueIndex = clampedIndex - validVisibleItems;
        if (valueIndex >= 0 && valueIndex < valueList.length) {
          setTempValue(valueList[valueIndex]);
        }
      }

      const targetOffset = clampedIndex * ITEM_HEIGHT;
      if (Math.abs(offsetY - targetOffset) > 1) {
        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
      }
    },
    [firstIndex, lastIndex, validVisibleItems, valueList, selectedIndex]
  );

  useEffect(() => {
    if (modalVisible) {
      console.log(`${DEBUG_PREFIX} Modal Opening: useEffect to set initial state triggered.`);
      const startValue = isNaN(selectedValue) ? minValue : selectedValue;
      const initialIndex = getIndexForValue(startValue);
      console.log(`${DEBUG_PREFIX} Modal Opening: Setting initial state:`, { startValue, initialIndex });
      setTempValue(startValue);
      setSelectedIndex(initialIndex);
    }
  }, [modalVisible, selectedValue, minValue, getIndexForValue]);

  const performInitialScroll = useCallback(() => {
    console.log(`${DEBUG_PREFIX} Modal onShow: Fired. Attempting initial scroll.`);
    const indexToScroll = selectedIndex;
    const offset = indexToScroll * ITEM_HEIGHT;
    console.log(`${DEBUG_PREFIX} Scroll Attempt Details:`, {
      hasRef: !!flatListRef.current,
      indexToScroll,
      offset,
      dataLength: data.length,
    });
    if (
      flatListRef.current &&
      indexToScroll >= 0 &&
      indexToScroll < data.length
    ) {
      try {
        flatListRef.current.scrollToOffset({
          offset,
          animated: false,
        });
        console.log(`${DEBUG_PREFIX} Scroll Success: scrollToOffset called for index ${indexToScroll}, offset ${offset}`);
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Scroll Error: scrollToOffset threw an error.`, error);
      }
    } else {
      console.warn(`${DEBUG_PREFIX} Scroll Skipped: Conditions not met (ref=${!!flatListRef.current}, index=${indexToScroll}, dataLength=${data.length})`);
    }
  }, [selectedIndex, data]);

  const handlePress = useCallback(
    (v: number, idx: number) => {
      if (isNaN(v)) return;

      // If tapping the centered item, confirm & close:
      if (idx === selectedIndex) {
        onValueChange(v);
        setModalVisible(false);
        return;
      }

      // Otherwise recenter it
      setSelectedIndex(idx);
      setTempValue(v);
      flatListRef.current?.scrollToOffset({
        offset: idx * ITEM_HEIGHT,
        animated: true,
      });
    },
    [selectedIndex, onValueChange]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );
  const keyExtractor = useCallback((item: ItemData) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ItemData>) => (
      <ItemComponent
        itemData={item}
        index={index}
        selectedIndex={selectedIndex}
        unit={unit}
        colors={colors}
        handlePress={handlePress}
      />
    ),
    [selectedIndex, unit, colors, handlePress]
  );

  const displayValue = isNaN(selectedValue)
    ? placeholder
    : `${selectedValue.toFixed(2)}${unit ? ` ${unit}` : ''}`;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.trigger,
          { backgroundColor: colors.card, shadowColor: colors.shadow },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: colors.text }]}>
          {displayValue}
        </Text>
        <Ionicons name="chevron-down-outline" size={24} color={colors.icon} />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        onShow={performInitialScroll}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.modalContentWrapper,
              { maxHeight: screenHeight * 0.6 },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.modal,
                { backgroundColor: colors.card, shadowColor: colors.shadow },
              ]}
            >
              <View style={styles.listContainer}>
                <View
                  style={[
                    styles.highlight,
                    {
                      backgroundColor: colors.primary + '20',
                      top: CENTER_OFFSET,
                      height: ITEM_HEIGHT,
                      borderColor: colors.primary + '40',
                    },
                  ]}
                  pointerEvents="none"
                />
                <FlatList
                  ref={flatListRef}
                  data={data}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  getItemLayout={getItemLayout}
                  contentContainerStyle={{
                    paddingVertical: CENTER_OFFSET,
                  }}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                  style={{ height: LIST_HEIGHT }}
                  removeClippedSubviews={Platform.OS === 'android'}
                  initialNumToRender={VISIBLE_ITEMS + 4}
                  maxToRenderPerBatch={VISIBLE_ITEMS}
                  windowSize={Math.ceil(VISIBLE_ITEMS * 1.5)}
                  fadingEdgeLength={
                    Platform.OS === 'android' ? LIST_HEIGHT / 2 : undefined
                  }
                  onScroll={handleScroll}
                  onMomentumScrollEnd={handleMomentumScrollEnd}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
    opacity: 0.8,
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 8,
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentWrapper: {
    width: '90%',
    maxWidth: 320,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modal: {
    borderRadius: 12,
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    paddingTop: 12,
    overflow: 'hidden',
  },
  listContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    pointerEvents: 'none',
  },
  itemTouchArea: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  itemText: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '400',
  },
  selectedItemText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
