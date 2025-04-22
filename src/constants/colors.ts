// src/constants/colors.ts

// Define the structure of our theme colors
export interface ThemeColors {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string; // Green in dark mode, Blue in light
    danger: string; // Red color for warnings/over limit/toggles
    border: string;
    inputBackground: string;
    inputText: string;
    inputBorder: string;
    totalBackground: string;
    totalText: string;
    totalValue: string;
    icon: string;
    kcalHighlight: string; // New color specifically for kcal display
    // Add more colors as needed
  }
  
  const KcalGreen = '#34d399'; // Define the green color once
  
  // Light theme
  export const lightTheme: ThemeColors = {
    background: '#f8f8f8',
    card: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    primary: KcalGreen, // Blue
    danger: '#ef4444', // Red
    border: '#e5e7eb',
    inputBackground: '#ffffff',
    inputText: '#111827',
    inputBorder: '#d1d5db',
    totalBackground: '#e9edf5',
    totalText: '#2c3e50',
    totalValue: '#34495e',
    icon: '#1f2937',
    kcalHighlight: KcalGreen, // Use the defined green
  };
  
  // Dark Theme
  export const darkTheme: ThemeColors = {
    background: '#000000',
    card: '#1c1c1e',
    text: '#f2f2f7',
    textSecondary: '#8e8e93',
    primary: KcalGreen, // Keep primary as green
    danger: '#f87171', // Red for danger/toggle
    border: '#38383a',
    inputBackground: '#2c2c2e',
    inputText: '#f2f2f7',
    inputBorder: '#545458',
    totalBackground: '#1c1c1e',
    totalText: '#aeaeb2',
    totalValue: '#f2f2f7',
    icon: '#f2f2f7',
    kcalHighlight: KcalGreen, // Use the same defined green
  };
  