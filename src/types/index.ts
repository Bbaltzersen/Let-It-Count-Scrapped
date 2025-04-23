/**
 * Represents a single food entry stored in the database.
 */
export interface Entry {
  /** The unique identifier for the entry (auto-incremented). */
  id: number;

  /** The name of the food item. */
  name: string;

  /** The amount of the food item consumed, in grams. */
  amount_in_g: number; // Keeping snake_case to match original and DB query results directly

  /** The number of calories per 100 grams of the food item. */
  calories_per_100_g: number; // Keeping snake_case

  /** Protein per 100 grams. Matches DB column name. */
  protein_per_100_g: number;

  /** Carbohydrates per 100 grams. Matches DB column name. */
  carbs_per_100_g: number;

  /** Fat per 100 grams. Matches DB column name. */
  fat_per_100_g: number;

  /** Saturated fat per 100 grams. Matches DB column name. */
  saturated_fat_per_100_g: number;

  /** Sugars per 100 grams. Matches DB column name. */
  sugars_per_100_g: number;

  /** Salt per 100 grams. Matches DB column name. */
  salt_per_100_g: number;

  /** The timestamp (Unix milliseconds) when the entry was created. */
  createdAt: number;
}

// --- Alternative with camelCase (Requires mapping in DB functions) ---
/*
export interface EntryCamelCase {
  id: number;
  name: string;
  amountInG: number; // Renamed
  caloriesPer100g: number; // Renamed
  proteinPer100g: number; // Renamed
  carbsPer100g: number; // Renamed
  fatPer100g: number; // Renamed
  saturatedFatPer100g: number; // Renamed
  sugarsPer100g: number; // Renamed
  saltPer100g: number; // Renamed
  createdAt: number;
}
*/
