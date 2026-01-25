/**
 * Workout data model types
 */

export type ExerciseType =
  | "weight_reps"
  | "distance_time"
  | "weight_distance"
  | "weight_time"
  | "reps_distance"
  | "reps_time"
  | "weight"
  | "reps"
  | "distance"
  | "time";

export interface Set {
  id: string;
  reps?: number;
  weight?: number;
  distance?: number;
  time?: number;
  timestamp: number;
}

export interface Exercise {
  id: string;
  definitionId: string;
  name: string;
  type: ExerciseType;
  sets: Set[];
  date: string; // ISO date: "2026-01-24"
  createdAt: number;
}

export interface Workout {
  date: string; // ISO date, unique key
  exercises: Exercise[];
}
