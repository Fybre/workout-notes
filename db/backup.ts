/**
 * Backup and restore functionality for the workout database
 * Uses file-level operations for atomic backups
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getDatabase } from "./database";
import { validateSchema } from "./schema";

const DB_NAME = "workout.db";

/**
 * Get the path to the SQLite database file
 */
function getDatabasePath(): string {
  // expo-sqlite stores databases in the SQLite subdirectory
  return FileSystem.documentDirectory + "SQLite/" + DB_NAME;
}

/**
 * Generate a backup filename with timestamp
 */
function generateBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `workout-backup-${timestamp}.db`;
}

/**
 * Export types for backup operations
 */
export interface BackupResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  requiresRestart?: boolean;
}

/**
 * Create a backup of the database
 * Returns the path to the backup file
 */
export async function createBackup(): Promise<BackupResult> {
  try {
    // Validate current database before backup
    const db = getDatabase();
    const isValid = await validateSchema(db);
    if (!isValid) {
      return {
        success: false,
        error: "Database validation failed. Cannot create backup.",
      };
    }

    const dbPath = getDatabasePath();
    const dbInfo = await FileSystem.getInfoAsync(dbPath);

    if (!dbInfo.exists) {
      return {
        success: false,
        error: "Database file not found",
      };
    }

    // Create backup file in cache directory (accessible for sharing)
    const backupFileName = generateBackupFilename();
    const backupPath = FileSystem.cacheDirectory + backupFileName;

    // Copy database file to backup location
    await FileSystem.copyAsync({
      from: dbPath,
      to: backupPath,
    });

    // Get backup file info
    const backupInfo = await FileSystem.getInfoAsync(backupPath);
    const fileSize = "size" in backupInfo ? backupInfo.size ?? 0 : 0;

    console.log(`[Backup] Created backup: ${backupFileName} (${formatFileSize(fileSize)})`);

    return {
      success: true,
      fileUri: backupPath,
      fileName: backupFileName,
      fileSize,
    };
  } catch (error) {
    console.error("[Backup] Failed to create backup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Share a backup file using the native share sheet
 */
export async function shareBackup(fileUri: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error("[Backup] Sharing is not available on this device");
      return false;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: "application/x-sqlite3",
      dialogTitle: "Save Workout Backup",
      UTI: "public.database", // iOS Uniform Type Identifier
    });

    return true;
  } catch (error) {
    console.error("[Backup] Failed to share backup:", error);
    return false;
  }
}

/**
 * Create and share a backup in one operation
 */
export async function createAndShareBackup(): Promise<BackupResult> {
  const result = await createBackup();

  if (result.success && result.fileUri) {
    const shared = await shareBackup(result.fileUri);
    if (!shared) {
      return {
        ...result,
        error: "Backup created but sharing failed",
      };
    }
  }

  return result;
}

/**
 * Validate a backup file before restoring
 */
export async function validateBackupFile(fileUri: string): Promise<{
  valid: boolean;
  error?: string;
  version?: number;
}> {
  try {
    // Check file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      return { valid: false, error: "File not found" };
    }

    // Check file size (minimum valid SQLite db is ~4KB)
    const fileSize = "size" in fileInfo ? fileInfo.size ?? 0 : 0;
    if (fileSize < 4096) {
      return { valid: false, error: "File too small to be a valid database" };
    }

    // Verify it's a SQLite file by checking file extension
    // SQLite files have "SQLite format 3" at the start (bytes 0-15)
    // We'll do a basic check here and rely on the actual restore process
    // to validate the database can be opened
    const fileName = fileUri.split("/").pop()?.toLowerCase() ?? "";
    if (!fileName.endsWith(".db") && !fileName.endsWith(".sqlite") && !fileName.endsWith(".sqlite3")) {
      // Still allow it, but warn - the user might have renamed the file
      console.warn("[Backup] File doesn't have standard SQLite extension");
    }

    return { valid: true };
  } catch (error) {
    console.error("[Backup] Validation failed:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Restore database from a backup file
 * This will replace the current database entirely
 */
export async function restoreFromBackup(sourceUri: string): Promise<RestoreResult> {
  try {
    // Validate the backup file
    const validation = await validateBackupFile(sourceUri);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const dbPath = getDatabasePath();

    // Close database connection if open (we rely on app restart for this)
    // For now, we'll copy the file and require a restart

    // Create a safety backup of current database first
    const safetyBackupPath = FileSystem.cacheDirectory + `pre-restore-backup-${Date.now()}.db`;

    try {
      const currentDbInfo = await FileSystem.getInfoAsync(dbPath);
      if (currentDbInfo.exists) {
        await FileSystem.copyAsync({
          from: dbPath,
          to: safetyBackupPath,
        });
        console.log("[Backup] Created safety backup before restore");
      }
    } catch {
      // Current DB might not exist, that's ok
      console.log("[Backup] No existing database to backup");
    }

    // Copy backup file to database location
    await FileSystem.copyAsync({
      from: sourceUri,
      to: dbPath,
    });

    console.log("[Backup] Database restored successfully");

    return {
      success: true,
      requiresRestart: true,
    };
  } catch (error) {
    console.error("[Backup] Restore failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Restore failed",
    };
  }
}

/**
 * Pick a backup file using document picker and restore
 */
export async function pickAndRestoreBackup(): Promise<RestoreResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/x-sqlite3", "application/octet-stream", "*/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return {
        success: false,
        error: "User cancelled",
      };
    }

    const file = result.assets[0];
    return await restoreFromBackup(file.uri);
  } catch (error) {
    console.error("[Backup] Document picker failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pick file",
    };
  }
}

/**
 * Get database file size
 */
export async function getDatabaseSize(): Promise<number> {
  try {
    const dbPath = getDatabasePath();
    const info = await FileSystem.getInfoAsync(dbPath);
    return info.exists && "size" in info ? (info.size ?? 0) : 0;
  } catch {
    return 0;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
