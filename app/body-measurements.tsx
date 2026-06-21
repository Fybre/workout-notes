import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectModal } from "@/components/SelectModal";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useUnits } from "@/contexts/UnitContext";
import {
  BodyMeasurementEntry,
  deleteBodyMeasurement,
  getAllBodyMeasurements,
  getBodyMeasurementForDate,
  saveBodyMeasurement,
} from "@/db/database";
import { formatDisplayDate, getToday } from "@/utils/date";
import { cmToInches, inchesToCm, kgToLbs, lbsToKg } from "@/utils/units";

const screenWidth = Dimensions.get("window").width;

type MetricKey =
  | "weight"
  | "bodyFatPercent"
  | "chest"
  | "waist"
  | "hips"
  | "arms"
  | "thighs";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "weight", label: "Weight" },
  { key: "bodyFatPercent", label: "Body Fat %" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "arms", label: "Arms" },
  { key: "thighs", label: "Thighs" },
];

type ViewMode = "log" | "progress";

export default function BodyMeasurementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { weightUnit, distanceUnit } = useUnits();
  const lengthUnit = distanceUnit === "miles" ? "in" : "cm";

  const [viewMode, setViewMode] = useState<ViewMode>("log");
  const [allEntries, setAllEntries] = useState<BodyMeasurementEntry[]>([]);
  const [existingToday, setExistingToday] = useState<BodyMeasurementEntry | null>(
    null,
  );
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("weight");
  const [showMetricPicker, setShowMetricPicker] = useState(false);

  // Form state (strings so fields can be empty/partially typed)
  const [weight, setWeight] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [thighs, setThighs] = useState("");
  const [note, setNote] = useState("");

  const formatForInput = (
    valueKgOrCm: number | null,
    kind: "weight" | "length",
  ): string => {
    if (valueKgOrCm === null) return "";
    if (kind === "weight") {
      return weightUnit === "lbs"
        ? kgToLbs(valueKgOrCm).toString()
        : valueKgOrCm.toString();
    }
    return distanceUnit === "miles"
      ? cmToInches(valueKgOrCm).toString()
      : valueKgOrCm.toString();
  };

  const loadData = useCallback(async () => {
    try {
      const [entries, today] = await Promise.all([
        getAllBodyMeasurements(),
        getBodyMeasurementForDate(getToday()),
      ]);
      setAllEntries(entries);
      setExistingToday(today);

      setWeight(formatForInput(today?.weight ?? null, "weight"));
      setBodyFatPercent(today?.bodyFatPercent?.toString() ?? "");
      setChest(formatForInput(today?.chest ?? null, "length"));
      setWaist(formatForInput(today?.waist ?? null, "length"));
      setHips(formatForInput(today?.hips ?? null, "length"));
      setArms(formatForInput(today?.arms ?? null, "length"));
      setThighs(formatForInput(today?.thighs ?? null, "length"));
      setNote(today?.note ?? "");
    } catch (error) {
      Alert.alert("Error", "Failed to load body measurements");
    }
  }, [weightUnit, distanceUnit]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleSave = async () => {
    const parseWeight = (text: string): number | undefined => {
      if (!text.trim()) return undefined;
      const num = parseFloat(text);
      if (isNaN(num)) return undefined;
      return weightUnit === "lbs" ? lbsToKg(num) : num;
    };

    const parseLength = (text: string): number | undefined => {
      if (!text.trim()) return undefined;
      const num = parseFloat(text);
      if (isNaN(num)) return undefined;
      return distanceUnit === "miles" ? inchesToCm(num) : num;
    };

    const parsePercent = (text: string): number | undefined => {
      if (!text.trim()) return undefined;
      const num = parseFloat(text);
      return isNaN(num) ? undefined : num;
    };

    const fields = {
      weight: parseWeight(weight) ?? null,
      bodyFatPercent: parsePercent(bodyFatPercent) ?? null,
      chest: parseLength(chest) ?? null,
      waist: parseLength(waist) ?? null,
      hips: parseLength(hips) ?? null,
      arms: parseLength(arms) ?? null,
      thighs: parseLength(thighs) ?? null,
      note: note.trim() || null,
    };

    const hasAnyValue = Object.entries(fields).some(
      ([key, value]) => key !== "note" && value !== null,
    );
    if (!hasAnyValue) {
      Alert.alert("Nothing to Save", "Enter at least one measurement");
      return;
    }

    try {
      await saveBodyMeasurement(getToday(), fields);
      Alert.alert(
        "Saved",
        existingToday
          ? "Today's measurements updated"
          : "Today's measurements logged",
      );
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to save measurements");
    }
  };

  const handleDeleteEntry = (date: string) => {
    Alert.alert(
      "Delete Entry",
      `Delete the measurements logged on ${formatDisplayDate(date)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBodyMeasurement(date);
              loadData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete entry");
            }
          },
        },
      ],
    );
  };

  const metricUnit = (key: MetricKey): string => {
    if (key === "weight") return weightUnit;
    if (key === "bodyFatPercent") return "%";
    return lengthUnit;
  };

  const displayMetricValue = (key: MetricKey, valueKgOrCm: number): number => {
    if (key === "weight") {
      return weightUnit === "lbs" ? kgToLbs(valueKgOrCm) : valueKgOrCm;
    }
    if (key === "bodyFatPercent") return valueKgOrCm;
    return distanceUnit === "miles" ? cmToInches(valueKgOrCm) : valueKgOrCm;
  };

  const metricPoints = useMemo(() => {
    return allEntries
      .filter((entry) => entry[selectedMetric] !== null)
      .map((entry) => ({
        date: entry.date,
        value: displayMetricValue(selectedMetric, entry[selectedMetric]!),
      }));
  }, [allEntries, selectedMetric, weightUnit, distanceUnit]);

  const chartDataset = useMemo(() => {
    if (metricPoints.length < 2) return null;

    const labelInterval = Math.ceil(metricPoints.length / 6);
    const labels = metricPoints.map((point, index) => {
      if (index % labelInterval === 0 || index === metricPoints.length - 1) {
        const d = new Date(point.date);
        return d.toLocaleDateString(undefined, { day: "numeric", month: "numeric" });
      }
      return "";
    });

    return {
      labels,
      datasets: [{ data: metricPoints.map((p) => p.value) }],
    };
  }, [metricPoints]);

  const latest = metricPoints[metricPoints.length - 1];
  const starting = metricPoints[0];
  const change =
    latest && starting ? latest.value - starting.value : null;

  const renderRightActions = (date: string) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDeleteEntry(date)}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Body Measurements
          </Text>
          <View style={styles.closeButton} />
        </View>

        {/* View Switch */}
        <View style={styles.viewSwitch}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === "log" && { backgroundColor: colors.tint },
            ]}
            onPress={() => setViewMode("log")}
          >
            <Text
              style={[
                styles.viewButtonText,
                { color: viewMode === "log" ? "#fff" : colors.text },
              ]}
            >
              Log
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === "progress" && { backgroundColor: colors.tint },
            ]}
            onPress={() => setViewMode("progress")}
          >
            <Text
              style={[
                styles.viewButtonText,
                { color: viewMode === "progress" ? "#fff" : colors.text },
              ]}
            >
              Progress
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === "log" ? (
          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
              {existingToday ? "Editing today's entry" : "Logging for today"} ·{" "}
              {formatDisplayDate(getToday())}
            </Text>

            {[
              { label: `Weight (${weightUnit})`, value: weight, onChange: setWeight },
              { label: "Body Fat %", value: bodyFatPercent, onChange: setBodyFatPercent },
              { label: `Chest (${lengthUnit})`, value: chest, onChange: setChest },
              { label: `Waist (${lengthUnit})`, value: waist, onChange: setWaist },
              { label: `Hips (${lengthUnit})`, value: hips, onChange: setHips },
              { label: `Arms (${lengthUnit})`, value: arms, onChange: setArms },
              { label: `Thighs (${lengthUnit})`, value: thighs, onChange: setThighs },
            ].map((field) => (
              <View style={styles.inputGroup} key={field.label}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {field.label}
                </Text>
                <View
                  style={[
                    styles.textInputContainer,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={field.value}
                    onChangeText={field.onChange}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Note (Optional)
              </Text>
              <View
                style={[
                  styles.textInputContainer,
                  styles.textAreaContainer,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[styles.textInput, styles.textArea, { color: colors.text }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g., Measured first thing in the morning"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {existingToday ? "Update Entry" : "Save Entry"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[
                styles.selectField,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowMetricPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectFieldText, { color: colors.text }]}>
                {METRICS.find((m) => m.key === selectedMetric)?.label}
              </Text>
              <FontAwesome name="chevron-down" size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            {metricPoints.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No data logged for this metric yet
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <View
                    style={[styles.summaryCard, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Latest
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {latest.value} {metricUnit(selectedMetric)}
                    </Text>
                  </View>
                  <View
                    style={[styles.summaryCard, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Starting
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {starting.value} {metricUnit(selectedMetric)}
                    </Text>
                  </View>
                  <View
                    style={[styles.summaryCard, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Change
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color:
                            change === null || change === 0
                              ? colors.text
                              : change > 0
                                ? colors.error
                                : colors.success,
                        },
                      ]}
                    >
                      {change !== null
                        ? `${change > 0 ? "+" : ""}${change.toFixed(1)}`
                        : "—"}{" "}
                      {metricUnit(selectedMetric)}
                    </Text>
                  </View>
                </View>

                {chartDataset && (
                  <LineChart
                    data={chartDataset}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={{
                      backgroundColor: colors.background,
                      backgroundGradientFrom: colors.background,
                      backgroundGradientTo: colors.background,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                      labelColor: () => colors.text,
                      style: { borderRadius: 16 },
                      propsForDots: { r: "4", strokeWidth: "2", stroke: colors.background },
                      propsForBackgroundLines: {
                        stroke: colors.border,
                        strokeWidth: 1,
                        strokeDasharray: "3,3",
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                )}

                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  History
                </Text>
                {allEntries
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <Swipeable
                      key={entry.id}
                      renderRightActions={() => renderRightActions(entry.date)}
                      overshootRight={false}
                      friction={2}
                    >
                      <View
                        style={[
                          styles.historyRow,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.historyDate, { color: colors.tint }]}>
                          {formatDisplayDate(entry.date)}
                        </Text>
                        <Text style={[styles.historyValue, { color: colors.text }]}>
                          {entry[selectedMetric] !== null
                            ? `${displayMetricValue(selectedMetric, entry[selectedMetric]!)} ${metricUnit(selectedMetric)}`
                            : "—"}
                        </Text>
                      </View>
                    </Swipeable>
                  ))}
              </>
            )}
          </ScrollView>
        )}
      </View>

      <SelectModal
        visible={showMetricPicker}
        title="Metric"
        options={METRICS.map((m) => ({ label: m.label, value: m.key }))}
        selectedValue={selectedMetric}
        onSelect={(value) => {
          setSelectedMetric(value as MetricKey);
          setShowMetricPicker(false);
        }}
        onClose={() => setShowMetricPicker(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  closeText: {
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 32,
  },
  viewSwitch: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 24,
    marginTop: 16,
  },
  viewButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  dateLabel: {
    fontSize: 13,
    marginBottom: 16,
    fontStyle: "italic",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  textInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 14,
  },
  textAreaContainer: {
    minHeight: 90,
  },
  textArea: {
    textAlignVertical: "top",
    paddingVertical: 14,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  selectField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectFieldText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    fontStyle: "italic",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  chart: {
    borderRadius: 16,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteAction: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
