import React, { useState, useMemo } from 'react'; // Added useMemo
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView, // Use inside Modal for safe area
  Platform,
  Pressable, // For background dismiss
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; // For dropdown icon
import { useTheme } from 'context/themeContext'; // Import theme hook

// Define the shape of each option item
export interface PickerOption<T = string> {
  label: string; // Text to display (e.g., "🇬🇧 English")
  value: T;      // Actual value (e.g., "en")
}

// Define the props for the CustomPicker component
interface CustomPickerProps<T = string> {
  label: string; // Label displayed above the picker
  options: PickerOption<T>[]; // Array of options
  selectedValue: T; // The currently selected value
  onValueChange: (value: T) => void; // Function called when value changes
  placeholder?: string; // Optional placeholder if no value selected
}

export function CustomPicker<T extends string | number = string>({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select...', // Default placeholder
}: CustomPickerProps<T>) {
  const { colors } = useTheme(); // Get theme colors
  const [modalVisible, setModalVisible] = useState(false);

  // Find the label for the currently selected value
  const selectedLabel = useMemo(() => {
    const selectedOption = options.find(option => option.value === selectedValue);
    return selectedOption ? selectedOption.label : placeholder;
  }, [selectedValue, options, placeholder]);

  // Handle selecting an item from the modal list
  const handleSelect = (value: T) => {
    onValueChange(value); // Call the callback prop
    setModalVisible(false); // Close the modal
  };

  // Render each option item in the modal list
  const renderOption = ({ item }: { item: PickerOption<T> }) => (
    <TouchableOpacity
      style={[styles.optionItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
      {/* Optional: Add a checkmark for the selected item */}
      {item.value === selectedValue && (
        <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      {/* Trigger Button */}
      <TouchableOpacity
        style={[styles.triggerButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: colors.inputText }]}>{selectedLabel}</Text>
        <Ionicons name="chevron-down-outline" size={20} color={colors.icon} />
      </TouchableOpacity>

      {/* Modal for Options */}
      <Modal
        animationType="fade" // Or 'slide'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        {/* Background overlay to dismiss modal */}
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <SafeAreaView style={styles.safeAreaContainer}>
            {/* Prevent modal content click from closing */}
            <Pressable>
                {/* Apply modal content styles */}
                <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <FlatList
                    data={options}
                    renderItem={renderOption}
                    keyExtractor={(item) => String(item.value)} // Ensure key is string
                    style={styles.optionsList}
                  />
                </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 15, // Space below the picker component
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8, // Space between label and trigger
    // color applied dynamically
  },
  triggerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10, // Adjust padding
    minHeight: 42, // Ensure good touch target size
    // backgroundColor, borderColor applied dynamically
  },
  triggerText: {
    fontSize: 16,
    // color applied dynamically
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  safeAreaContainer: {
      width: '100%',
      alignItems: 'center',
  },
  modalContent: {
    // --- Increased Size ---
    width: '150%', // Increased width
    maxHeight: '400%', // Increased max height
    // --------------------
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden', // Ensure content stays within bounds
    // backgroundColor, borderColor applied dynamically
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionsList: {
    // Takes available space within modalContent max height
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor applied dynamically
  },
  optionText: {
    fontSize: 16,
    // color applied dynamically
  },
});
