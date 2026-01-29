/**
 * Charts View Component
 * Displays progress charts with exercise history tables
 */

import { useMemo } from "react";
import { Dimensions, ScrollView, TouchableOpacity, StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LineChart } from "react-native-chart-kit";

import { Text } from "@/components/Themed";
import { useUnits } from "@/contexts/UnitContext";
import { formatDisplayDate } from "@/utils/date";
import type { ThemeColors } from "./types";
import type { ExerciseType, Set } from "@/types/workout";
import type { ChartExercise, ChartDataPoint, ChartPeriod, ChartMetric } from "./types";
import { PERIOD_DAYS } from "./types";
import { ExercisePickerModal } from "./ExercisePickerModal";

const screenWidth = Dimensions.get("window").width;

interface ChartsViewProps {
  chartPeriod: ChartPeriod;
  chartMetric: ChartMetric;
  chartData: Record<string, ChartDataPoint[]>;
  exerciseHistory: Record<string, { date: string; sets: Set[] }[]>;
  selectedExercises: ChartExercise[];
  availableExercises: { name: string; type: string }[];
  showExercisePicker: boolean;
  colors: ThemeColors;
  onPeriodChange: (period: ChartPeriod) => void;
  onMetricChange: (metric: ChartMetric) => void;
  onAddExercise: (name: string) => void;
  onRemoveExercise: (name: string) => void;
  onClearAllExercises: () => void;
  onToggleExercisePicker: (visible: boolean) => void;
}

export function ChartsView({
  chartPeriod,
  chartMetric,
  chartData,
  exerciseHistory,
  selectedExercises,
  availableExercises,
  showExercisePicker,
  colors,
  onPeriodChange,
  onMetricChange,
  onAddExercise,
  onRemoveExercise,
  onClearAllExercises,
  onToggleExercisePicker,
}: ChartsViewProps) {
  const { weightUnit, distanceUnit } = useUnits();

  const chartDataset = useMemo(() => {
    if (selectedExercises.length === 0 || Object.keys(chartData).length === 0) {
      return null;
    }

    const allDates = new Set<string>();
    for (const exercise of selectedExercises) {
      const history = chartData[exercise.name] || [];
      for (const point of history) {
        allDates.add(point.date);
      }
    }

    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length === 0) return null;

    const labelInterval = Math.ceil(sortedDates.length / 6);
    const labels = sortedDates.map((date, index) => {
      if (index % labelInterval === 0 || index === sortedDates.length - 1) {
        const d = new Date(date);
        // Use locale-specific date format (e.g., 29/1 for AU, 1/29 for US)
        return d.toLocaleDateString(undefined, { day: "numeric", month: "numeric" });
      }
      return "";
    });

    const datasets = selectedExercises.map((exercise) => {
      const history = chartData[exercise.name] || [];
      const dataMap = new Map(history.map((h) => [h.date, h]));

      const data: number[] = sortedDates.map((date) => {
        const point = dataMap.get(date);
        if (!point) return 0;
        return (point[chartMetric as keyof ChartDataPoint] as number) || 0;
      });

      return {
        data,
        color: () => exercise.color,
        strokeWidth: 2,
        withDots: true,
      };
    });

    return { labels, datasets, legend: selectedExercises.map((e) => e.name) };
  }, [selectedExercises, chartData, chartMetric]);

  const getMetricLabel = () => {
    switch (chartMetric) {
      case "bestWeight":
        return "Weight (kg)";
      case "bestReps":
        return "Reps";
      case "totalVolume":
        return "Volume (kg)";
      case "bestTime":
        return "Time (sec)";
      case "bestDistance":
        return "Distance (km)";
      default:
        return "";
    }
  };

  const getTableColumns = (exerciseType: ExerciseType) => {
    const cols: { key: string; label: string; flex: number }[] = [{ key: "date", label: "Date", flex: 2 }];

    switch (exerciseType) {
      case "weight_reps":
        cols.push({ key: "weight", label: `Weight (${weightUnit})`, flex: 2 }, { key: "reps", label: "Reps", flex: 1 });
        break;
      case "weight":
        cols.push({ key: "weight", label: `Weight (${weightUnit})`, flex: 2 });
        break;
      case "reps":
        cols.push({ key: "reps", label: "Reps", flex: 2 });
        break;
      case "distance":
        cols.push({ key: "distance", label: `Distance (${distanceUnit})`, flex: 2 });
        break;
      case "distance_time":
        cols.push({ key: "distance", label: `Distance (${distanceUnit})`, flex: 2 }, { key: "time", label: "Time", flex: 2 });
        break;
      case "weight_time":
        cols.push({ key: "weight", label: `Weight (${weightUnit})`, flex: 2 }, { key: "time", label: "Time", flex: 2 });
        break;
      case "reps_time":
        cols.push({ key: "reps", label: "Reps", flex: 1 }, { key: "time", label: "Time", flex: 2 });
        break;
      case "reps_distance":
        cols.push({ key: "reps", label: "Reps", flex: 1 }, { key: "distance", label: `Distance (${distanceUnit})`, flex: 2 });
        break;
      case "weight_distance":
        cols.push({ key: "weight", label: `Weight (${weightUnit})`, flex: 2 }, { key: "distance", label: `Distance (${distanceUnit})`, flex: 2 });
        break;
      case "time_duration":
      case "time_speed":
        cols.push({ key: "time", label: "Time", flex: 3 });
        break;
      default:
        cols.push({ key: "value", label: "Value", flex: 3 });
    }
    return cols;
  };

  const formatCellValue = (set: Set, columnKey: string): string => {
    switch (columnKey) {
      case "weight":
        if (set.weight === undefined) return "-";
        return weightUnit === "lbs" ? (set.weight * 2.20462).toFixed(1) : set.weight.toFixed(1);
      case "reps":
        return set.reps?.toString() ?? "-";
      case "distance":
        if (set.distance === undefined) return "-";
        return distanceUnit === "miles" ? (set.distance * 0.621371).toFixed(2) : set.distance.toFixed(2);
      case "time":
        if (set.time === undefined) return "-";
        const mins = Math.floor(set.time / 60);
        const secs = set.time % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
      default:
        return "-";
    }
  };

  const renderHistoryTable = (history: { date: string; sets: Set[] }[], exerciseType: ExerciseType, color: string) => {
    const columns = getTableColumns(exerciseType);

    return (
      <View style={styles.historyTable}>
        <View style={[styles.tableHeader, { backgroundColor: `${color}20`, borderBottomColor: color }]}>
          {columns.map((col) => (
            <Text key={col.key} style={[styles.tableHeaderCell, { color, flex: col.flex }]}>
              {col.label}
            </Text>
          ))}
        </View>
        {history.map((day, dayIndex) => (
          <View key={day.date}>
            {day.sets.map((set, setIndex) => (
              <View
                key={set.id}
                style={[
                  styles.tableRow,
                  dayIndex === history.length - 1 && setIndex === day.sets.length - 1 && styles.tableRowLast,
                  { 
                    borderBottomColor: `${color}30`,
                    backgroundColor: dayIndex % 2 === 0 ? "transparent" : `${color}18`,
                  },
                ]}
              >
                {columns.map((col) => (
                  <Text key={col.key} style={[styles.tableCell, { color: colors.text, flex: col.flex }]}>
                    {col.key === "date"
                      ? setIndex === 0 ? formatDisplayDate(day.date) : ""
                      : formatCellValue(set, col.key)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Selected Exercises Section */}
      <View style={styles.section}>
        <View style={styles.selectedExercisesHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Selected Exercises</Text>
          <View style={styles.exerciseActions}>
            {selectedExercises.length > 0 && (
              <TouchableOpacity style={[styles.clearChipInline, { borderColor: colors.error }]} onPress={onClearAllExercises}>
                <Text style={[styles.clearChipText, { color: colors.error }]}>Clear</Text>
              </TouchableOpacity>
            )}
            {selectedExercises.length < 5 && (
              <TouchableOpacity style={[styles.addChipInline, { borderColor: colors.tint }]} onPress={() => onToggleExercisePicker(true)}>
                <Text style={[styles.addChipText, { color: colors.tint }]}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseList}>
          {selectedExercises.map((ex) => (
            <View key={ex.name} style={[styles.exerciseChip, { backgroundColor: ex.color }]}>
              <Text style={styles.exerciseChipText}>{ex.name}</Text>
              <TouchableOpacity onPress={() => onRemoveExercise(ex.name)}>
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Progress Charts Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Progress Charts</Text>
        
        <View style={styles.controls}>
          <View style={[styles.controlGroup, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Picker selectedValue={chartPeriod} onValueChange={onPeriodChange} style={{ color: colors.text }} dropdownIconColor={colors.tint}>
              <Picker.Item label="1 Week" value={1} />
              <Picker.Item label="1 Month" value={30} />
              <Picker.Item label="3 Months" value={90} />
              <Picker.Item label="6 Months" value={180} />
              <Picker.Item label="1 Year" value={365} />
              <Picker.Item label="All Time" value={0} />
            </Picker>
          </View>
          <View style={[styles.controlGroup, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Picker selectedValue={chartMetric} onValueChange={onMetricChange} style={{ color: colors.text }} dropdownIconColor={colors.tint}>
              <Picker.Item label="Best Weight" value="bestWeight" />
              <Picker.Item label="Best Reps" value="bestReps" />
              <Picker.Item label="Total Volume" value="totalVolume" />
              <Picker.Item label="Best Time" value="bestTime" />
              <Picker.Item label="Best Distance" value="bestDistance" />
            </Picker>
          </View>
        </View>
      </View>

      {chartDataset && (
        <View style={styles.section}>
          <LineChart
            data={{
              labels: chartDataset.labels,
              datasets: chartDataset.datasets,
              legend: chartDataset.legend,
            }}
            width={screenWidth - 16}
            height={260}
            chartConfig={{
              backgroundColor: colors.background,
              backgroundGradientFrom: colors.background,
              backgroundGradientTo: colors.background,
              decimalPlaces: chartMetric === "totalVolume" ? 0 : 1,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: () => colors.text,
              style: { borderRadius: 16 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: colors.background },
              propsForBackgroundLines: { stroke: colors.border, strokeWidth: 1, strokeDasharray: "3,3" },
            }}
            bezier
            style={styles.chart}
          />
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>{getMetricLabel()}</Text>
        </View>
      )}

      {/* Exercise History Section */}
      {selectedExercises.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise History</Text>
        </View>
      )}

      {selectedExercises.map((ex) => {
        const history = exerciseHistory[ex.name] || [];
        const exerciseType = availableExercises.find((e) => e.name === ex.name)?.type as ExerciseType;
        if (!history.length) return null;

        return (
          <View key={ex.name} style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: ex.color }]}>{ex.name}</Text>
              <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
                {history.length} session{history.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {renderHistoryTable(history, exerciseType || "weight_reps", ex.color)}
          </View>
        );
      })}

      <ExercisePickerModal
        visible={showExercisePicker}
        exercises={availableExercises}
        selectedExercises={selectedExercises}
        colors={colors}
        onSelect={onAddExercise}
        onClose={() => onToggleExercisePicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  controls: { flexDirection: "row", gap: 12 },
  controlGroup: { flex: 1, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  chart: { borderRadius: 16, marginVertical: 8 },
  yAxisLabel: { textAlign: "center", fontSize: 12, marginTop: 4 },
  selectedExercisesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  exerciseActions: { flexDirection: "row", gap: 8 },
  exerciseList: { flexDirection: "row" },
  exerciseChip: { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  exerciseChipText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  removeIcon: { color: "#fff", fontSize: 18, marginLeft: 6, fontWeight: "700" },
  addChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  addChipInline: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  addChipText: { fontWeight: "600", fontSize: 14 },
  clearChipInline: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  clearChipText: { fontWeight: "600", fontSize: 14 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  historyTitle: { fontSize: 18, fontWeight: "700" },
  historyCount: { fontSize: 14 },
  historyTable: { borderRadius: 12, overflow: "hidden" },
  tableHeader: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 2 },
  tableHeaderCell: { fontWeight: "700", fontSize: 14 },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  tableRowLast: { borderBottomWidth: 0 },
  tableCell: { fontSize: 14 },
});
