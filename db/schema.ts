/**
 * Schema versioning and migration system
 * Manages database schema versions and runs migrations when needed
 */

import type { SQLiteDatabase } from "expo-sqlite";

// Current schema version - increment when making schema changes
export const CURRENT_SCHEMA_VERSION = 7;

// Migration function type
export type Migration = {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
};

/**
 * Returns true if `table` already has a column named `column`.
 */
async function columnExists(
  db: SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  return rows.some((row) => row.name === column);
}

/**
 * Adds a column only if it isn't already present. Migrations must be safe to
 * run even when the column was already created some other way (e.g. a fresh
 * install's CREATE TABLE already includes every current column), so plain
 * `ALTER TABLE ADD COLUMN` is never used directly in a migration.
 */
async function addColumnIfNotExists(
  db: SQLiteDatabase,
  table: string,
  column: string,
  columnDefinition: string,
): Promise<void> {
  if (!(await columnExists(db, table, column))) {
    await db.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${columnDefinition};`,
    );
  }
}

// Migration registry - add new migrations here
export const migrations: Migration[] = [
  {
    version: 2,
    name: "Add note column to sets table",
    up: async (db) => {
      await addColumnIfNotExists(db, "sets", "note", "note TEXT");
    },
  },
  {
    version: 3,
    name: "Add mediaUri and mediaType columns to exercise_definitions table",
    up: async (db) => {
      await addColumnIfNotExists(
        db,
        "exercise_definitions",
        "mediaUri",
        "mediaUri TEXT",
      );
      await addColumnIfNotExists(
        db,
        "exercise_definitions",
        "mediaType",
        "mediaType TEXT",
      );
    },
  },
  {
    version: 4,
    name: "Add isFavourite column to exercise_definitions table",
    up: async (db) => {
      await addColumnIfNotExists(
        db,
        "exercise_definitions",
        "isFavourite",
        "isFavourite INTEGER NOT NULL DEFAULT 0",
      );
    },
  },
  {
    version: 5,
    name: "Add templates and template_exercises tables",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS template_exercises (
          id TEXT PRIMARY KEY,
          templateId TEXT NOT NULL,
          definitionId TEXT NOT NULL,
          orderIndex INTEGER NOT NULL,
          FOREIGN KEY(templateId) REFERENCES templates(id),
          FOREIGN KEY(definitionId) REFERENCES exercise_definitions(id)
        );

        CREATE INDEX IF NOT EXISTS idx_template_exercises_templateId ON template_exercises(templateId);
      `);
    },
  },
  {
    version: 6,
    name: "Add body_measurements table",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS body_measurements (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL UNIQUE,
          weight REAL,
          bodyFatPercent REAL,
          chest REAL,
          waist REAL,
          hips REAL,
          arms REAL,
          thighs REAL,
          note TEXT,
          createdAt INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(date);
      `);
    },
  },
  {
    version: 7,
    name: "Add composite index on exercises(definitionId, date)",
    up: async (db) => {
      // exercises(definitionId) had no index at all - every per-exercise
      // history/PB/template query was a full table scan. The composite
      // index also covers "WHERE definitionId = ? ORDER BY date" directly.
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_exercises_definitionId_date ON exercises(definitionId, date);
      `);
    },
  },
];

/**
 * Initialize the schema version tracking table
 */
export async function initializeSchemaVersion(
  db: SQLiteDatabase,
): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  // Check if version record exists
  const result = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version WHERE id = 1",
  );

  if (!result) {
    // No version row yet. This could be a brand new install (CREATE TABLE
    // already produced the current schema) or an install that predates
    // version tracking (its tables may be missing newer columns). Stamp it
    // as version 0 so runMigrations evaluates every migration - each
    // migration is itself safe to run against a table that already has the
    // column, so this never causes duplicate-column errors.
    await db.runAsync(
      "INSERT INTO schema_version (id, version, updatedAt) VALUES (?, ?, ?)",
      [1, 0, Date.now()],
    );
  }
}

/**
 * Get current schema version from database
 */
export async function getCurrentSchemaVersion(
  db: SQLiteDatabase,
): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      "SELECT version FROM schema_version WHERE id = 1",
    );
    return result?.version ?? 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Update schema version in database
 */
export async function setSchemaVersion(
  db: SQLiteDatabase,
  version: number,
): Promise<void> {
  await db.runAsync(
    "UPDATE schema_version SET version = ?, updatedAt = ? WHERE id = 1",
    [version, Date.now()],
  );
}

/**
 * Run all registered migrations up to CURRENT_SCHEMA_VERSION.
 *
 * The stored schema_version is informational only and is NOT used to decide
 * which migrations to skip - every migration's `up()` is idempotent (see
 * addColumnIfNotExists above), so it's always safe to re-run all of them.
 * This makes startup self-healing if the stored version is ever wrong (for
 * example an install that predates version tracking, or a migration that
 * previously failed to actually apply its schema change).
 *
 * Returns the number of migrations evaluated.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  const applicableMigrations = migrations
    .filter((m) => m.version <= CURRENT_SCHEMA_VERSION)
    .sort((a, b) => a.version - b.version);

  for (const migration of applicableMigrations) {
    await migration.up(db);
  }

  await setSchemaVersion(db, CURRENT_SCHEMA_VERSION);
  return applicableMigrations.length;
}

/**
 * Validate that a database file has the expected schema
 * Returns true if valid, false otherwise
 */
export async function validateSchema(db: SQLiteDatabase): Promise<boolean> {
  try {
    // Check that all expected tables exist
    const expectedTables = [
      "schema_version",
      "exercise_definitions",
      "exercises",
      "sets",
      "templates",
      "template_exercises",
      "body_measurements",
    ];

    for (const table of expectedTables) {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
        [table],
      );
      if (!result || result.count === 0) {
        console.error(`[Schema] Missing table: ${table}`);
        return false;
      }
    }

    // Check schema version
    const version = await getCurrentSchemaVersion(db);
    if (version !== CURRENT_SCHEMA_VERSION) {
      console.warn(
        `[Schema] Version mismatch: expected ${CURRENT_SCHEMA_VERSION}, got ${version}`,
      );
      // Not necessarily invalid, just needs migration
    }

    return true;
  } catch (error) {
    console.error("[Schema] Validation failed:", error);
    return false;
  }
}
