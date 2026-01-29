/**
 * Schema versioning and migration system
 * Manages database schema versions and runs migrations when needed
 */

import type { SQLiteDatabase } from "expo-sqlite";

// Current schema version - increment when making schema changes
export const CURRENT_SCHEMA_VERSION = 1;

// Migration function type
export type Migration = {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
};

// Migration registry - add new migrations here
export const migrations: Migration[] = [
  // Example migration for future schema changes:
  // {
  //   version: 2,
  //   name: "Add user_preferences table",
  //   up: async (db) => {
  //     await db.execAsync(`
  //       CREATE TABLE IF NOT EXISTS user_preferences (
  //         key TEXT PRIMARY KEY,
  //         value TEXT NOT NULL
  //       );
  //     `);
  //   },
  // },
];

/**
 * Initialize the schema version tracking table
 */
export async function initializeSchemaVersion(db: SQLiteDatabase): Promise<void> {
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
    // First run - insert current version
    await db.runAsync(
      "INSERT INTO schema_version (id, version, updatedAt) VALUES (?, ?, ?)",
      [1, CURRENT_SCHEMA_VERSION, Date.now()],
    );
    console.log(
      `[Schema] Initialized schema version to ${CURRENT_SCHEMA_VERSION}`,
    );
  }
}

/**
 * Get current schema version from database
 */
export async function getCurrentSchemaVersion(db: SQLiteDatabase): Promise<number> {
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
export async function setSchemaVersion(db: SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync(
    "UPDATE schema_version SET version = ?, updatedAt = ? WHERE id = 1",
    [version, Date.now()],
  );
}

/**
 * Run pending migrations
 * Returns the number of migrations applied
 */
export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  const currentVersion = await getCurrentSchemaVersion(db);

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    console.log(`[Schema] Database is up to date (version ${currentVersion})`);
    return 0;
  }

  // Find migrations to run (sorted by version)
  const pendingMigrations = migrations
    .filter((m) => m.version > currentVersion && m.version <= CURRENT_SCHEMA_VERSION)
    .sort((a, b) => a.version - b.version);

  if (pendingMigrations.length === 0 && currentVersion < CURRENT_SCHEMA_VERSION) {
    // No migrations defined but version needs to be bumped
    await setSchemaVersion(db, CURRENT_SCHEMA_VERSION);
    console.log(`[Schema] Bumped schema version to ${CURRENT_SCHEMA_VERSION}`);
    return 0;
  }

  for (const migration of pendingMigrations) {
    console.log(`[Schema] Running migration ${migration.version}: ${migration.name}`);

    try {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await setSchemaVersion(db, migration.version);
      });

      console.log(`[Schema] Migration ${migration.version} completed successfully`);
    } catch (error) {
      console.error(`[Schema] Migration ${migration.version} failed:`, error);
      throw new Error(
        `Migration ${migration.version} (${migration.name}) failed: ${error}`,
      );
    }
  }

  return pendingMigrations.length;
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
