import type { ExerciseType } from "@/types/workout";
import { Set } from "@/types/workout";
import { generateId } from "@/utils/id";
import { compareSets } from "@/utils/pb-utils";
import * as SQLite from "expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { initializeSchemaVersion, runMigrations } from "./schema";
import { INITIAL_EXERCISE_DEFINITIONS } from "./seedData";

// Reference to the database instance managed by SQLiteProvider
let dbInstance: SQLite.SQLiteDatabase | null = null;

// Shared schema definition - single source of truth
const SCHEMA_SQL = `
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
    note TEXT,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(exerciseId) REFERENCES exercises(id)
  );

  CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(date);
  CREATE INDEX IF NOT EXISTS idx_sets_exerciseId ON sets(exerciseId);
  CREATE INDEX IF NOT EXISTS idx_exercise_definitions_name ON exercise_definitions(name);
`;

// Called by SQLiteProvider's onInit - receives the managed database instance
export async function initializeSchema(db: SQLite.SQLiteDatabase) {
  // Store reference for use in non-component code
  dbInstance = db;

  // Create tables using shared schema
  await db.execAsync(SCHEMA_SQL);

  // Initialize schema version tracking and run any pending migrations
  await initializeSchemaVersion(db);
  await runMigrations(db);

  // Seed initial exercise definitions
  await seedInitialExerciseDefinitions();
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error(
      "Database not initialized. Ensure SQLiteProvider is mounted.",
    );
  }
  return dbInstance;
}

// Hook for components to get the database context directly
export { useSQLiteContext };

// Set operations
export async function addSet(exerciseId: string, set: Set) {
  const db = getDatabase();

  await db.runAsync(
    "INSERT INTO sets (id, exerciseId, weight, reps, distance, time, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      set.id,
      exerciseId,
      set.weight ?? null,
      set.reps ?? null,
      set.distance ?? null,
      set.time ?? null,
      set.note ?? null,
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
  if (updates.note !== undefined) {
    updateFields.push("note = ?");
    params.push(updates.note);
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
  id?: string;
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
      definition.id || generateId(),
      definition.name,
      definition.category,
      definition.type,
      definition.unit,
      definition.description || null,
      Date.now(),
    ],
  );
}

export async function updateExerciseDefinition(
  id: string,
  updates: {
    name?: string;
    category?: string;
    type?: string;
    unit?: string;
    description?: string;
  }
) {
  const db = getDatabase();

  const updateFields: string[] = [];
  const params: (string | null)[] = [];

  if (updates.name !== undefined) {
    updateFields.push("name = ?");
    params.push(updates.name);
  }
  if (updates.category !== undefined) {
    updateFields.push("category = ?");
    params.push(updates.category);
  }
  if (updates.type !== undefined) {
    updateFields.push("type = ?");
    params.push(updates.type);
  }
  if (updates.unit !== undefined) {
    updateFields.push("unit = ?");
    params.push(updates.unit);
  }
  if (updates.description !== undefined) {
    updateFields.push("description = ?");
    params.push(updates.description || null);
  }

  if (updateFields.length === 0) return;

  params.push(id);

  await db.runAsync(
    `UPDATE exercise_definitions SET ${updateFields.join(", ")} WHERE id = ?`,
    params
  );
}

export async function deleteExerciseDefinition(id: string) {
  const db = getDatabase();

  // First delete all sets for exercises using this definition
  await db.runAsync(
    `DELETE FROM sets WHERE exerciseId IN (SELECT id FROM exercises WHERE definitionId = ?)`,
    [id]
  );

  // Then delete all exercises using this definition
  await db.runAsync(
    "DELETE FROM exercises WHERE definitionId = ?",
    [id]
  );

  // Finally delete the definition
  await db.runAsync(
    "DELETE FROM exercise_definitions WHERE id = ?",
    [id]
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

export async function getUniqueCategories(): Promise<string[]> {
  const db = getDatabase();

  const results = await db.getAllAsync<{ category: string }>(
    "SELECT DISTINCT category FROM exercise_definitions ORDER BY category ASC",
  );

  return results.map((r) => r.category);
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
    [
      exercise.id || generateId(),
      exercise.definitionId,
      exercise.date,
      Date.now(),
    ],
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
    category: string;
    set_id: string;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    time: number | null;
    note: string | null;
    timestamp: number;
  }>(
    `SELECT e.id as exercise_id, e.definitionId, e.date, e.createdAt,
            ed.name, ed.type, ed.category,
            s.id as set_id, s.weight, s.reps, s.distance, s.time, s.note, s.timestamp
     FROM exercises e
     JOIN exercise_definitions ed ON e.definitionId = ed.id
     LEFT JOIN sets s ON e.id = s.exerciseId
     WHERE e.date = ?
     ORDER BY e.createdAt ASC, s.timestamp ASC`,
    [date],
  );

  const endTime = Date.now();

  // Group results by exercise
  const exercisesMap = new Map<
    string,
    {
      id: string;
      definitionId: string;
      name: string;
      type: string;
      category: string;
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
        category: row.category,
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
        note: row.note ?? undefined,
        timestamp: row.timestamp,
      });
    }
  }

  const exercisesWithSets = Array.from(exercisesMap.values());
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

// Get personal best (single best set) for a specific exercise by name
export async function getPersonalBestForExercise(
  exerciseName: string,
  excludeDate?: string,
): Promise<Set | null> {
  const db = getDatabase();

  // First, get the exercise definition to know the type
  const definition = await db.getFirstAsync<{ id: string; type: string }>(
    "SELECT id, type FROM exercise_definitions WHERE name = ?",
    [exerciseName],
  );

  if (!definition) {
    return null;
  }

  // Get all historical sets for this exercise (excluding current date if specified)
  const query = excludeDate
    ? `SELECT s.* FROM sets s
       JOIN exercises e ON s.exerciseId = e.id
       WHERE e.definitionId = ? AND e.date != ?`
    : `SELECT s.* FROM sets s
       JOIN exercises e ON s.exerciseId = e.id
       WHERE e.definitionId = ?`;

  const params = excludeDate ? [definition.id, excludeDate] : [definition.id];

  const sets = await db.getAllAsync<Set>(query, params);

  if (sets.length === 0) {
    return null;
  }

  // Find the best set based on exercise type
  const exerciseType = definition.type as ExerciseType;
  return sets.reduce((best, current) => {
    return compareSets(current, best, exerciseType) > 0 ? current : best;
  });
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

// Get exercise for a specific date by definition ID (to check if already exists)
export async function getExerciseForDateByDefinition(
  definitionId: string,
  date: string,
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

  const exercise = await db.getFirstAsync<{
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
     WHERE e.definitionId = ? AND e.date = ?`,
    [definitionId, date],
  );

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

// Get all exercises with their sets for agenda view
export async function getAllExercisesWithSets(): Promise<
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
  const db = getDatabase();

  const results = await db.getAllAsync<{
    exercise_id: string;
    definitionId: string;
    name: string;
    type: string;
    date: string;
    createdAt: number;
    set_id: string;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    time: number | null;
    note: string | null;
    timestamp: number;
  }>(
    `SELECT e.id as exercise_id, e.definitionId, e.date, e.createdAt,
            ed.name, ed.type,
            s.id as set_id, s.weight, s.reps, s.distance, s.time, s.note, s.timestamp
     FROM exercises e
     JOIN exercise_definitions ed ON e.definitionId = ed.id
     LEFT JOIN sets s ON e.id = s.exerciseId
     ORDER BY e.date DESC, e.createdAt ASC, s.timestamp ASC`,
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

    if (row.set_id) {
      exercise.sets.push({
        id: row.set_id,
        weight: row.weight ?? undefined,
        reps: row.reps ?? undefined,
        distance: row.distance ?? undefined,
        time: row.time ?? undefined,
        note: row.note ?? undefined,
        timestamp: row.timestamp,
      });
    }
  }

  return Array.from(exercisesMap.values());
}

// Get all exercise definition IDs that have at least one set logged
export async function getUsedExerciseIds(): Promise<string[]> {
  const db = getDatabase();

  const results = await db.getAllAsync<{ definitionId: string }>(
    `SELECT DISTINCT e.definitionId 
     FROM exercises e
     INNER JOIN sets s ON e.id = s.exerciseId`,
  );

  return results.map((r) => r.definitionId);
}

// Get exercises that have been logged (have sets) with their names
export async function getUsedExercises(): Promise<
  { id: string; name: string; category: string; type: string }[]
> {
  const db = getDatabase();

  const results = await db.getAllAsync<{
    id: string;
    name: string;
    category: string;
    type: string;
  }>(
    `SELECT DISTINCT ed.id, ed.name, ed.category, ed.type
     FROM exercise_definitions ed
     INNER JOIN exercises e ON ed.id = e.definitionId
     INNER JOIN sets s ON e.id = s.exerciseId
     ORDER BY ed.name ASC`,
  );

  return results;
}

// Get historical data for a specific exercise for charting
export async function getExerciseHistoryForChart(
  exerciseName: string,
  startDate: string,
  endDate: string,
): Promise<
  {
    date: string;
    bestWeight: number;
    bestReps: number;
    bestDistance: number;
    bestTime: number;
    totalVolume: number;
    setCount: number;
  }[]
> {
  const db = getDatabase();

  // Get the exercise definition
  const definition = await db.getFirstAsync<{
    id: string;
    type: string;
  }>("SELECT id, type FROM exercise_definitions WHERE name = ?", [
    exerciseName,
  ]);

  if (!definition) {
    return [];
  }

  // Get all exercises with their sets for this exercise in the date range
  const results = await db.getAllAsync<{
    date: string;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    time: number | null;
  }>(
    `SELECT e.date, s.weight, s.reps, s.distance, s.time
     FROM exercises e
     JOIN sets s ON e.id = s.exerciseId
     WHERE e.definitionId = ? AND e.date >= ? AND e.date <= ?
     ORDER BY e.date ASC`,
    [definition.id, startDate, endDate],
  );

  // Group by date and calculate best values for each day
  const groupedByDate = new Map<
    string,
    {
      bestWeight: number;
      bestReps: number;
      bestDistance: number;
      bestTime: number;
      totalVolume: number;
      setCount: number;
    }
  >();

  for (const row of results) {
    if (!groupedByDate.has(row.date)) {
      groupedByDate.set(row.date, {
        bestWeight: 0,
        bestReps: 0,
        bestDistance: 0,
        bestTime: 0,
        totalVolume: 0,
        setCount: 0,
      });
    }

    const dayData = groupedByDate.get(row.date)!;
    dayData.setCount++;

    // Track best single values
    if (row.weight && row.weight > dayData.bestWeight) {
      dayData.bestWeight = row.weight;
    }
    if (row.reps && row.reps > dayData.bestReps) {
      dayData.bestReps = row.reps;
    }
    if (row.distance && row.distance > dayData.bestDistance) {
      dayData.bestDistance = row.distance;
    }
    if (row.time && row.time > dayData.bestTime) {
      dayData.bestTime = row.time;
    }

    // Calculate volume (weight × reps) for weight exercises
    if (row.weight && row.reps) {
      dayData.totalVolume += row.weight * row.reps;
    }
  }

  // Convert to array
  const history: {
    date: string;
    bestWeight: number;
    bestReps: number;
    bestDistance: number;
    bestTime: number;
    totalVolume: number;
    setCount: number;
  }[] = [];

  for (const [date, data] of groupedByDate) {
    history.push({
      date,
      ...data,
    });
  }

  return history.sort((a, b) => a.date.localeCompare(b.date));
}

// Get detailed exercise history with all sets for info modal
export async function getExerciseHistoryWithSets(
  exerciseName: string,
  limit: number = 50,
): Promise<
  {
    date: string;
    sets: Set[];
  }[]
> {
  const db = getDatabase();

  // Get the exercise definition
  const definition = await db.getFirstAsync<{
    id: string;
    type: string;
  }>("SELECT id, type FROM exercise_definitions WHERE name = ?", [
    exerciseName,
  ]);

  if (!definition) {
    return [];
  }

  // Get all exercises with their sets, ordered by date descending
  const results = await db.getAllAsync<{
    date: string;
    set_id: string;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    time: number | null;
    note: string | null;
    timestamp: number;
  }>(
    `SELECT e.date, s.id as set_id, s.weight, s.reps, s.distance, s.time, s.note, s.timestamp
     FROM exercises e
     JOIN sets s ON e.id = s.exerciseId
     WHERE e.definitionId = ?
     ORDER BY e.date DESC, s.timestamp ASC`,
    [definition.id],
  );

  // Group by date
  const groupedByDate = new Map<string, Set[]>();

  for (const row of results) {
    if (!groupedByDate.has(row.date)) {
      groupedByDate.set(row.date, []);
    }

    groupedByDate.get(row.date)!.push({
      id: row.set_id,
      weight: row.weight ?? undefined,
      reps: row.reps ?? undefined,
      distance: row.distance ?? undefined,
      time: row.time ?? undefined,
      note: row.note ?? undefined,
      timestamp: row.timestamp,
    });
  }

  // Convert to array and limit
  const history: { date: string; sets: Set[] }[] = [];
  for (const [date, sets] of groupedByDate) {
    history.push({ date, sets });
  }

  // Sort by date descending and limit
  return history.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

// Get exercise history with sets for a specific date range
export async function getExerciseHistoryWithSetsInRange(
  exerciseName: string,
  startDate: string,
  endDate: string,
): Promise<
  {
    date: string;
    sets: Set[];
  }[]
> {
  const db = getDatabase();

  // Get the exercise definition
  const definition = await db.getFirstAsync<{
    id: string;
    type: string;
  }>("SELECT id, type FROM exercise_definitions WHERE name = ?", [
    exerciseName,
  ]);

  if (!definition) {
    return [];
  }

  // Get all exercises with their sets within the date range
  const results = await db.getAllAsync<{
    date: string;
    set_id: string;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    time: number | null;
    note: string | null;
    timestamp: number;
  }>(
    `SELECT e.date, s.id as set_id, s.weight, s.reps, s.distance, s.time, s.note, s.timestamp
     FROM exercises e
     JOIN sets s ON e.id = s.exerciseId
     WHERE e.definitionId = ? AND e.date >= ? AND e.date <= ?
     ORDER BY e.date DESC, s.timestamp ASC`,
    [definition.id, startDate, endDate],
  );

  // Group by date
  const groupedByDate = new Map<string, Set[]>();

  for (const row of results) {
    if (!groupedByDate.has(row.date)) {
      groupedByDate.set(row.date, []);
    }

    groupedByDate.get(row.date)!.push({
      id: row.set_id,
      weight: row.weight ?? undefined,
      reps: row.reps ?? undefined,
      distance: row.distance ?? undefined,
      time: row.time ?? undefined,
      note: row.note ?? undefined,
      timestamp: row.timestamp,
    });
  }

  // Convert to array
  const history: { date: string; sets: Set[] }[] = [];
  for (const [date, sets] of groupedByDate) {
    history.push({ date, sets });
  }

  // Sort by date descending
  return history.sort((a, b) => b.date.localeCompare(a.date));
}

// New robust database clearing function that handles UNIQUE constraint issues
export async function clearDatabase() {
  const db = getDatabase();

  try {
    // Use a transaction to ensure atomicity
    await db.withTransactionAsync(async () => {
      // Drop all tables to completely reset the database
      await db.execAsync(`
        DROP TABLE IF EXISTS sets;
        DROP TABLE IF EXISTS exercises;
        DROP TABLE IF EXISTS exercise_definitions;
      `);

      // Recreate tables using shared schema (single source of truth)
      await db.execAsync(SCHEMA_SQL);

      // Clear and reseed exercise definitions
      await seedInitialExerciseDefinitions();
    });
  } catch (error) {
    throw error;
  }
}

export async function clearWorkoutData() {
  const db = getDatabase();

  try {
    // Use a transaction to ensure atomicity
    await db.withTransactionAsync(async () => {
      // Delete all sets (must be done first due to foreign key constraints)
      await db.execAsync(`DELETE FROM sets;`);

      // Delete all logged exercises
      await db.execAsync(`DELETE FROM exercises;`);
    });
  } catch (error) {
    throw error;
  }
}

// Seed initial exercise definitions
async function seedInitialExerciseDefinitions() {
  const db = getDatabase();
  // Check if we already have definitions
  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM exercise_definitions",
  );

  if (count && count.count > 0) {
    return; // Already seeded
  }

  for (const def of INITIAL_EXERCISE_DEFINITIONS) {
    // Use addExerciseDefinition which handles ID generation automatically
    await addExerciseDefinition({
      name: def.name,
      category: def.category,
      type: def.type,
      unit: def.unit,
      description: def.description,
    });
  }
}
