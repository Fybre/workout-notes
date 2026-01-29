/**
 * Types for calendar components
 */

import type { Set, ExerciseType } from "@/types/workout";
import Colors from "@/constants/Colors";

export type ThemeColors = typeof Colors.light;

export type ViewMode = "calendar" | "agenda" | "charts";
export type ChartPeriod = 1 | 30 | 90 | 180 | 365 | 0;
export type ChartMetric = "bestWeight" | "bestReps" | "totalVolume" | "bestTime" | "bestDistance";

export interface ExerciseWithSets {
  id: string;
  definitionId: string;
  name: string;
  type: string;
  date: string;
  createdAt: number;
  sets: Set[];
}

export interface DaySection {
  title: string;
  date: string;
  data: ExerciseWithSets[];
}

export interface ChartExercise {
  name: string;
  color: string;
}

export interface ChartDataPoint {
  date: string;
  bestWeight: number;
  bestReps: number;
  bestDistance: number;
  bestTime: number;
  totalVolume: number;
  setCount: number;
}

export const CHART_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
  "#F7DC6F", // Gold
];

export const PERIOD_DAYS: Record<ChartPeriod, number> = {
  1: 7,
  30: 30,
  90: 90,
  180: 180,
  365: 365,
  0: 365 * 10, // ~10 years (All Time)
};

// Storage keys
export const CALENDAR_VIEW_KEY = "@calendar_view_preference";
export const SHOW_EMPTY_DAYS_KEY = "@agenda_show_empty_days";
export const CHART_PERIOD_KEY = "@chart_period_preference";
export const CHART_EXERCISES_KEY = "@chart_exercises_preference";
