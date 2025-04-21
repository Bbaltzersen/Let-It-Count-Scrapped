import * as SQLite from 'expo-sqlite'; // Assuming main import works now
import { Entry } from 'types'; // Import the shared Entry type

const DATABASE_NAME = "let-it-count.db";

let db: SQLite.SQLiteDatabase | null = null;

// initializeDatabase function (no changes needed inside)
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }
  try {
    console.log("Opening database connection...");
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    console.log("Database connection opened.");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount_in_g INTEGER NOT NULL,
        calories_per_100_g INTEGER NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);
    console.log("Database tables checked/created.");
    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// getDb function (no changes needed inside)
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

// --- CRUD Functions ---

// addEntry function (no changes needed inside, already uses primitive types)
export async function addEntry(
  name: string,
  amountInG: number,
  caloriesPer100g: number
): Promise<void> {
  const currentDb = await getDb();
  const now = Date.now();
  try {
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

// getEntriesForDay function (uses imported Entry type)
export async function getEntriesForDay(targetDate: Date): Promise<Entry[]> {
    const currentDb = await getDb();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const startTimestamp = startOfDay.getTime();
    const endTimestamp = endOfDay.getTime();

    try {
        // Use the imported Entry type for the generic parameter
        const results = await currentDb.getAllAsync<Entry>(
            'SELECT * FROM entries WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC',
            [startTimestamp, endTimestamp]
        );
        console.log(`Fetched ${results?.length ?? 0} entries for ${targetDate.toDateString()}`);
        return results ?? [];
    } catch (error) {
        console.error("Error fetching entries for day:", error);
        throw error;
    }
}

// getAllEntries function (uses imported Entry type)
export async function getAllEntries(): Promise<Entry[]> {
    const currentDb = await getDb();
    try {
        // Use the imported Entry type for the generic parameter
        const results = await currentDb.getAllAsync<Entry>(
            'SELECT * FROM entries ORDER BY createdAt DESC'
        );
        console.log(`Fetched ${results?.length ?? 0} total entries.`);
        return results ?? [];
    } catch (error) {
        console.error("Error fetching all entries:", error);
        throw error;
    }
}

