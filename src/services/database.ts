import * as SQLite from 'expo-sqlite';;

const DATABASE_NAME = "let-it-count.db";

let db: SQLite.SQLiteDatabase | null = null;

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  try {
    console.log("Opening database connection...");
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    console.log("Database connection opened.");

    // Run setup statements with the NEW schema
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount_in_g INTEGER NOT NULL,
        calories_per_100_g INTEGER NOT NULL,
        createdAt INTEGER NOT NULL
      );
      -- Add other tables like settings later if needed
    `);

    console.log("Database tables checked/created.");
    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

// --- CRUD Functions ---

/**
 * Adds a new food entry to the database.
 * @param name Name of the food item
 * @param amountInG Amount consumed in grams
 * @param caloriesPer100g Calories per 100 grams of the food
 */
export async function addEntry(
  name: string,
  amountInG: number,
  caloriesPer100g: number
): Promise<void> {
  const currentDb = await getDb();
  const now = Date.now(); // Unix timestamp in milliseconds
  try {
    // Updated INSERT statement to match the new columns
    await currentDb.runAsync(
      'INSERT INTO entries (name, amount_in_g, calories_per_100_g, createdAt) VALUES (?, ?, ?, ?)',
      [name, amountInG, caloriesPer100g, now]
    );
    console.log(`Entry added: ${name}, ${amountInG}g, ${caloriesPer100g}kcal/100g`);
  } catch (error) {
    console.error("Error adding entry:", error);
    throw error;
  }
}

// --- Placeholder for fetching data ---

export interface Entry {
    id: number;
    name: string;
    amount_in_g: number;
    calories_per_100_g: number;
    createdAt: number; // Unix timestamp ms
    // Calculated field (add when fetching or processing)
    // calculated_calories?: number;
}

// Example: Function to get entries for a specific day (implement date logic)
export async function getEntriesForDay(targetDate: Date): Promise<Entry[]> {
    const currentDb = await getDb();
    // TODO: Implement proper date range filtering based on targetDate
    // For now, fetch all entries as an example
    try {
        const results = await currentDb.getAllAsync<Entry>('SELECT * FROM entries ORDER BY createdAt DESC');
        // You might calculate the actual calories here before returning if needed
        // results.forEach(entry => {
        //     entry.calculated_calories = (entry.amount_in_g / 100.0) * entry.calories_per_100_g;
        // });
        return results ?? []; // Return empty array if results are null/undefined
    } catch (error) {
        console.error("Error fetching entries:", error);
        throw error;
    }
}

export async function getAllEntries(): Promise<Entry[]> {
    const currentDb = await getDb();
    try {
        // Select all entries, newest first
        const results = await currentDb.getAllAsync<Entry>(
            'SELECT * FROM entries ORDER BY createdAt DESC'
        );
        console.log(`Workspaceed ${results?.length ?? 0} total entries.`);
        return results ?? []; // Return empty array if results are null/undefined
    } catch (error) {
        console.error("Error fetching all entries:", error);
        throw error;
    }
}

// Add other functions like getDailySummaries, etc. later