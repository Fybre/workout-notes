import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text as RNText,
  View as RNView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  deleteExercise,
  getExercisesForDate,
  getPersonalBestForExercise,
} from "@/db/database";
import { exportAndShareCsv } from "@/db/export";
import { useCurrentDate, useDateNavigation } from "@/hooks/useDateNavigation";
import type { Exercise, ExerciseType } from "@/types";
import { formatDisplayDate, isToday } from "@/utils/date";
import { formatSetForDisplay } from "@/utils/format";
import { useUnits } from "@/contexts/UnitContext";
import { findBestSetId, compareSets } from "@/utils/pb-utils";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const { isReady: dbReady } = useDatabase();
  const [isExporting, setIsExporting] = useState(false);
  const { weightUnit, distanceUnit } = useUnits();

  // Use centralized date hooks
  const date = useCurrentDate();
  const { goToToday } = useDateNavigation();

  // Load exercises for selected date when screen comes into focus and db is ready
  useFocusEffect(
    useCallback(() => {
      console.log(
        `[DEBUG] useFocusEffect triggered - dbReady: ${dbReady}, date: ${date}`,
      );

      if (!dbReady) {
        console.log("[DEBUG] Database not ready, skipping load");
        return;
      }

      // Add debounce to prevent rapid firing when changing dates quickly
      const loadExercisesWithDebounceTimer = setTimeout(async () => {
        console.log(`[DEBUG] Starting to load exercises for date: ${date}`);
        try {
          const startTime = Date.now();
          const data = await getExercisesForDate(date);

          // Add Personal Best detection
          const exercisesWithPB = await Promise.all(
            data.map(async (exercise) => {
              // Get personal best excluding today's data to check if today's sets are new PBs
              const personalBest = await getPersonalBestForExercise(
                exercise.name,
                date,
              );

              // Find the best set from today's exercise
              const bestSetId = findBestSetId(
                exercise.sets.map((s) => ({ ...s })),
                exercise.type as ExerciseType,
              );

              // Mark sets as PB
              const setsWithPB = exercise.sets.map((set) => {
                let isPB = false;

                if (set.id === bestSetId && personalBest) {
                  // Check if this set beats the historical personal best
                  isPB =
                    compareSets(set, personalBest, exercise.type as ExerciseType) > 0;
                } else if (set.id === bestSetId && !personalBest) {
                  // First set ever is a PB
                  isPB = true;
                }

                return {
                  ...set,
                  isPersonalBest: isPB,
                };
              });

              return {
                ...exercise,
                type: exercise.type as ExerciseType,
                sets: setsWithPB,
              };
            }),
          );

          const endTime = Date.now();
          console.log(
            `[DEBUG] Successfully loaded ${data.length} exercises in ${endTime - startTime}ms`,
          );

          setExercises(exercisesWithPB as Exercise[]);
        } catch (error) {
          console.error("[DEBUG] Failed to load exercises:", error);
          console.error(
            "[DEBUG] Error details:",
            JSON.stringify(error, null, 2),
          );
          setExercises([]);
        }
      }, 10); // 10ms debounce for monitoring

      return () => clearTimeout(loadExercisesWithDebounceTimer);
    }, [dbReady, date]),
  );

  // Format date for display using centralized utility
  const dateString = formatDisplayDate(date);
  const todayFlag = isToday(date);

  // Extract unique categories from exercises for the summary pills
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    exercises.forEach((ex) => {
      // Use 'Custom' as fallback if category is missing
      const category = (ex as any).category || "Custom";
      if (category && category !== "Recent") {
        uniqueCategories.add(category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [exercises]);

  // Handle menu toggle
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Handle navigation to Settings
  const navigateToSettings = () => {
    setMenuVisible(false);
    router.push("/settings-modal");
  };

  // Handle CSV export
  const handleExportCsv = async () => {
    setMenuVisible(false);
    setIsExporting(true);

    try {
      const result = await exportAndShareCsv();
      if (result.success) {
        Alert.alert(
          "Export Complete",
          `Successfully exported ${result.recordCount} workout records to CSV.`
        );
      } else {
        Alert.alert("Export Failed", result.error ?? "Failed to export data");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred during export");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle tap on date header to reset to today
  const handleDateHeaderTap = () => {
    console.log("[DEBUG] Date header tapped, resetting to today");
    goToToday();
  };

  const handleStartExercise = () => {
    router.push({
      pathname: "/select-exercise",
      params: { date },
    });
  };

  const handleExerciseTap = (exercise: Exercise) => {
    router.push({
      pathname: "/enter-exercise",
      params: {
        exerciseName: exercise.name,
        exerciseId: exercise.id,
        exerciseType: exercise.type,
        exerciseSets: JSON.stringify(exercise.sets),
      },
    });
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise and all its sets?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExercise(exerciseId);
              // Refresh the exercises list
              const updatedExercises = await getExercisesForDate(date);
              setExercises(
                updatedExercises.map((ex) => ({
                  ...ex,
                  type: ex.type as ExerciseType,
                })),
              );
            } catch (error) {
              console.error("Failed to delete exercise:", error);
              Alert.alert("Error", "Failed to delete exercise");
            }
          },
        },
      ],
    );
  };

  const renderRightActions = (exerciseId: string) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDeleteExercise(exerciseId)}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  if (!dbReady) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header: Today's Date - Tappable to reset to today */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={handleDateHeaderTap}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {dateString}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleMenu}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
              style={styles.menuButton}
            >
              <Text style={[styles.menuIcon, { color: colors.text }]}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Summary Pills */}
        {categories.length > 0 && (
          <RNView style={styles.pillsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContent}
            >
              {categories.map((category) => (
                <View
                  key={category}
                  style={[styles.pill, { backgroundColor: `${colors.tint}20` }]}
                >
                  <Text style={[styles.pillText, { color: colors.tint }]}>
                    {category}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </RNView>
        )}

        {/* Exercise List */}
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length > 0 ? (
            <>
              {exercises.map((exercise) => (
                <Swipeable
                  key={exercise.id}
                  renderRightActions={() => renderRightActions(exercise.id)}
                  overshootRight={false}
                  friction={2}
                >
                  <TouchableOpacity
                    style={[
                      styles.exerciseCard,
                      { borderColor: colors.border },
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => handleExerciseTap(exercise)}
                    activeOpacity={0.7}
                  >
                    <RNView style={styles.exerciseHeader}>
                      <Text
                        style={[styles.exerciseName, { color: colors.text }]}
                      >
                        {exercise.name}
                      </Text>
                      <Text
                        style={[
                          styles.setCount,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {exercise.sets.length}{" "}
                        {exercise.sets.length === 1 ? "set" : "sets"}
                      </Text>
                    </RNView>
                    <RNView style={styles.setsPreview}>
                      {exercise.sets.map((set) => (
                        <RNView key={set.id} style={styles.setContainer}>
                          <RNText
                            style={[
                              styles.setPreview,
                              {
                                color: colors.tint,
                                backgroundColor: `${colors.tint}15`,
                              },
                            ]}
                          >
                            {formatSetForDisplay(exercise.type, set, { weightUnit, distanceUnit })}
                          </RNText>
                          {set.isPersonalBest && (
                            <Text style={styles.pbIcon}>🏆</Text>
                          )}
                        </RNView>
                      ))}
                    </RNView>
                  </TouchableOpacity>
                </Swipeable>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {todayFlag
                  ? "No exercises yet today"
                  : "No exercises on this day"}
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                Tap the + button to get started
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Start Workout Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.tint }]}
            onPress={handleStartExercise}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: "#ffffff" }]}>+</Text>
            <Text style={[styles.buttonLabel, { color: "#ffffff" }]}>
              Start Exercise
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Overlay - closes menu when tapping outside */}
        {menuVisible && (
          <TouchableOpacity
            style={styles.menuOverlay}
            onPress={() => setMenuVisible(false)}
            activeOpacity={1}
          />
        )}

        {/* Menu Modal */}
        {menuVisible && (
          <View
            style={[
              styles.menuModal,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: `${colors.tint}15` }]}
              onPress={handleExportCsv}
              activeOpacity={0.7}
              disabled={isExporting}
            >
              <Text style={[styles.menuItemText, { color: colors.tint }]}>
                Export to CSV
              </Text>
            </TouchableOpacity>
            
            <View
              style={[
                styles.menuDivider,
                { backgroundColor: colors.border },
              ]}
            />
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: `${colors.tint}15` }]}
              onPress={navigateToSettings}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: colors.tint }]}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Export Loading Overlay */}
        {isExporting && (
          <View style={styles.exportOverlay}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.exportText, { color: colors.text }]}>
              Exporting...
            </Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  exerciseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  setCount: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
    opacity: 0.7,
  },
  setsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setPreview: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  startButton: {
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 2,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Swipe to delete
  deleteAction: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 16,
    borderRadius: 16,
    marginLeft: 12,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  // Set container for PB display
  setContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // Personal Best icon style
  pbIcon: {
    fontSize: 16,
    color: "#FFD700", // Gold color
  },
  // Header content container
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  // Menu button
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  // Menu icon
  menuIcon: {
    fontSize: 24,
    fontWeight: "600",
  },
  // Menu modal
  menuModal: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Menu item
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  // Menu item text
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  // Category pills
  pillsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pillsContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  // Menu overlay (to close menu when tapping outside)
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  // Menu divider
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  // Export loading overlay
  exportOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  exportText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
});
