/**
 * CSV Export functionality for workout data
 * Exports all exercise data to CSV format for use in Excel/other apps
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getDatabase } from "./database";

/**
 * Export result type
 */
export interface ExportResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  recordCount?: number;
  error?: string;
}

/**
 * CSV row data structure
 */
interface CsvRow {
  date: string;
  exerciseName: string;
  category: string;
  type: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  distance?: number;
  time?: number;
  timeFormatted?: string;
}

/**
 * Escape a CSV field to handle commas, quotes, and newlines
 */
function escapeCsvField(field: string | number | undefined): string {
  if (field === undefined || field === null) return "";
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format time in seconds to readable format (e.g., "1:30" for 90 seconds)
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get exercise type display name
 */
function getExerciseTypeDisplay(type: string): string {
  const typeMap: Record<string, string> = {
    weight_reps: "Weight & Reps",
    weight: "Weight Only",
    reps: "Reps Only",
    distance: "Distance Only",
    time_duration: "Duration",
    time_speed: "Time Trial",
    distance_time: "Distance & Time",
    weight_time: "Weight & Time",
    reps_time: "Reps & Time",
    weight_distance: "Weight & Distance",
    reps_distance: "Reps & Distance",
  };
  return typeMap[type] || type;
}

/**
 * Fetch all exercise data for CSV export
 */
async function fetchAllExerciseData(): Promise<CsvRow[]> {
  const db = getDatabase();

  // Query all exercises with their sets and definitions
  const results = await db.getAllAsync<{
    date: string;
    exerciseName: string;
    category: string;
    type: string;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    time: number | null;
    timestamp: number;
  }>(
    `SELECT 
      e.date,
      ed.name as exerciseName,
      ed.category,
      ed.type,
      s.weight,
      s.reps,
      s.distance,
      s.time,
      s.timestamp
    FROM exercises e
    JOIN exercise_definitions ed ON e.definitionId = ed.id
    LEFT JOIN sets s ON e.id = s.exerciseId
    ORDER BY e.date DESC, ed.name ASC, s.timestamp ASC`
  );

  // Group by exercise instance to assign set numbers
  const rows: CsvRow[] = [];
  let currentExerciseKey = "";
  let setNumber = 0;

  for (const row of results) {
    const exerciseKey = `${row.date}-${row.exerciseName}`;
    
    if (exerciseKey !== currentExerciseKey) {
      currentExerciseKey = exerciseKey;
      setNumber = 1;
    } else {
      setNumber++;
    }

    // Skip exercises with no sets
    if (row.weight === null && row.reps === null && row.distance === null && row.time === null) {
      continue;
    }

    rows.push({
      date: row.date,
      exerciseName: row.exerciseName,
      category: row.category,
      type: getExerciseTypeDisplay(row.type),
      setNumber,
      weight: row.weight ?? undefined,
      reps: row.reps ?? undefined,
      distance: row.distance ?? undefined,
      time: row.time ?? undefined,
      timeFormatted: row.time ? formatTime(row.time) : undefined,
    });
  }

  return rows;
}

/**
 * Generate CSV content from exercise data
 */
function generateCsvContent(rows: CsvRow[]): string {
  // CSV Header
  const headers = [
    "Date",
    "Exercise",
    "Category",
    "Type",
    "Set #",
    "Weight",
    "Reps",
    "Distance",
    "Time (seconds)",
    "Time (formatted)",
  ];

  let csv = headers.map(escapeCsvField).join(",") + "\n";

  // Data rows
  for (const row of rows) {
    const fields = [
      row.date,
      row.exerciseName,
      row.category,
      row.type,
      row.setNumber,
      row.weight,
      row.reps,
      row.distance,
      row.time,
      row.timeFormatted,
    ];
    csv += fields.map(escapeCsvField).join(",") + "\n";
  }

  return csv;
}

/**
 * Export all workout data to CSV file
 */
export async function exportToCsv(): Promise<ExportResult> {
  try {
    console.log("[Export] Starting CSV export...");

    // Fetch all data
    const data = await fetchAllExerciseData();
    
    if (data.length === 0) {
      return {
        success: false,
        error: "No workout data to export",
      };
    }

    console.log(`[Export] Fetched ${data.length} records`);

    // Generate CSV content
    const csvContent = generateCsvContent(data);

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `workout-export-${timestamp}.csv`;
    const filePath = FileSystem.cacheDirectory + fileName;

    // Write to file
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    const fileSize = "size" in fileInfo ? fileInfo.size ?? 0 : 0;

    console.log(`[Export] Created CSV: ${fileName} (${fileSize} bytes)`);

    return {
      success: true,
      fileUri: filePath,
      fileName,
      recordCount: data.length,
    };
  } catch (error) {
    console.error("[Export] CSV export failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Share the exported CSV file
 */
export async function shareCsv(fileUri: string, fileName: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error("[Export] Sharing is not available on this device");
      return false;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Export Workout Data",
      UTI: "public.comma-separated-values-text", // iOS
    });

    return true;
  } catch (error) {
    console.error("[Export] Failed to share CSV:", error);
    return false;
  }
}

/**
 * Export and share CSV in one operation
 */
export async function exportAndShareCsv(): Promise<ExportResult> {
  const result = await exportToCsv();

  if (result.success && result.fileUri && result.fileName) {
    const shared = await shareCsv(result.fileUri, result.fileName);
    if (!shared) {
      return {
        ...result,
        error: "Export created but sharing failed",
      };
    }
  }

  return result;
}
