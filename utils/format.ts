import type { ExerciseType, Set } from "@/types";

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
 */
export function formatSetForDisplay(
  exerciseType: ExerciseType,
  set: Partial<Set>,
): string {
  switch (exerciseType) {
    case "weight_reps":
      return `${set.weight} kg × ${set.reps}`;
    case "distance_time":
      return `${set.distance}km in ${formatTime(set.time ?? 0)}`;
    case "weight_distance":
      return `${set.weight} kg × ${set.distance} km`;
    case "weight_time":
      return `${set.weight} kg for ${formatTime(set.time ?? 0)}`;
    case "reps_distance":
      return `${set.reps} × ${set.distance} km`;
    case "reps_time":
      return `${set.reps} in ${formatTime(set.time ?? 0)}`;
    case "weight":
      return `${set.weight} kg`;
    case "reps":
      return `${set.reps}`;
    case "distance":
      return `${set.distance} km`;
    case "time":
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
