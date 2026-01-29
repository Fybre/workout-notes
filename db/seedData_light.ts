/**
 * Seed data for exercise definitions
 * This file contains the initial exercise definitions that are seeded into the database
 * when the application is first launched or when the database is reset.
 */

import { ExerciseType } from "@/types/workout";

interface ExerciseDefinition {
  id?: string;
  name: string;
  category: string;
  type: ExerciseType;
  unit: string;
  description: string;
}

/**
 * Initial exercise definitions to seed the database
 * Organized by category with Recent exercises first
 */
export const INITIAL_EXERCISE_DEFINITIONS: ExerciseDefinition[] = [
  // Chest
  {
    name: "Barbell Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Standard bench press with barbell",
  },
  {
    name: "Dumbbell Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Bench press with dumbbells",
  },
  {
    name: "Incline Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Bench press on incline bench",
  },
  {
    name: "Chest Fly Machine",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Machine-based chest fly",
  },
  {
    name: "Push-ups",
    category: "Chest",
    type: "reps",
    unit: "reps",
    description: "Bodyweight push-ups",
  },

  // Back
  {
    name: "Barbell Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Bent-over barbell rows",
  },
  {
    name: "Dumbbell Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Single-arm dumbbell rows",
  },
  {
    name: "Pull-ups",
    category: "Back",
    type: "reps",
    unit: "reps",
    description: "Bodyweight pull-ups",
  },
  {
    name: "Lat Pulldown",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Machine lat pulldown",
  },
  {
    name: "Deadlifts",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Conventional deadlifts",
  },

  // Shoulders
  {
    name: "Overhead Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Barbell overhead press",
  },
  {
    name: "Dumbbell Shoulder Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Seated dumbbell shoulder press",
  },
  {
    name: "Lateral Raises",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Dumbbell lateral raises",
  },
  {
    name: "Face Pulls",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Cable face pulls",
  },

  // Legs
  {
    name: "Barbell Squat",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Standard back squat",
  },
  {
    name: "Leg Press",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Machine leg press",
  },
  {
    name: "Leg Curl",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Seated leg curl machine",
  },
  {
    name: "Leg Extension",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Leg extension machine",
  },
  {
    name: "Lunges",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Bodyweight or weighted lunges",
  },

  // Arms
  {
    name: "Barbell Curl",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Standard barbell bicep curl",
  },
  {
    name: "Dumbbell Curl",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Dumbbell bicep curl",
  },
  {
    name: "Tricep Dips",
    category: "Arms",
    type: "reps",
    unit: "reps",
    description: "Bodyweight tricep dips",
  },
  {
    name: "Tricep Pushdown",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Cable tricep pushdown",
  },
  {
    name: "Hammer Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Neutral grip dumbbell curls",
  },
];
