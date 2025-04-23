import { StyleSheet, Platform } from 'react-native';

export const commonStyles = StyleSheet.create({
  // --- Layout & Containers ---
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 10, // Standard horizontal padding for screens like Home
  },
  paddedContainer: { // For screens needing more padding (Settings, History, Profile)
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContentContainer: {
    paddingBottom: 20, // Keep bottom padding for scroll space
    // Removed paddingHorizontal: 10 - will be handled by parent container now
  },
  section: {
    marginBottom: 25, // Consistent bottom margin for sections/cards
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.1,
    shadowRadius: 2.00,
    elevation: 2,
  },
  cardLook: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
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
  },
  inputSmall: {
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
    minHeight: 44,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginTop: 5,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // --- Text Styles ---
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 16,
  },
  secondaryText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },

  // --- Entry Item Styles ---
  entryItemContainer: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  entryName: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  entryCalculatedKcal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  entryDetails: {
    fontSize: 14,
  },
  entryTimestamp: {
    fontSize: 12,
  },
  macroRow: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  macroText: {
    fontSize: 12,
  }

});

