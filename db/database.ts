import { Set } from "@/types/workout";
import * as SQLite from "expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { INITIAL_EXERCISE_DEFINITIONS } from "./seedData";

// Reference to the database instance managed by SQLiteProvider
let dbInstance: SQLite.SQLiteDatabase | null = null;

// Called by SQLiteProvider's onInit - receives the managed database instance
export async function initializeSchema(db: SQLite.SQLiteDatabase) {
  console.log("[DEBUG] Initializing database schema...");

  // Store reference for use in non-component code
  dbInstance = db;

  // Create new tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercise_definitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      unit TEXT NOT NULL,
      description TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      definitionId TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY(definitionId) REFERENCES exercise_definitions(id)
    );

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY,
      exerciseId TEXT NOT NULL,
      weight REAL,
      reps INTEGER,
      distance REAL,
      time INTEGER,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY(exerciseId) REFERENCES exercises(id)
    );

    CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(date);
    CREATE INDEX IF NOT EXISTS idx_sets_exerciseId ON sets(exerciseId);
    CREATE INDEX IF NOT EXISTS idx_exercise_definitions_name ON exercise_definitions(name);
  `);

  // Seed initial exercise definitions
  await seedInitialExerciseDefinitions(db);

  console.log("[DEBUG] Database initialization completed successfully");
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Ensure SQLiteProvider is mounted.");
  }
  return dbInstance;
}

// Hook for components to get the database context directly
export { useSQLiteContext };

// Set operations
export async function addSet(exerciseId: string, set: Set) {
  const db = getDatabase();

  await db.runAsync(
    "INSERT INTO sets (id, exerciseId, weight, reps, distance, time, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      set.id,
      exerciseId,
      set.weight ?? null,
      set.reps ?? null,
      set.distance ?? null,
      set.time ?? null,
      set.timestamp,
    ],
  );
}

export async function getSetsForExercise(exerciseId: string): Promise<Set[]> {
  const db = getDatabase();

  const sets = await db.getAllAsync<Set>(
    "SELECT * FROM sets WHERE exerciseId = ? ORDER BY timestamp ASC",
    [exerciseId],
  );

  return sets;
}

export async function updateSet(setId: string, updates: Partial<Set>) {
  const db = getDatabase();

  const updateFields = [];
  const params = [];

  if (updates.weight !== undefined) {
    updateFields.push("weight = ?");
    params.push(updates.weight);
  }
  if (updates.reps !== undefined) {
    updateFields.push("reps = ?");
    params.push(updates.reps);
  }
  if (updates.distance !== undefined) {
    updateFields.push("distance = ?");
    params.push(updates.distance);
  }
  if (updates.time !== undefined) {
    updateFields.push("time = ?");
    params.push(updates.time);
  }

  params.push(setId);

  await db.runAsync(
    `UPDATE sets SET ${updateFields.join(", ")} WHERE id = ?`,
    params,
  );
}

export async function deleteSet(setId: string) {
  const db = getDatabase();

  await db.runAsync("DELETE FROM sets WHERE id = ?", [setId]);
}

export async function deleteExercise(exerciseId: string) {
  const db = getDatabase();

  // First delete all sets associated with this exercise
  await db.runAsync("DELETE FROM sets WHERE exerciseId = ?", [exerciseId]);

  // Then delete the exercise itself
  await db.runAsync("DELETE FROM exercises WHERE id = ?", [exerciseId]);
}

// Exercise Definition operations
export async function addExerciseDefinition(definition: {
  id: string;
  name: string;
  category: string;
  type: string;
  unit: string;
  description?: string;
}) {
  const db = getDatabase();

  await db.runAsync(
    "INSERT INTO exercise_definitions (id, name, category, type, unit, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      definition.id,
      definition.name,
      definition.category,
      definition.type,
      definition.unit,
      definition.description || null,
      Date.now(),
    ],
  );
}

export async function getAllExerciseDefinitions(): Promise<
  {
    id: string;
    name: string;
    category: string;
    type: string;
    unit: string;
    description: string | null;
  }[]
> {
  const db = getDatabase();

  return await db.getAllAsync<{
    id: string;
    name: string;
    category: string;
    type: string;
    unit: string;
    description: string | null;
  }>("SELECT * FROM exercise_definitions ORDER BY name ASC");
}

export async function getExerciseDefinitionByName(name: string): Promise<{
  id: string;
  name: string;
  category: string;
  type: string;
  unit: string;
  description: string | null;
} | null> {
  const db = getDatabase();

  const results = await db.getAllAsync<any>(
    "SELECT * FROM exercise_definitions WHERE name = ? LIMIT 1",
    [name],
  );

  return results.length > 0 ? results[0] : null;
}

// Updated Exercise operations for new schema
export async function addExerciseWithDefinition(exercise: {
  id: string;
  definitionId: string;
  date: string;
}) {
  const db = getDatabase();

  await db.runAsync(
    "INSERT INTO exercises (id, definitionId, date, createdAt) VALUES (?, ?, ?, ?)",
    [exercise.id, exercise.definitionId, exercise.date, Date.now()],
  );
}

export async function getExercisesForDate(date: string): Promise<
  {
    id: string;
    definitionId: string;
    name: string;
    type: string;
    date: string;
    createdAt: number;
    sets: Set[];
  }[]
> {
  console.log(`[DEBUG] getExercisesForDate called with date: ${date}`);
  const startTime = Date.now();
  const db = getDatabase();

  // Single optimized query with JOIN to fetch exercises and their sets in one go
  const results = await db.getAllAsync<{
    exercise_id: string;
    definitionId: string;
    date: string;
    createdAt: number;
    name: string;
    type: string;
    set_id: string;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    time: number | null;
    timestamp: number;
  }>(
    `SELECT e.id as exercise_id, e.definitionId, e.date, e.createdAt,
            ed.name, ed.type,
            s.id as set_id, s.weight, s.reps, s.distance, s.time, s.timestamp
     FROM exercises e
     JOIN exercise_definitions ed ON e.definitionId = ed.id
     LEFT JOIN sets s ON e.id = s.exerciseId
     WHERE e.date = ?
     ORDER BY e.createdAt ASC, s.timestamp ASC`,
    [date],
  );

  const endTime = Date.now();
  console.log(
    `[DEBUG] Query completed in ${endTime - startTime}ms, found ${results.length} rows`,
  );

  // Group results by exercise
  const exercisesMap = new Map<
    string,
    {
      id: string;
      definitionId: string;
      name: string;
      type: string;
      date: string;
      createdAt: number;
      sets: Set[];
    }
  >();

  for (const row of results) {
    if (!exercisesMap.has(row.exercise_id)) {
      exercisesMap.set(row.exercise_id, {
        id: row.exercise_id,
        definitionId: row.definitionId,
        name: row.name,
        type: row.type,
        date: row.date,
        createdAt: row.createdAt,
        sets: [],
      });
    }

    const exercise = exercisesMap.get(row.exercise_id)!;

    // Add set if it exists (LEFT JOIN may return null for exercises with no sets)
    if (row.set_id) {
      exercise.sets.push({
        id: row.set_id,
        weight: row.weight ?? undefined,
        reps: row.reps ?? undefined,
        distance: row.distance ?? undefined,
        time: row.time ?? undefined,
        timestamp: row.timestamp,
      });
    }
  }

  const exercisesWithSets = Array.from(exercisesMap.values());
  console.log(
    `[DEBUG] Returning ${exercisesWithSets.length} exercises with sets`,
  );
  return exercisesWithSets;
}

/**
 * Get all dates that have exercises within a date range
 * Used for marking calendar dates
 */
export async function getDatesWithExercises(
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const db = getDatabase();

  const results = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM exercises
     WHERE date >= ? AND date <= ?
     ORDER BY date ASC`,
    [startDate, endDate],
  );

  return results.map((r) => r.date);
}

// Get the most recent exercise for a given exercise name (excluding today if specified)
export async function getLastExerciseByName(
  exerciseName: string,
  excludeDate?: string,
): Promise<{
  id: string;
  definitionId: string;
  name: string;
  type: string;
  date: string;
  createdAt: number;
  sets: Set[];
} | null> {
  const db = getDatabase();

  let exercise: {
    id: string;
    definitionId: string;
    date: string;
    createdAt: number;
    name: string;
    type: string;
  } | null;

  if (excludeDate) {
    exercise = await db.getFirstAsync<{
      id: string;
      definitionId: string;
      date: string;
      createdAt: number;
      name: string;
      type: string;
    }>(
      `SELECT e.id, e.definitionId, e.date, e.createdAt, ed.name, ed.type
       FROM exercises e
       JOIN exercise_definitions ed ON e.definitionId = ed.id
       WHERE ed.name = ? AND e.date != ?
       ORDER BY e.date DESC, e.createdAt DESC LIMIT 1`,
      [exerciseName, excludeDate],
    );
  } else {
    exercise = await db.getFirstAsync<{
      id: string;
      definitionId: string;
      date: string;
      createdAt: number;
      name: string;
      type: string;
    }>(
      `SELECT e.id, e.definitionId, e.date, e.createdAt, ed.name, ed.type
       FROM exercises e
       JOIN exercise_definitions ed ON e.definitionId = ed.id
       WHERE ed.name = ?
       ORDER BY e.date DESC, e.createdAt DESC LIMIT 1`,
      [exerciseName],
    );
  }

  if (!exercise) {
    return null;
  }

  const sets = await getSetsForExercise(exercise.id);

  return {
    id: exercise.id,
    definitionId: exercise.definitionId,
    name: exercise.name,
    type: exercise.type,
    date: exercise.date,
    createdAt: exercise.createdAt,
    sets,
  };
}

// Utility
export async function clearAllData() {
  const db = getDatabase();

  await db.execAsync(`
    DELETE FROM sets;
    DELETE FROM exercises;
    DELETE FROM exercise_definitions;
  `);
}

// Seed initial exercise definitions
async function seedInitialExerciseDefinitions(db: SQLite.SQLiteDatabase) {
  // Check if we already have definitions
  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM exercise_definitions",
  );

  if (count && count.count > 0) {
    return; // Already seeded
  }

  // Use the imported seed data instead of hardcoded array
  for (const def of INITIAL_EXERCISE_DEFINITIONS) {
    await db.runAsync(
      "INSERT INTO exercise_definitions (id, name, category, type, unit, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        def.id,
        def.name,
        def.category,
        def.type,
        def.unit,
        def.description,
        Date.now(),
      ],
    );
  }
}
