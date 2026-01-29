/**
 * Centralized date utilities for the workout app.
 *
 * All dates in the app are handled as ISO date strings ("YYYY-MM-DD") in local timezone.
 * This avoids timezone issues that can occur when using Date objects directly.
 */

/**
 * Get today's date as an ISO date string (YYYY-MM-DD) in local timezone.
 * Uses local date components directly to avoid UTC shifts.
 */
export function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to an ISO date string (YYYY-MM-DD) in local timezone.
 * Uses local date components directly to avoid UTC shifts.
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse an ISO date string (YYYY-MM-DD) to a Date object.
 * Creates a date at midnight in local timezone.
 */
export function fromDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Month is 0-indexed in Date constructor
  return new Date(year, month - 1, day);
}

/**
 * Add/subtract days from a date string and return a new date string.
 * @param dateStr - The base date string (YYYY-MM-DD)
 * @param days - Number of days to add (negative to subtract)
 */
export function addDays(dateStr: string, days: number): string {
  const date = fromDateString(dateStr);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/**
 * Check if a date string represents today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

/**
 * Check if two date strings represent the same date.
 */
export function isSameDate(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2;
}

/**
 * Format a date string for display in the UI.
 * Example: "Wed, Jan 28, 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  const date = fromDateString(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get a date range for calendar queries (current month ± buffer months).
 * Returns { start, end } date strings for database queries.
 */
export function getCalendarDateRange(
  monthDateStr: string,
  bufferMonths: number = 1,
): { start: string; end: string } {
  const date = fromDateString(monthDateStr);

  const start = new Date(date.getFullYear(), date.getMonth() - bufferMonths, 1);
  const end = new Date(date.getFullYear(), date.getMonth() + bufferMonths + 1, 0);

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

/**
 * Parse a date parameter from URL search params.
 * Returns the provided date if valid, otherwise returns today.
 */
export function parseDateParam(param: string | undefined): string {
  if (!param) return getToday();

  // Validate the format (YYYY-MM-DD)
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(param)) return getToday();

  return param;
}
