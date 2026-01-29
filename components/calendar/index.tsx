/**
 * Calendar Screen - Main Entry Point
 * Provides view switching between Calendar, Agenda, and Charts
 */

import { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import Colors from "@/constants/Colors";
import type { ViewMode } from "./types";
import { useCalendarData } from "./hooks/useCalendarData";
import { CalendarView } from "./CalendarView";
import { AgendaView } from "./AgendaView";
import { ChartsView } from "./ChartsView";

const VIEW_BUTTONS: { key: ViewMode; label: string; icon: string }[] = [
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "agenda", label: "Agenda", icon: "list" },
  { key: "charts", label: "Charts", icon: "bar-chart" },
];

export default function CalendarScreen() {
  const router = useRouter();
  const { effectiveColorScheme } = useTheme();
  const theme = effectiveColorScheme;
  const colors = Colors[theme];
  const {
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    markedDates,
    groupedExercises,
    isLoading,
    showEmptyDays,
    toggleEmptyDays,
    hasMoreData,
    handleLoadMore,
    chartPeriod,
    setChartPeriod,
    chartMetric,
    setChartMetric,
    chartData,
    exerciseHistory,
    selectedExercises,
    showExercisePicker,
    availableExercises,
    addExerciseToChart,
    removeExerciseFromChart,
    clearAllExercises,
    setShowExercisePicker,
    refresh,
  } = useCalendarData();

  const onDayPress = useCallback((day: { dateString: string }) => {
    // Navigate back to home screen with the selected date
    router.navigate({
      pathname: "/",
      params: { date: day.dateString },
    });
  }, [router]);

  const onMonthChange = useCallback((month: { year: number; month: number }) => {
    const monthStr = month.month.toString().padStart(2, "0");
    setCurrentMonth(`${month.year}-${monthStr}-01`);
  }, [setCurrentMonth]);

  const closeCalendar = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={closeCalendar} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.viewSwitch}>
          {VIEW_BUTTONS.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.viewButton,
                viewMode === key && { backgroundColor: colors.tint },
              ]}
              onPress={() => setViewMode(key)}
            >
              <FontAwesome
                name={icon as any}
                size={14}
                color={viewMode === key ? "#fff" : colors.text}
                style={styles.viewIcon}
              />
              <Text
                style={[
                  styles.viewButtonText,
                  { color: viewMode === key ? "#fff" : colors.text },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      {viewMode === "calendar" && (
        <CalendarView
          selectedDate={selectedDate}
          markedDates={markedDates}
          colors={colors}
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
        />
      )}

      {viewMode === "agenda" && (
        <AgendaView
          selectedDate={selectedDate}
          groupedExercises={groupedExercises}
          isLoading={isLoading}
          showEmptyDays={showEmptyDays}
          hasMoreData={hasMoreData}
          colors={colors}
          onToggleEmptyDays={toggleEmptyDays}
          onSelectDate={(date) => {
            router.navigate({
              pathname: "/",
              params: { date },
            });
          }}
          onExercisePress={(exercise) => {
            // Navigate to home with the date, then open enter-exercise
            router.navigate({
              pathname: "/",
              params: { date: exercise.date },
            });
            // Small delay to ensure navigation completes before opening modal
            setTimeout(() => {
              router.push({
                pathname: "/enter-exercise",
                params: {
                  exerciseId: exercise.id,
                  exerciseName: exercise.name,
                  exerciseType: exercise.type,
                  date: exercise.date,
                  mode: "edit",
                },
              });
            }, 100);
          }}
          onRefresh={refresh}
          onLoadMore={handleLoadMore}
        />
      )}

      {viewMode === "charts" && (
        <ChartsView
          chartPeriod={chartPeriod}
          chartMetric={chartMetric}
          chartData={chartData}
          exerciseHistory={exerciseHistory}
          selectedExercises={selectedExercises}
          availableExercises={availableExercises}
          showExercisePicker={showExercisePicker}
          colors={colors}
          onPeriodChange={setChartPeriod}
          onMetricChange={setChartMetric}
          onAddExercise={addExerciseToChart}
          onRemoveExercise={removeExerciseFromChart}
          onClearAllExercises={clearAllExercises}
          onToggleExercisePicker={setShowExercisePicker}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  viewSwitch: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  viewIcon: {
    marginRight: 6,
  },
  divider: {
    height: 1,
    marginTop: 16,
    marginHorizontal: -16,
  },
});
