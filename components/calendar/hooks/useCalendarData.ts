/**
 * Shared data hook for calendar views
 * Manages data fetching and state for all calendar functionality
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  getDatesWithExercises,
  getAllExercisesWithSets,
  getUsedExercises,
  getExerciseHistoryForChart,
  getExerciseHistoryWithSetsInRange,
} from "@/db/database";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  getCalendarDateRange,
  getToday,
  formatDisplayDate,
  addDays,
} from "@/utils/date";
import type {
  ViewMode,
  ChartPeriod,
  ChartMetric,
  ExerciseWithSets,
  DaySection,
  ChartExercise,
  ChartDataPoint,
} from "../types";
import {
  CALENDAR_VIEW_KEY,
  SHOW_EMPTY_DAYS_KEY,
  CHART_PERIOD_KEY,
  CHART_EXERCISES_KEY,
  PERIOD_DAYS,
  CHART_COLORS,
} from "../types";

export function useCalendarData() {
  const { isReady: dbReady } = useDatabase();

  // View state
  const [viewMode, setViewModeState] = useState<ViewMode>("calendar");
  const [showEmptyDays, setShowEmptyDaysState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [currentMonth, setCurrentMonth] = useState(getToday().slice(0, 8) + "01"); // YYYY-MM-01 format
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  
  // Agenda state
  const [groupedExercises, setGroupedExercises] = useState<DaySection[]>([]);
  const [daysToShow, setDaysToShow] = useState(30);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  // Chart state
  const [chartPeriod, setChartPeriodState] = useState<ChartPeriod>(90);
  const [chartMetric, setChartMetricState] = useState<ChartMetric>("bestWeight");
  const [selectedExercises, setSelectedExercises] = useState<ChartExercise[]>([]);
  const [chartData, setChartData] = useState<Record<string, ChartDataPoint[]>>({});
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, { date: string; sets: import("@/types/workout").Set[] }[]>>({});
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<{ name: string; type: string }[]>([]);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [viewSaved, emptyDaysSaved, periodSaved, exercisesSaved] = await Promise.all([
          AsyncStorage.getItem(CALENDAR_VIEW_KEY),
          AsyncStorage.getItem(SHOW_EMPTY_DAYS_KEY),
          AsyncStorage.getItem(CHART_PERIOD_KEY),
          AsyncStorage.getItem(CHART_EXERCISES_KEY),
        ]);
        if (viewSaved) setViewModeState(JSON.parse(viewSaved));
        if (emptyDaysSaved) setShowEmptyDaysState(JSON.parse(emptyDaysSaved));
        if (periodSaved) setChartPeriodState(JSON.parse(periodSaved));
        if (exercisesSaved) setSelectedExercises(JSON.parse(exercisesSaved));
      } catch (error) {

      }
    };
    loadPreferences();
  }, []);

  // Save view mode
  const setViewMode = useCallback(async (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      await AsyncStorage.setItem(CALENDAR_VIEW_KEY, JSON.stringify(mode));
    } catch (error) {

    }
  }, []);

  // Toggle empty days
  const toggleEmptyDays = useCallback(async () => {
    const newValue = !showEmptyDays;
    setShowEmptyDaysState(newValue);
    try {
      await AsyncStorage.setItem(SHOW_EMPTY_DAYS_KEY, JSON.stringify(newValue));
    } catch (error) {

    }
  }, [showEmptyDays]);

  // Load more data for agenda
  const handleLoadMore = useCallback(() => {
    if (hasMoreData) {
      setDaysToShow((prev) => prev + 30);
    }
  }, [hasMoreData]);

  // Set chart period
  const setChartPeriod = useCallback(async (period: ChartPeriod) => {
    setChartPeriodState(period);
    try {
      await AsyncStorage.setItem(CHART_PERIOD_KEY, JSON.stringify(period));
    } catch (error) {

    }
  }, []);

  // Add exercise to chart
  const addExerciseToChart = useCallback(async (exerciseName: string) => {
    if (selectedExercises.find((e) => e.name === exerciseName)) return;

    const colorIndex = selectedExercises.length % CHART_COLORS.length;
    const newExercises = [...selectedExercises, { name: exerciseName, color: CHART_COLORS[colorIndex] }];
    setSelectedExercises(newExercises);
    try {
      await AsyncStorage.setItem(CHART_EXERCISES_KEY, JSON.stringify(newExercises));
    } catch (error) {

    }
  }, [selectedExercises]);

  // Remove exercise from chart
  const removeExerciseFromChart = useCallback(async (exerciseName: string) => {
    const newExercises = selectedExercises.filter((e) => e.name !== exerciseName);
    setSelectedExercises(newExercises);
    try {
      await AsyncStorage.setItem(CHART_EXERCISES_KEY, JSON.stringify(newExercises));
    } catch (error) {

    }
  }, [selectedExercises]);

  // Clear all exercises
  const clearAllExercises = useCallback(async () => {
    setSelectedExercises([]);
    setChartData({});
    setExerciseHistory({});
    try {
      await AsyncStorage.setItem(CHART_EXERCISES_KEY, JSON.stringify([]));
    } catch (error) {

    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    if (!dbReady) return;
    setIsLoading(true);
    
    try {
      // Load calendar marks
      const { start, end } = getCalendarDateRange(currentMonth, 1);
      const datesWithExercises = await getDatesWithExercises(start, end);

      const marked: Record<string, any> = {};
      for (const date of datesWithExercises) {
        marked[date] = { marked: true, dotColor: "#10b981" }; // Green dot for exercises
      }
      setMarkedDates(marked);

      // Load all exercises for agenda
      const exercises = await getAllExercisesWithSets();

      // Group by date for agenda
      const groupedByDate = new Map<string, ExerciseWithSets[]>();
      for (const exercise of exercises) {
        if (!groupedByDate.has(exercise.date)) {
          groupedByDate.set(exercise.date, []);
        }
        groupedByDate.get(exercise.date)!.push(exercise);
      }

      // Convert to sections
      const sections: DaySection[] = [];
      const sortedDates = Array.from(groupedByDate.keys()).sort().reverse();

      let datesToShow: string[];
      if (showEmptyDays && sortedDates.length > 0) {
        const today = getToday();
        const oldest = sortedDates[sortedDates.length - 1];
        const mostRecent = sortedDates[0] > today ? sortedDates[0] : today;
        const allDatesInRange: string[] = [];
        let currentDateStr = mostRecent;
        while (currentDateStr >= oldest) {
          allDatesInRange.push(currentDateStr);
          currentDateStr = addDays(currentDateStr, -1);
        }
        datesToShow = allDatesInRange.slice(0, daysToShow);
        setHasMoreData(allDatesInRange.length > daysToShow);
      } else {
        datesToShow = sortedDates.slice(0, daysToShow);
        setHasMoreData(sortedDates.length > daysToShow);
      }

      for (const date of datesToShow) {
        sections.push({
          title: formatDisplayDate(date),
          date,
          data: groupedByDate.get(date) || [],
        });
      }
      setGroupedExercises(sections);

      // Load available exercises for charts
      const usedExercises = await getUsedExercises();
      setAvailableExercises(usedExercises.map((e) => ({ name: e.name, type: e.type })));

      // Load chart data
      if (selectedExercises.length > 0) {
        const days = PERIOD_DAYS[chartPeriod];
        const endDate = getToday();
        const startDate = addDays(endDate, -days);
        
        const newChartData: Record<string, ChartDataPoint[]> = {};
        const newExerciseHistory: Record<string, { date: string; sets: import("@/types/workout").Set[] }[]> = {};

        for (const exercise of selectedExercises) {
          const [history, detailedHistory] = await Promise.all([
            getExerciseHistoryForChart(exercise.name, startDate, endDate),
            getExerciseHistoryWithSetsInRange(exercise.name, startDate, endDate),
          ]);
          newChartData[exercise.name] = history;
          newExerciseHistory[exercise.name] = detailedHistory;
        }
        setChartData(newChartData);
        setExerciseHistory(newExerciseHistory);
      } else {
        setExerciseHistory({});
      }
    } finally {
      setIsLoading(false);
    }
  }, [dbReady, currentMonth, daysToShow, showEmptyDays, selectedExercises, chartPeriod]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    // View state
    viewMode,
    setViewMode,
    showEmptyDays,
    toggleEmptyDays,
    isLoading,
    
    // Calendar
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    markedDates,
    
    // Agenda
    groupedExercises,
    daysToShow,
    hasMoreData,
    handleLoadMore,
    
    // Charts
    chartPeriod,
    setChartPeriod,
    chartMetric,
    setChartMetric: setChartMetricState,
    chartData,
    exerciseHistory,
    selectedExercises,
    availableExercises,
    showExercisePicker,
    setShowExercisePicker,
    addExerciseToChart,
    removeExerciseFromChart,
    clearAllExercises,
    
    // Actions
    refresh,
  };
}
