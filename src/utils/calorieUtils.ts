import { Entry } from 'types'; // Import the shared Entry type

/**
 * Calculates the total calories for a given food entry based on its amount and caloric density.
 * @param item The food entry object.
 * @returns The calculated calories, rounded to the nearest integer. Returns 0 if input is invalid.
 */
export const calculateCalories = (item: Entry): number => {
  // Basic validation for required numeric properties
  if (!item || typeof item.amount_in_g !== 'number' || typeof item.calories_per_100_g !== 'number') {
    console.warn('Invalid entry passed to calculateCalories:', item);
    return 0;
  }
  // Ensure no division by zero or invalid calculation if calories_per_100_g is 0 or amount_in_g is negative
  if (item.calories_per_100_g <= 0 || item.amount_in_g < 0) {
      return 0;
  }

  // Calculate calories: (amount / 100) * kcal_per_100g
  const calculated = (item.amount_in_g / 100.0) * item.calories_per_100_g;

  return Math.round(calculated);
};

// Add other calculation-related utility functions here later if needed.
