import { StyleSheet, Platform } from 'react-native';

/**
 * Common styles shared across multiple components.
 * These styles focus on layout, typography, and base structure,
 * excluding theme-specific colors which are applied in components.
 */
export const commonStyles = StyleSheet.create({
  // --- Layout & Containers ---
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  paddedContainer: { // For screens needing padding around content
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
  },
  centerContent: { // For loading/empty states
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10, // Add horizontal padding for consistency
  },
  section: { // Used in Settings
    marginBottom: 25,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor, borderColor applied dynamically
    shadowColor: "#000", // Basic shadow, consider adjusting per theme if needed
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.1,
    shadowRadius: 2.00,
    elevation: 2,
  },
  cardLook: { // Common card appearance (used in Home, History)
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor, borderColor applied dynamically
    shadowColor: "#000", // Basic shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },

  // --- Input Fields ---
  inputBase: {
    borderWidth: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
    // backgroundColor, color, borderColor applied dynamically
  },
  inputSmall: { // For inputs sharing a row
    flex: 1,
    marginRight: 5,
  },

  // --- Buttons ---
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 44, // Good touch target size
    // backgroundColor applied dynamically
  },
  buttonText: { // Text specifically for primary buttons
    color: '#ffffff', // Usually white text on primary color
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: { // For the optional fields toggle
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginTop: 5,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    // borderColor applied dynamically
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    // color applied dynamically (usually primary)
  },

  // --- Text Styles ---
  screenTitle: { // For main screen titles if needed (e.g., Settings)
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    // color applied dynamically
  },
  formTitle: { // Title above form sections (e.g., Home)
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5, // Consistent indent
    // color applied dynamically
  },
  listTitle: { // Title above lists (e.g., Home, History)
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 5, // Consistent indent
    // color applied dynamically
  },
  label: { // General purpose label (e.g., Settings)
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
    // color applied dynamically
  },
  bodyText: { // Default text style
    fontSize: 16,
    // color applied dynamically
  },
  secondaryText: { // For less important text (timestamps, details)
    fontSize: 14,
    // color applied dynamically (usually textSecondary)
  },
  errorText: {
    fontSize: 14,
    // color usually maps to colors.error or similar
    textAlign: 'center',
    marginTop: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    // color applied dynamically (usually textSecondary)
  },

  // --- Entry Item Styles (Common parts for Home/History) ---
  entryItemContainer: { // Base container for an entry
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor, borderColor, shadow applied dynamically (often using cardLook)
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  entryName: {
    fontWeight: 'bold',
    fontSize: 16, // Slightly larger for name
    flex: 1,
    marginRight: 10,
    // color applied dynamically
  },
  entryCalculatedKcal: {
    fontWeight: 'bold',
    fontSize: 16, // Match name size
    // color applied dynamically (usually kcalHighlight)
  },
  entryDetails: {
    fontSize: 14, // Smaller for details
    // color applied dynamically (usually textSecondary)
  },
  entryTimestamp: {
    fontSize: 12, // Smallest for timestamp
    // color applied dynamically (usually textSecondary)
  },
  macroRow: { // Row for displaying macros within an entry
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth, // Use hairline for subtle separator
    // borderColor applied dynamically
  },
  macroText: {
    fontSize: 12,
    // color applied dynamically (usually textSecondary)
  }

});
