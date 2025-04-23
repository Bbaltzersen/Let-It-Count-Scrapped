import * as SQLite from 'expo-sqlite';
import { Entry } from 'types'; // Ensure this type includes ALL the new fields

const DATABASE_NAME = "let-it-count.db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initializes the database connection and creates the 'entries' table if it doesn't exist.
 * The table now includes columns for macronutrients, saturated fat, sugars, and salt.
 * @returns {Promise<SQLite.SQLiteDatabase>} A promise that resolves with the database instance.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }
  try {
    console.log("Opening database connection...");
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    console.log("Database connection opened.");
    // Updated table schema to include more detailed nutritional info
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount_in_g INTEGER NOT NULL,
        calories_per_100_g INTEGER NOT NULL,
        protein_per_100_g REAL DEFAULT 0,
        carbs_per_100_g REAL DEFAULT 0,
        fat_per_100_g REAL DEFAULT 0,
        saturated_fat_per_100_g REAL DEFAULT 0, -- Added saturated fat
        sugars_per_100_g REAL DEFAULT 0,        -- Added sugars
        salt_per_100_g REAL DEFAULT 0,          -- Added salt
        createdAt INTEGER NOT NULL
      );
    `);
    console.log("Database tables checked/created (with macros & micros).");

    // --- Optional: Add columns if they don't exist (for existing databases) ---
    // Simple migration for app updates. Handle robustly for production.
    const columnsToAdd = [
        { name: 'protein_per_100_g', type: 'REAL DEFAULT 0' },
        { name: 'carbs_per_100_g', type: 'REAL DEFAULT 0' },
        { name: 'fat_per_100_g', type: 'REAL DEFAULT 0' },
        { name: 'saturated_fat_per_100_g', type: 'REAL DEFAULT 0' }, // New
        { name: 'sugars_per_100_g', type: 'REAL DEFAULT 0' },        // New
        { name: 'salt_per_100_g', type: 'REAL DEFAULT 0' }           // New
    ];

    for (const col of columnsToAdd) {
        try {
            await db.execAsync(`ALTER TABLE entries ADD COLUMN ${col.name} ${col.type};`);
            console.log(`Added ${col.name} column.`);
        } catch (e: any) {
            // Ignore error if column already exists, log others
            if (!e.message.includes('duplicate column name')) {
                console.error(`Error adding ${col.name} column:`, e);
            }
        }
    }
    // --- End Optional Migration ---

    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

/**
 * Gets the current database instance, initializing it if necessary.
 * @returns {Promise<SQLite.SQLiteDatabase>} A promise that resolves with the database instance.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

// --- CRUD Functions ---

/**
 * Adds a new food entry to the database, including detailed nutritional information.
 * @param {string} name - The name of the food item.
 * @param {number} amountInG - The amount consumed in grams.
 * @param {number} caloriesPer100g - Calories per 100 grams.
 * @param {number} proteinPer100g - Protein per 100 grams.
 * @param {number} carbsPer100g - Carbohydrates per 100 grams.
 * @param {number} fatPer100g - Fat per 100 grams.
 * @param {number} saturatedFatPer100g - Saturated fat per 100 grams.
 * @param {number} sugarsPer100g - Sugars per 100 grams.
 * @param {number} saltPer100g - Salt per 100 grams.
 * @returns {Promise<void>} A promise that resolves when the entry is added.
 */
export async function addEntry(
  name: string,
  amountInG: number,
  caloriesPer100g: number,
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number,
  saturatedFatPer100g: number, // New parameter
  sugarsPer100g: number,       // New parameter
  saltPer100g: number          // New parameter
): Promise<void> {
  const currentDb = await getDb();
  const now = Date.now();
  try {
    // Updated INSERT statement to include all new fields
    await currentDb.runAsync(
      `INSERT INTO entries (
         name, amount_in_g, calories_per_100_g,
         protein_per_100_g, carbs_per_100_g, fat_per_100_g,
         saturated_fat_per_100_g, sugars_per_100_g, salt_per_100_g,
         createdAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Added 3 placeholders
      [
        name, amountInG, caloriesPer100g,
        proteinPer100g, carbsPer100g, fatPer100g,
        saturatedFatPer100g, sugarsPer100g, saltPer100g, // Added new values
        now
      ]
    );
    console.log(`Entry added: ${name}, ${amountInG}g, ${caloriesPer100g}kcal, ${proteinPer100g}p, ${carbsPer100g}c, ${fatPer100g}f, ${saturatedFatPer100g}sf, ${sugarsPer100g}sug, ${saltPer100g}salt`);
  } catch (error) {
    console.error("Error adding entry:", error);
    throw error;
  }
}

/**
 * Fetches all entries for a specific date.
 * Assumes the 'Entry' type includes the new detailed nutritional fields.
 * @param {Date} targetDate - The date for which to fetch entries.
 * @returns {Promise<Entry[]>} A promise that resolves with an array of entries for the day.
 */
export async function getEntriesForDay(targetDate: Date): Promise<Entry[]> {
    const currentDb = await getDb();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const startTimestamp = startOfDay.getTime();
    const endTimestamp = endOfDay.getTime();

    try {
        // SELECT * will fetch the new columns automatically.
        // Ensure the 'Entry' type matches the table structure including ALL fields.
        const results = await currentDb.getAllAsync<Entry>(
            'SELECT * FROM entries WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC',
            [startTimestamp, endTimestamp]
        );
        console.log(`Fetched ${results?.length ?? 0} entries for ${targetDate.toDateString()}`);
        // IMPORTANT: Map results if needed to match expected property names in your Entry type
        // e.g., map row.saturated_fat_per_100_g to row.saturatedFatPer100g if your type uses camelCase
        // return (results ?? []).map(row => ({
        //     ...row,
        //     proteinPer100g: row.protein_per_100_g,
        //     carbsPer100g: row.carbs_per_100_g,
        //     fatPer100g: row.fat_per_100_g,
        //     saturatedFatPer100g: row.saturated_fat_per_100_g, // Map new fields
        //     sugarsPer100g: row.sugars_per_100_g,           // Map new fields
        //     saltPer100g: row.salt_per_100_g                // Map new fields
        // }));
         return results ?? [];
    } catch (error) {
        console.error("Error fetching entries for day:", error);
        throw error;
    }
}

/**
 * Fetches all entries from the database.
 * Assumes the 'Entry' type includes the new detailed nutritional fields.
 * @returns {Promise<Entry[]>} A promise that resolves with an array of all entries.
 */
export async function getAllEntries(): Promise<Entry[]> {
    const currentDb = await getDb();
    try {
        // SELECT * will fetch the new columns automatically.
        // Ensure the 'Entry' type matches the table structure including ALL fields.
        const results = await currentDb.getAllAsync<Entry>(
            'SELECT * FROM entries ORDER BY createdAt DESC'
        );
        console.log(`Fetched ${results?.length ?? 0} total entries.`);
         // Add mapping here as well if needed (similar to getEntriesForDay)
        return results ?? [];
    } catch (error) {
        console.error("Error fetching all entries:", error);
        throw error;
    }
}

// Optional: Function to close the database if needed
export async function closeDatabase(): Promise<void> {
    if (db) {
        console.log("Closing database connection...");
        await db.closeAsync();
        db = null; // Reset the db variable
        console.log("Database connection closed.");
    }
}
