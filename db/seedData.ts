/**
 * Seed data for exercise definitions
 * This file contains the initial exercise definitions that are seeded into the database
 * when the application is first launched or when the database is reset.
 */

import { ExerciseType } from "@/types/workout";

interface ExerciseDefinition {
  id: string;
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
  // Recent
  {
    id: "recent-1",
    name: "Bench Press",
    category: "Recent",
    type: "weight_reps",
    unit: "kg",
    description: "Recent exercise",
  },
  {
    id: "recent-2",
    name: "Incline Dumbbell Press",
    category: "Recent",
    type: "weight_reps",
    unit: "kg",
    description: "Recent exercise",
  },
  {
    id: "recent-3",
    name: "Barbell Squat",
    category: "Recent",
    type: "weight_reps",
    unit: "kg",
    description: "Recent exercise",
  },

  // Chest
  {
    id: "chest-1",
    name: "Barbell Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Standard bench press with barbell",
  },
  {
    id: "chest-2",
    name: "Dumbbell Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Bench press with dumbbells",
  },
  {
    id: "chest-3",
    name: "Incline Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Bench press on incline bench",
  },
  {
    id: "chest-4",
    name: "Chest Fly Machine",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description: "Machine-based chest fly",
  },
  {
    id: "chest-5",
    name: "Push-ups",
    category: "Chest",
    type: "reps",
    unit: "reps",
    description: "Bodyweight push-ups",
  },

  // Back
  {
    id: "back-1",
    name: "Barbell Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Bent-over barbell rows",
  },
  {
    id: "back-2",
    name: "Dumbbell Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Single-arm dumbbell rows",
  },
  {
    id: "back-3",
    name: "Pull-ups",
    category: "Back",
    type: "reps",
    unit: "reps",
    description: "Bodyweight pull-ups",
  },
  {
    id: "back-4",
    name: "Lat Pulldown",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Machine lat pulldown",
  },
  {
    id: "back-5",
    name: "Deadlifts",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description: "Conventional deadlifts",
  },

  // Shoulders
  {
    id: "shoulder-1",
    name: "Overhead Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Barbell overhead press",
  },
  {
    id: "shoulder-2",
    name: "Dumbbell Shoulder Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Seated dumbbell shoulder press",
  },
  {
    id: "shoulder-3",
    name: "Lateral Raises",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Dumbbell lateral raises",
  },
  {
    id: "shoulder-4",
    name: "Face Pulls",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description: "Cable face pulls",
  },

  // Legs
  {
    id: "legs-1",
    name: "Barbell Squat",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Standard back squat",
  },
  {
    id: "legs-2",
    name: "Leg Press",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Machine leg press",
  },
  {
    id: "legs-3",
    name: "Leg Curl",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Seated leg curl machine",
  },
  {
    id: "legs-4",
    name: "Leg Extension",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Leg extension machine",
  },
  {
    id: "legs-5",
    name: "Lunges",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description: "Bodyweight or weighted lunges",
  },

  // Arms
  {
    id: "arms-1",
    name: "Barbell Curl",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Standard barbell bicep curl",
  },
  {
    id: "arms-2",
    name: "Dumbbell Curl",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Dumbbell bicep curl",
  },
  {
    id: "arms-3",
    name: "Tricep Dips",
    category: "Arms",
    type: "reps",
    unit: "reps",
    description: "Bodyweight tricep dips",
  },
  {
    id: "arms-4",
    name: "Tricep Pushdown",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Cable tricep pushdown",
  },
  {
    id: "arms-5",
    name: "Hammer Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description: "Neutral grip dumbbell curls",
  },
];
