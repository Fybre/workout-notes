/**
 * Hook for date navigation in the workout app.
 *
 * Provides centralized date state management with navigation functions.
 * Works with Expo Router's URL params for state synchronization.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { addDays, getToday, parseDateParam } from "@/utils/date";

interface UseDateNavigationReturn {
  /** Current date as ISO string (YYYY-MM-DD) */
  date: string;
  /** Navigate to the previous day */
  goToPrevDay: () => void;
  /** Navigate to the next day */
  goToNextDay: () => void;
  /** Navigate to a specific date */
  goToDate: (dateStr: string) => void;
  /** Navigate to today */
  goToToday: () => void;
  /** Check if current date is today */
  isToday: boolean;
}

/**
 * Hook for managing date navigation with URL params.
 *
 * Usage:
 * ```tsx
 * const { date, goToPrevDay, goToNextDay, goToToday, isToday } = useDateNavigation();
 * ```
 */
export function useDateNavigation(): UseDateNavigationReturn {
  const router = useRouter();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  // Parse and memoize the current date
  const date = useMemo(() => parseDateParam(dateParam), [dateParam]);

  // Check if current date is today
  const isToday = useMemo(() => date === getToday(), [date]);

  // Navigate to previous day
  const goToPrevDay = useCallback(() => {
    const prevDate = addDays(date, -1);
    router.setParams({ date: prevDate });
  }, [date, router]);

  // Navigate to next day
  const goToNextDay = useCallback(() => {
    const nextDate = addDays(date, 1);
    router.setParams({ date: nextDate });
  }, [date, router]);

  // Navigate to a specific date
  const goToDate = useCallback(
    (dateStr: string) => {
      router.setParams({ date: dateStr });
    },
    [router],
  );

  // Navigate to today (clear date param)
  const goToToday = useCallback(() => {
    router.setParams({ date: undefined });
  }, [router]);

  return {
    date,
    goToPrevDay,
    goToNextDay,
    goToDate,
    goToToday,
    isToday,
  };
}

/**
 * Hook for getting the current date from URL params without navigation.
 * Useful when you only need to read the current date.
 *
 * Usage:
 * ```tsx
 * const date = useCurrentDate(); // Returns ISO date string (YYYY-MM-DD)
 * ```
 */
export function useCurrentDate(): string {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  return useMemo(() => parseDateParam(dateParam), [dateParam]);
}
