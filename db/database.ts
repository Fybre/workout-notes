import { Set } from "@/types/workout";
import * as SQLite from "expo-sqlite";
import { INITIAL_EXERCISE_DEFINITIONS } from "./seedData";

const DATABASE_NAME = "workout.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Initialize database
export async function initializeDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Check if we need to migrate to new schema
  let needsMigration = false;

  try {
    // Check if old exercises table exists without definitionId column
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='exercises'",
    );

    if (result && result.count > 0) {
      // Check if definitionId column exists
      const columnResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM pragma_table_info('exercises') WHERE name='definitionId'",
      );

      if (!columnResult || columnResult.count === 0) {
        needsMigration = true;
      }
    }
  } catch (error) {
    console.log("Error checking schema, assuming new database:", error);
    needsMigration = false;
  }

  if (needsMigration) {
    // Drop old tables and create new schema
    console.log("Migrating to new database schema...");
    try {
      // Disable foreign keys temporarily for migration
      await db.execAsync("PRAGMA foreign_keys = OFF;");

      // Drop tables in reverse order due to foreign key constraints
      await db.execAsync("DROP TABLE IF EXISTS sets");
      await db.execAsync("DROP TABLE IF EXISTS exercises");

      // Re-enable foreign keys
      await db.execAsync("PRAGMA foreign_keys = ON;");
    } catch (error) {
      console.log("Error during migration:", error);
      // If migration fails, we'll continue with new tables
      // The CREATE TABLE IF NOT EXISTS will handle this
    }
  }

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
  await seedInitialExerciseDefinitions();

  dbInstance = db;
  return db;
}

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
}

// Set operations
export async function addSet(exerciseId: string, set: Set) {
  const db = await getDatabase();

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
  const db = await getDatabase();

  const sets = await db.getAllAsync<Set>(
    "SELECT * FROM sets WHERE exerciseId = ? ORDER BY timestamp ASC",
    [exerciseId],
  );

  return sets;
}

export async function updateSet(setId: string, updates: Partial<Set>) {
  const db = await getDatabase();

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
  const db = await getDatabase();

  await db.runAsync("DELETE FROM sets WHERE id = ?", [setId]);
}

export async function deleteExercise(exerciseId: string) {
  const db = await getDatabase();

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
  const db = await getDatabase();

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
  const db = await getDatabase();

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
  const db = await getDatabase();

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
  const db = await getDatabase();

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
  const db = await getDatabase();

  const exercises = await db.getAllAsync<{
    id: string;
    definitionId: string;
    date: string;
    createdAt: number;
    name: string;
    type: string;
  }>(
    `SELECT e.id, e.definitionId, e.date, e.createdAt,
            ed.name, ed.type
     FROM exercises e
     JOIN exercise_definitions ed ON e.definitionId = ed.id
     WHERE e.date = ?
     ORDER BY e.createdAt ASC`,
    [date],
  );

  // Fetch sets for each exercise
  const exercisesWithSets = await Promise.all(
    exercises.map(async (ex) => ({
      id: ex.id,
      definitionId: ex.definitionId,
      name: ex.name,
      type: ex.type,
      date: ex.date,
      createdAt: ex.createdAt,
      sets: await getSetsForExercise(ex.id),
    })),
  );

  return exercisesWithSets;
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
  const db = await getDatabase();

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
  const db = await getDatabase();

  await db.execAsync(`
    DELETE FROM sets;
    DELETE FROM exercises;
    DELETE FROM exercise_definitions;
  `);
}

// Seed initial exercise definitions
async function seedInitialExerciseDefinitions() {
  const db = dbInstance || (await getDatabase());

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
