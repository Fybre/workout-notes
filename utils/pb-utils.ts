/**
 * Personal Best (PB) utility functions
 * Centralizes exercise comparison logic for PB detection
 */

import type { ExerciseType, Set } from "@/types/workout";

interface SetData {
  weight?: number;
  reps?: number;
  distance?: number;
  time?: number;
}

/**
 * Compare two sets and return positive if 'a' is better than 'b'
 * Based on exercise type comparison rules
 */
export function compareSets(
  a: SetData,
  b: SetData,
  exerciseType: ExerciseType
): number {
  switch (exerciseType) {
    case "weight_reps":
      // Primary: weight (max), Tiebreaker: reps (max)
      if ((a.weight ?? 0) !== (b.weight ?? 0)) {
        return (a.weight ?? 0) - (b.weight ?? 0);
      }
      return (a.reps ?? 0) - (b.reps ?? 0);

    case "weight":
      return (a.weight ?? 0) - (b.weight ?? 0);

    case "reps":
      return (a.reps ?? 0) - (b.reps ?? 0);

    case "distance":
      return (a.distance ?? 0) - (b.distance ?? 0);

    case "time_duration":
      // Higher time is better (planks, holds)
      return (a.time ?? 0) - (b.time ?? 0);

    case "time_speed":
      // Lower time is better (sprints) - invert comparison
      return (b.time ?? Infinity) - (a.time ?? Infinity);

    case "distance_time":
      // Primary: distance (max), Tiebreaker: time (min - faster is better)
      if ((a.distance ?? 0) !== (b.distance ?? 0)) {
        return (a.distance ?? 0) - (b.distance ?? 0);
      }
      return (b.time ?? Infinity) - (a.time ?? Infinity);

    case "weight_time":
      // Primary: weight (max), Tiebreaker: time (min)
      if ((a.weight ?? 0) !== (b.weight ?? 0)) {
        return (a.weight ?? 0) - (b.weight ?? 0);
      }
      return (b.time ?? Infinity) - (a.time ?? Infinity);

    case "reps_time":
      // Primary: reps (max), Tiebreaker: time (min)
      if ((a.reps ?? 0) !== (b.reps ?? 0)) {
        return (a.reps ?? 0) - (b.reps ?? 0);
      }
      return (b.time ?? Infinity) - (a.time ?? Infinity);

    case "weight_distance":
      // Primary: weight (max), Tiebreaker: distance (max)
      if ((a.weight ?? 0) !== (b.weight ?? 0)) {
        return (a.weight ?? 0) - (b.weight ?? 0);
      }
      return (a.distance ?? 0) - (b.distance ?? 0);

    case "reps_distance":
      // Primary: reps (max), Tiebreaker: distance (max)
      if ((a.reps ?? 0) !== (b.reps ?? 0)) {
        return (a.reps ?? 0) - (b.reps ?? 0);
      }
      return (a.distance ?? 0) - (b.distance ?? 0);

    default:
      // Fallback: prefer higher weight, then reps
      if ((a.weight ?? 0) !== (b.weight ?? 0)) {
        return (a.weight ?? 0) - (b.weight ?? 0);
      }
      return (a.reps ?? 0) - (b.reps ?? 0);
  }
}

/**
 * Find the best set from an array of sets
 * Returns null if array is empty
 */
export function findBestSet(sets: SetData[], exerciseType: ExerciseType): SetData | null {
  if (sets.length === 0) return null;

  return sets.reduce((best, current) => {
    return compareSets(current, best, exerciseType) > 0 ? current : best;
  });
}

/**
 * Check if a new set is better than the current personal best
 * Returns true if newSet beats currentPB
 */
export function isNewPersonalBest(
  newSet: SetData,
  currentPB: SetData | null,
  exerciseType: ExerciseType
): boolean {
  if (!currentPB) return true; // First set is always a PB
  return compareSets(newSet, currentPB, exerciseType) > 0;
}

/**
 * Find the best set ID from today's sets
 * Used for highlighting the single best set in a workout
 */
export function findBestSetId(
  sets: Array<SetData & { id: string }>,
  exerciseType: ExerciseType
): string | null {
  if (sets.length === 0) return null;

  const bestSet = sets.reduce((best, current) => {
    return compareSets(current, best, exerciseType) > 0 ? current : best;
  });

  return bestSet.id;
}

/**
 * Get comparison description for exercise type
 * Useful for UI tooltips or info text
 */
export function getComparisonDescription(exerciseType: ExerciseType): string {
  switch (exerciseType) {
    case "weight_reps":
      return "Higher weight is better. If tied, higher reps wins.";
    case "weight":
      return "Higher weight is better.";
    case "reps":
      return "More reps is better.";
    case "distance":
      return "Longer distance is better.";
    case "distance_time":
      return "Longer distance is better. If tied, faster time wins.";
    case "weight_time":
      return "Heavier weight is better. If tied, shorter time wins.";
    case "reps_time":
      return "More reps is better. If tied, shorter time wins.";
    case "weight_distance":
      return "Heavier weight is better. If tied, longer distance wins.";
    case "reps_distance":
      return "More reps is better. If tied, longer distance wins.";
    case "time_duration":
      return "Longer duration is better (holds/planks).";
    case "time_speed":
      return "Faster time is better (sprints).";
    default:
      return "";
  }
}
