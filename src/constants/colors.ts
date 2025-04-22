// src/constants/colors.ts

// Define the structure of our theme colors
export interface ThemeColors {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string; // This will be red in dark mode
    border: string;
    inputBackground: string;
    inputText: string;
    inputBorder: string;
    totalBackground: string;
    totalText: string;
    totalValue: string;
    icon: string;
    // Add more colors as needed
  }
  
  // Light theme remains the same
  export const lightTheme: ThemeColors = {
    background: '#f8f8f8',
    card: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    primary: '#3b82f6', // Blue in light mode
    border: '#e5e7eb',
    inputBackground: '#ffffff',
    inputText: '#111827',
    inputBorder: '#d1d5db',
    totalBackground: '#e9edf5',
    totalText: '#2c3e50',
    totalValue: '#34495e',
    icon: '#1f2937',
  };
  
  // --- Updated Dark Theme ---
  export const darkTheme: ThemeColors = {
    background: '#000000', // Black background
    card: '#1c1c1e', // Very dark grey for cards/surfaces
    text: '#f2f2f7', // Off-white / very light grey for text
    textSecondary: '#8e8e93', // Medium grey for secondary text
    primary: '#ff3b30', // Red as the primary accent color
    border: '#38383a', // Dark grey for borders
    inputBackground: '#2c2c2e', // Slightly lighter dark grey for inputs
    inputText: '#f2f2f7', // Light text for inputs
    inputBorder: '#545458', // Grey border for inputs
    totalBackground: '#1c1c1e', // Same as card
    totalText: '#aeaeb2', // Lighter grey for total label
    totalValue: '#f2f2f7', // Light value text
    icon: '#f2f2f7', // Light icons
  };
  