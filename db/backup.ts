/**
 * Backup and restore functionality for the workout database.
 *
 * A backup is a zip bundle containing:
 *  - workout.db        the SQLite database
 *  - media/*            exercise photo/video files
 *  - settings.json      AsyncStorage app settings (only if the user opts in)
 *  - manifest.json      bundle metadata (version, hasSettings, createdAt)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";

import { getDatabase } from "./database";
import { CURRENT_SCHEMA_VERSION, getCurrentSchemaVersion, validateSchema } from "./schema";
import { MEDIA_DIR_NAME } from "@/utils/media";

const DB_NAME = "workout.db";
const MANIFEST_VERSION = 1;

// AsyncStorage keys that make up "app settings" - keep this list in sync
// with any new persisted preference added elsewhere in the app.
const SETTINGS_KEYS = [
  "@app_theme_preference",
  "@weight_unit_preference",
  "@distance_unit_preference",
  "@weight_increment_preference",
  "@rest_timer_settings",
  "@select_exercise_show_only_used",
];

function getDatabasePath(): string {
  return FileSystem.documentDirectory + "SQLite/" + DB_NAME;
}

function getMediaDirectoryPath(): string {
  return FileSystem.documentDirectory + MEDIA_DIR_NAME + "/";
}

function generateBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `workout-backup-${timestamp}.zip`;
}

export interface BackupResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  fileSize?: number;
  includesSettings?: boolean;
  error?: string;
}

export interface PickedBackup {
  uri: string;
  fileName: string;
  hasSettings: boolean;
  schemaVersion: number | null;
  isNewerThanApp: boolean;
}

export interface PickBackupResult {
  success: boolean;
  backup?: PickedBackup;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  requiresRestart?: boolean;
}

/**
 * Create a zip backup bundle containing the database, exercise media files,
 * and (if requested) app settings from AsyncStorage.
 */
export async function createBackup(
  includeSettings: boolean,
): Promise<BackupResult> {
  try {
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
      return { success: false, error: "Database file not found" };
    }

    const zip = new JSZip();

    const dbBase64 = await FileSystem.readAsStringAsync(dbPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    zip.file(DB_NAME, dbBase64, { base64: true });

    // Bundle exercise media files, if any
    const mediaDirPath = getMediaDirectoryPath();
    const mediaDirInfo = await FileSystem.getInfoAsync(mediaDirPath);
    let hasMedia = false;
    if (mediaDirInfo.exists) {
      const filenames = await FileSystem.readDirectoryAsync(mediaDirPath);
      for (const filename of filenames) {
        const fileBase64 = await FileSystem.readAsStringAsync(
          mediaDirPath + filename,
          { encoding: FileSystem.EncodingType.Base64 },
        );
        zip.file(`media/${filename}`, fileBase64, { base64: true });
        hasMedia = true;
      }
    }

    if (includeSettings) {
      const entries = await AsyncStorage.multiGet(SETTINGS_KEYS);
      const settings: Record<string, string> = {};
      for (const [key, value] of entries) {
        if (value !== null) settings[key] = value;
      }
      zip.file("settings.json", JSON.stringify(settings));
    }

    const manifest = {
      version: MANIFEST_VERSION,
      schemaVersion: await getCurrentSchemaVersion(db),
      createdAt: Date.now(),
      hasSettings: includeSettings,
      hasMedia,
    };
    zip.file("manifest.json", JSON.stringify(manifest));

    const zipBase64 = await zip.generateAsync({
      type: "base64",
      compression: "DEFLATE",
    });

    const backupFileName = generateBackupFilename();
    const backupPath = FileSystem.cacheDirectory + backupFileName;
    await FileSystem.writeAsStringAsync(backupPath, zipBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const backupInfo = await FileSystem.getInfoAsync(backupPath);
    const fileSize = "size" in backupInfo ? backupInfo.size ?? 0 : 0;

    return {
      success: true,
      fileUri: backupPath,
      fileName: backupFileName,
      fileSize,
      includesSettings: includeSettings,
    };
  } catch (error) {
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
      return false;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: "application/zip",
      dialogTitle: "Save Workout Backup",
      UTI: "public.zip-archive",
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create and share a backup in one operation
 */
export async function createAndShareBackup(
  includeSettings: boolean,
): Promise<BackupResult> {
  const result = await createBackup(includeSettings);

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
 * Let the user pick a backup file and inspect it (without restoring yet) so
 * the caller can ask whether to also restore settings if the bundle has any.
 */
export async function pickBackupFile(): Promise<PickBackupResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/zip", "application/x-zip-compressed", "*/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, error: "User cancelled" };
    }

    const file = result.assets[0];

    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(base64, { base64: true });
    } catch {
      return { success: false, error: "File is not a valid backup archive" };
    }

    const manifestEntry = zip.file("manifest.json");
    const dbEntry = zip.file(DB_NAME);
    if (!manifestEntry || !dbEntry) {
      return { success: false, error: "File is not a valid workout backup" };
    }

    let hasSettings = false;
    // Backups created before this field existed have no schema version on
    // record - treat that as "unknown", not "newer than this app"
    let schemaVersion: number | null = null;
    try {
      const manifest = JSON.parse(await manifestEntry.async("string"));
      hasSettings = !!manifest.hasSettings;
      if (typeof manifest.schemaVersion === "number") {
        schemaVersion = manifest.schemaVersion;
      }
    } catch {
      // Missing/corrupt manifest fields - fall back to unknown/no settings
    }

    return {
      success: true,
      backup: {
        uri: file.uri,
        fileName: file.name,
        hasSettings,
        schemaVersion,
        isNewerThanApp:
          schemaVersion !== null && schemaVersion > CURRENT_SCHEMA_VERSION,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pick file",
    };
  }
}

/**
 * Restore the database (and media, and optionally settings) from a backup
 * bundle previously inspected via pickBackupFile.
 */
export async function restoreFromBackup(
  sourceUri: string,
  restoreSettings: boolean,
): Promise<RestoreResult> {
  try {
    const base64 = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const zip = await JSZip.loadAsync(base64, { base64: true });

    const dbEntry = zip.file(DB_NAME);
    if (!dbEntry) {
      return { success: false, error: "Backup is missing the database" };
    }

    const dbPath = getDatabasePath();

    // Safety backup of the current database first
    try {
      const currentDbInfo = await FileSystem.getInfoAsync(dbPath);
      if (currentDbInfo.exists) {
        await FileSystem.copyAsync({
          from: dbPath,
          to: FileSystem.cacheDirectory + `pre-restore-backup-${Date.now()}.db`,
        });
      }
    } catch {
      // Current DB might not exist, that's ok
    }

    const dbBase64 = await dbEntry.async("base64");
    await FileSystem.writeAsStringAsync(dbPath, dbBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Restore media files, if the bundle has any
    const mediaDirPath = getMediaDirectoryPath();
    const mediaEntries = Object.values(zip.files).filter(
      (entry) => !entry.dir && entry.name.startsWith("media/"),
    );
    if (mediaEntries.length > 0) {
      const mediaDirInfo = await FileSystem.getInfoAsync(mediaDirPath);
      if (!mediaDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(mediaDirPath, {
          intermediates: true,
        });
      }
      for (const entry of mediaEntries) {
        const filename = entry.name.slice("media/".length);
        const fileBase64 = await entry.async("base64");
        await FileSystem.writeAsStringAsync(
          mediaDirPath + filename,
          fileBase64,
          { encoding: FileSystem.EncodingType.Base64 },
        );
      }
    }

    if (restoreSettings) {
      const settingsEntry = zip.file("settings.json");
      if (settingsEntry) {
        const settings = JSON.parse(await settingsEntry.async("string")) as Record<
          string,
          string
        >;
        const pairs: [string, string][] = Object.entries(settings);
        if (pairs.length > 0) {
          await AsyncStorage.multiSet(pairs);
        }
      }
    }

    return { success: true, requiresRestart: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Restore failed",
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
