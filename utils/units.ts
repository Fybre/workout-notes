/**
 * Unit conversion utilities for weight measurements
 * All weights are stored in kg in the database
 * User can choose to display/input in kg or lbs
 */

// Conversion constants (precise values)
const KG_TO_LBS = 2.2046226218;
const LBS_TO_KG = 0.45359237;

// Default increment for +/- buttons
export const DEFAULT_KG_INCREMENT = 5;
export const DEFAULT_LBS_INCREMENT = 5;

/**
 * Convert pounds to kilograms
 * Stores with 2 decimal places precision
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 100) / 100;
}

/**
 * Convert kilograms to pounds
 * Rounds to nearest 0.5 lbs for display (standard gym increment)
 */
export function kgToLbs(kg: number): number {
  return Math.round((kg * KG_TO_LBS) / 0.5) * 0.5;
}

/**
 * Format a weight for display with the specified unit
 */
export function formatWeight(
  kgValue: number,
  displayUnit: "kg" | "lbs",
  options?: { decimals?: number; includeUnit?: boolean }
): string {
  const { decimals, includeUnit = true } = options ?? {};

  let displayValue: number;

  if (displayUnit === "kg") {
    // For kg: use 1 decimal place by default
    const dec = decimals ?? 1;
    displayValue = Math.round(kgValue * Math.pow(10, dec)) / Math.pow(10, dec);
  } else {
    // For lbs: round to nearest 0.5 (standard gym plates)
    displayValue = kgToLbs(kgValue);
    if (decimals !== undefined) {
      displayValue =
        Math.round(displayValue * Math.pow(10, decimals)) /
        Math.pow(10, decimals);
    }
  }

  if (includeUnit) {
    return `${displayValue} ${displayUnit}`;
  }
  return String(displayValue);
}

/**
 * Convert distance units (km/miles)
 */
export function kmToMiles(km: number): number {
  return Math.round(km * 0.621371 * 100) / 100;
}

export function milesToKm(miles: number): number {
  return Math.round(miles * 1.609344 * 100) / 100;
}

/**
 * Format distance for display
 */
export function formatDistance(
  kmValue: number,
  displayUnit: "km" | "miles",
  options?: { decimals?: number; includeUnit?: boolean }
): string {
  const { decimals = 2, includeUnit = true } = options ?? {};

  const displayValue =
    displayUnit === "km"
      ? Math.round(kmValue * Math.pow(10, decimals)) / Math.pow(10, decimals)
      : Math.round(kmToMiles(kmValue) * Math.pow(10, decimals)) /
        Math.pow(10, decimals);

  if (includeUnit) {
    return `${displayValue} ${displayUnit}`;
  }
  return String(displayValue);
}

/**
 * Get unit preference storage key
 */
export const WEIGHT_UNIT_KEY = "@weight_unit_preference";
export const DISTANCE_UNIT_KEY = "@distance_unit_preference";
export const WEIGHT_INCREMENT_KEY = "@weight_increment_preference";

/**
 * Type for unit preferences
 */
export interface UnitPreferences {
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "miles";
  weightIncrement: number;
}

/**
 * Default unit preferences
 */
export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  weightUnit: "kg",
  distanceUnit: "km",
  weightIncrement: DEFAULT_KG_INCREMENT,
};
