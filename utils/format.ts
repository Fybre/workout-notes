import type { ExerciseType, Set } from "@/types";
import { kgToLbs, formatWeight, formatDistance } from "./units";

/**
 * Format seconds into a human-readable duration string
 */
export function formatTime(seconds: number): string {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

/**
 * Format a set for display based on exercise type
 * Weight is always stored in kg, converted to user's unit for display
 */
export function formatSetForDisplay(
  exerciseType: ExerciseType,
  set: Partial<Set>,
  options?: { weightUnit?: "kg" | "lbs"; distanceUnit?: "km" | "miles" }
): string {
  const weightUnit = options?.weightUnit ?? "kg";
  const distanceUnit = options?.distanceUnit ?? "km";

  // Helper to format weight in user's unit
  const formatWeightValue = (kg: number | undefined | null): string => {
    if (kg === undefined || kg === null) return "0";
    if (weightUnit === "lbs") {
      return kgToLbs(kg).toFixed(1);
    }
    return kg.toFixed(1);
  };

  // Helper to format distance in user's unit
  const formatDistanceValue = (km: number | undefined | null): string => {
    if (km === undefined || km === null) return "0";
    if (distanceUnit === "miles") {
      return (km * 0.621371).toFixed(2);
    }
    return km.toFixed(2);
  };

  switch (exerciseType) {
    case "weight_reps":
      return `${formatWeightValue(set.weight)} ${weightUnit} × ${set.reps}`;
    case "distance_time":
      return `${formatDistanceValue(set.distance)}${distanceUnit === "km" ? "km" : "mi"} in ${formatTime(set.time ?? 0)}`;
    case "weight_distance":
      return `${formatWeightValue(set.weight)} ${weightUnit} × ${formatDistanceValue(set.distance)} ${distanceUnit === "km" ? "km" : "mi"}`;
    case "weight_time":
      return `${formatWeightValue(set.weight)} ${weightUnit} for ${formatTime(set.time ?? 0)}`;
    case "reps_distance":
      return `${set.reps} × ${formatDistanceValue(set.distance)} ${distanceUnit === "km" ? "km" : "mi"}`;
    case "reps_time":
      return `${set.reps} in ${formatTime(set.time ?? 0)}`;
    case "weight":
      return `${formatWeightValue(set.weight)} ${weightUnit}`;
    case "reps":
      return `${set.reps}`;
    case "distance":
      return `${formatDistanceValue(set.distance)} ${distanceUnit === "km" ? "km" : "mi"}`;
    case "time_duration":
    case "time_speed":
      return formatTime(set.time ?? 0);
    default:
      return "Unknown format";
  }
}

/**
 * Get the fields required for a given exercise type
 */
export function getExerciseTypeFields(exerciseType: ExerciseType): {
  weight: boolean;
  reps: boolean;
  distance: boolean;
  time: boolean;
} {
  return {
    weight: exerciseType.includes("weight"),
    reps: exerciseType.includes("reps"),
    distance: exerciseType.includes("distance"),
    time: exerciseType.includes("time"),
  };
}

/**
 * Validate a set based on exercise type
 */
export function validateSet(
  exerciseType: ExerciseType,
  set: { weight?: number; reps?: number; distance?: number; time?: number },
): boolean {
  const fields = getExerciseTypeFields(exerciseType);
  return (
    (!fields.weight || (set.weight ?? 0) > 0) &&
    (!fields.reps || (set.reps ?? 0) > 0) &&
    (!fields.distance || (set.distance ?? 0) > 0) &&
    (!fields.time || (set.time ?? 0) > 0)
  );
}

/**
 * Calculate estimated 1RM using the Epley formula
 * Formula: 1RM = weight × (1 + reps/30)
 * Only valid for reps between 1 and 10 (becomes less accurate above 10)
 */
export function calculateOneRepMax(weight: number, reps: number): number | null {
  // Only calculate for valid range (1-10 reps)
  if (reps < 1 || reps > 10 || weight <= 0) {
    return null;
  }
  // If actually did 1 rep, that's the 1RM
  if (reps === 1) {
    return weight;
  }
  return weight * (1 + reps / 30);
}

/**
 * Format 1RM value for display
 */
export function formatOneRepMax(oneRM: number | null, weightUnit: "kg" | "lbs" = "kg"): string {
  if (oneRM === null) return "N/A";
  if (weightUnit === "lbs") {
    return `${kgToLbs(oneRM).toFixed(1)} lbs`;
  }
  return `${oneRM.toFixed(1)} kg`;
}
