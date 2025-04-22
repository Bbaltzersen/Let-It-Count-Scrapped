import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  SafeAreaView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useTheme } from 'context/themeContext'; // Adjust path as needed
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

interface ScrollableValuePickerProps {
  label?: string;
  selectedValue: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

const ITEM_HEIGHT = 45;
const VISIBLE_ITEMS = 5;
const screenHeight = Dimensions.get('window').height;

export function ScrollableValuePicker({
  label,
  selectedValue,
  onValueChange,
  minValue = -2.0,
  maxValue = 2.0,
  step = 0.25,
  unit = '',
  placeholder = 'Select...',
}: ScrollableValuePickerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList<number>>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(selectedValue);

  // number of padding items
  const paddingCount = useMemo(() => Math.floor(VISIBLE_ITEMS / 2), []);

  // build data with NaN padding
  const data = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < paddingCount; i++) arr.push(NaN);
    for (let v = minValue; v <= maxValue + 1e-9; v += step) {
      arr.push(parseFloat(v.toFixed(2)));
    }
    for (let i = 0; i < paddingCount; i++) arr.push(NaN);
    return arr;
  }, [minValue, maxValue, step, paddingCount]);

  // find first and last real indices
  const firstIndex = useMemo(() => data.findIndex(v => !isNaN(v)), [data]);
  const lastIndex = useMemo(() => {
    const rev = data.slice().reverse();
    const ri = rev.findIndex(v => !isNaN(v));
    return ri >= 0 ? data.length - 1 - ri : data.length - paddingCount - 1;
  }, [data, paddingCount]);

  // index of selectedValue
  const selectedIndex = useMemo(() => {
    const idx = data.findIndex(v => v === selectedValue);
    return idx >= 0 ? idx : firstIndex;
  }, [data, selectedValue, firstIndex]);

  // scroll to current on open
  useEffect(() => {
    if (modalVisible && flatListRef.current) {
      setTempValue(selectedValue);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: false,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [modalVisible, selectedIndex, selectedValue]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    []
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const raw = Math.round(y / ITEM_HEIGHT) + paddingCount;
      const idx = Math.min(Math.max(raw, firstIndex), lastIndex);
      const val = data[idx];
      if (!isNaN(val)) {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
        setTempValue(val);
      }
    },
    [data, paddingCount, firstIndex, lastIndex]
  );

  const confirm = useCallback(() => {
    if (tempValue !== selectedValue) onValueChange(tempValue);
    setModalVisible(false);
  }, [tempValue, selectedValue, onValueChange]);

  const display = useMemo(() => {
    return !isNaN(selectedValue) ? `${selectedValue.toFixed(2)} ${unit}` : placeholder;
  }, [selectedValue, unit, placeholder]);

  const renderItem = useCallback(
    ({ item }: { item: number }) => {
      if (isNaN(item)) return <View style={{ height: ITEM_HEIGHT }} />;
      return (
        <View style={[styles.itemContainer, { height: ITEM_HEIGHT }]}> 
          <Text style={[
            styles.itemText,
            { color: item < 0 ? colors.danger : (item > 0 ? colors.primary : colors.text) }
          ]}>
            {item.toFixed(2)} {unit}
          </Text>
        </View>
      );
    }, [colors, unit]
  );

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
        onPress={() => setModalVisible(true)} activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: colors.inputText }]}>{display}</Text>
        <Ionicons name="chevron-down-outline" size={20} color={colors.icon} />
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <SafeAreaView>
            <Pressable style={[styles.modal, { maxHeight: screenHeight * 0.6 }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.highlight, { top: paddingCount * ITEM_HEIGHT }]} />
              <FlatList
                ref={flatListRef}
                data={data}
                keyExtractor={(_, i) => i.toString()}
                renderItem={renderItem}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                getItemLayout={getItemLayout}
                onMomentumScrollEnd={onScrollEnd}
                style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
                contentContainerStyle={{ paddingTop: ITEM_HEIGHT * paddingCount, paddingBottom: ITEM_HEIGHT * paddingCount }}
              />
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={confirm}>
                <Text style={styles.confirmText}>{t('common.confirm', 'Confirm')}</Text>
              </TouchableOpacity>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 8 },
  label: { fontSize: 16, marginBottom: 6, fontWeight: '500' },
  trigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  triggerText: { fontSize: 16 },
  overlay: { flex: 1, backgroundColor: '#0006', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  highlight: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'steelblue', zIndex: 1 },
  itemContainer: { justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 20 },
  confirmBtn: { padding: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
