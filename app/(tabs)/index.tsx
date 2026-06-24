import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text as RNText,
  TextInput,
  View as RNView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  createTemplate,
  deleteExercise,
  getExercisesForDate,
  getPersonalBestsForDefinitions,
} from "@/db/database";
import { exportAndShareCsv } from "@/db/export";
import { useCurrentDate, useDateNavigation } from "@/hooks/useDateNavigation";
import type { Exercise, ExerciseType } from "@/types";
import { formatRelativeDate, isToday } from "@/utils/date";
import { formatSetForDisplay, formatWorkoutDuration } from "@/utils/format";
import { useUnits } from "@/contexts/UnitContext";
import { findBestSetId, compareSets } from "@/utils/pb-utils";
import { kgToLbs, kmToMiles } from "@/utils/units";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<Set<string>>(
    new Set(),
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { isReady: dbReady } = useDatabase();
  const [isExporting, setIsExporting] = useState(false);
  const { weightUnit, distanceUnit } = useUnits();
  const insets = useSafeAreaInsets();

  // Use centralized date hooks
  const date = useCurrentDate();
  const { goToToday } = useDateNavigation();

  // Track exercise count per date so we only auto-scroll when a new exercise
  // was actually added (not on date navigation or unrelated refocus)
  const exerciseListRef = useRef<ScrollView>(null);
  const prevExerciseCountRef = useRef(0);
  const prevDateRef = useRef<string | null>(null);

  // Load exercises for selected date when screen comes into focus and db is ready
  useFocusEffect(
    useCallback(() => {
      if (!dbReady) return;

      // Add debounce to prevent rapid firing when changing dates quickly
      const loadExercisesWithDebounceTimer = setTimeout(async () => {
        try {
          const data = await getExercisesForDate(date);

          // Get personal bests (excluding today) for every shown exercise in
          // a single query, instead of one definition-lookup + one
          // full-history scan per exercise
          const personalBests = await getPersonalBestsForDefinitions(
            data.map((exercise) => ({
              definitionId: exercise.definitionId,
              type: exercise.type as ExerciseType,
            })),
            date,
          );

          // Add Personal Best detection
          const exercisesWithPB = data.map((exercise) => {
            const personalBest = personalBests[exercise.definitionId];

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
          });

          setExercises(exercisesWithPB as Exercise[]);

          // Scroll to the most recently added exercise (it's last in the
          // list, ordered by createdAt) when one was just added for this
          // same date - but not when switching dates or on an unrelated refocus
          const isSameDate = prevDateRef.current === date;
          const exerciseAdded =
            isSameDate && exercisesWithPB.length > prevExerciseCountRef.current;
          prevDateRef.current = date;
          prevExerciseCountRef.current = exercisesWithPB.length;

          if (exerciseAdded) {
            // Defer until the new exercise card has actually rendered/laid out
            setTimeout(() => {
              exerciseListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        } catch (error) {
          console.error("Failed to load exercises:", error);
          setExercises([]);
        }
      }, 10); // 10ms debounce

      return () => clearTimeout(loadExercisesWithDebounceTimer);
    }, [dbReady, date]),
  );

  // Format date for display using centralized utility
  const dateString = formatRelativeDate(date);
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

  // Total workout duration for the day: last logged set's timestamp minus
  // the first's, across every exercise shown (not per-exercise)
  const workoutDurationLabel = useMemo(() => {
    const timestamps: number[] = [];
    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        if (set.timestamp) timestamps.push(set.timestamp);
      }
    }

    if (timestamps.length < 2) return null;

    const durationMs = Math.max(...timestamps) - Math.min(...timestamps);
    if (durationMs <= 0) return null;

    return formatWorkoutDuration(durationMs);
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

  // Handle navigation to Manage Exercises
  const navigateToManageExercises = () => {
    setMenuVisible(false);
    router.push("/manage-exercises");
  };

  // Handle navigation to Templates (load/manage)
  const navigateToTemplates = () => {
    setMenuVisible(false);
    router.push({ pathname: "/templates", params: { date } });
  };

  // Handle navigation to Body Measurements
  const navigateToBodyMeasurements = () => {
    setMenuVisible(false);
    router.push("/body-measurements");
  };

  // Handle opening the "Save as Template" naming modal
  const handleOpenSaveTemplate = () => {
    setMenuVisible(false);
    if (exercises.length === 0) {
      Alert.alert("No Exercises", "There are no exercises today to save as a template.");
      return;
    }
    setTemplateName("");
    setShowSaveTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    if (!name) {
      Alert.alert("Error", "Template name is required");
      return;
    }

    try {
      await createTemplate(
        name,
        exercises.map((ex) => ex.definitionId),
      );
      setShowSaveTemplateModal(false);
      setTemplateName("");
    } catch (error) {
      Alert.alert("Error", "Failed to save template");
    }
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
        date,
      },
    });
  };

  const toggleExerciseCollapsed = (exerciseId: string) => {
    setCollapsedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
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
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border, paddingTop: insets.top + 10 },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={handleDateHeaderTap}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {dateString}
              </Text>
              {workoutDurationLabel && (
                <Text
                  style={[
                    styles.workoutDurationText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Workout: {workoutDurationLabel}
                </Text>
              )}
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
          ref={exerciseListRef}
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
                      <RNView style={styles.exerciseHeaderRight}>
                        <Text
                          style={[
                            styles.setCount,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {exercise.sets.length}{" "}
                          {exercise.sets.length === 1 ? "set" : "sets"}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleExerciseCollapsed(exercise.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.collapseToggle}
                        >
                          <FontAwesome
                            name={
                              collapsedExerciseIds.has(exercise.id)
                                ? "chevron-down"
                                : "chevron-up"
                            }
                            size={14}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </RNView>
                    </RNView>
                    {/* Table Layout for Sets */}
                    {!collapsedExerciseIds.has(exercise.id) && (
                    <RNView style={styles.setsTable}>
                      {/* Table Header */}
                      <RNView style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
                        <RNText style={[styles.tableHeaderCell, styles.iconCol, { color: colors.textSecondary }]}></RNText>
                        {(exercise.type === "weight_reps" || exercise.type === "weight_distance" || exercise.type === "weight_time" || exercise.type === "weight") && (
                          <RNText style={[styles.tableHeaderCell, styles.dataCol, { color: colors.textSecondary }]}>{weightUnit}</RNText>
                        )}
                        {(exercise.type === "weight_reps" || exercise.type === "reps_distance" || exercise.type === "reps_time" || exercise.type === "reps") && (
                          <RNText style={[styles.tableHeaderCell, styles.dataCol, { color: colors.textSecondary }]}>Reps</RNText>
                        )}
                        {(exercise.type === "distance_time" || exercise.type === "weight_distance" || exercise.type === "reps_distance" || exercise.type === "distance") && (
                          <RNText style={[styles.tableHeaderCell, styles.dataCol, { color: colors.textSecondary }]}>{distanceUnit}</RNText>
                        )}
                        {(exercise.type === "distance_time" || exercise.type === "weight_time" || exercise.type === "reps_time" || exercise.type === "time_duration" || exercise.type === "time_speed") && (
                          <RNText style={[styles.tableHeaderCell, styles.dataCol, { color: colors.textSecondary }]}>Time</RNText>
                        )}
                      </RNView>
                      {/* Table Body */}
                      {exercise.sets.map((set) => (
                        <RNView key={set.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                          <RNView style={[styles.iconCol, styles.iconContainerLeft]}>
                            {set.isPersonalBest && <Text style={styles.pbIcon}>🏆</Text>}
                            {set.note && <FontAwesome name="sticky-note" size={12} color={colors.tint} />}
                          </RNView>
                          {(exercise.type === "weight_reps" || exercise.type === "weight_distance" || exercise.type === "weight_time" || exercise.type === "weight") && (
                            <RNText style={[styles.tableCell, styles.dataCol, { color: colors.text }]}>
                              {set.weight !== undefined ? (weightUnit === "lbs" ? kgToLbs(set.weight).toFixed(1) : set.weight.toFixed(1)) : "—"}
                            </RNText>
                          )}
                          {(exercise.type === "weight_reps" || exercise.type === "reps_distance" || exercise.type === "reps_time" || exercise.type === "reps") && (
                            <RNText style={[styles.tableCell, styles.dataCol, { color: colors.text }]}>
                              {set.reps !== undefined ? set.reps : "—"}
                            </RNText>
                          )}
                          {(exercise.type === "distance_time" || exercise.type === "weight_distance" || exercise.type === "reps_distance" || exercise.type === "distance") && (
                            <RNText style={[styles.tableCell, styles.dataCol, { color: colors.text }]}>
                              {set.distance !== undefined ? (distanceUnit === "miles" ? kmToMiles(set.distance).toFixed(2) : set.distance.toFixed(2)) : "—"}
                            </RNText>
                          )}
                          {(exercise.type === "distance_time" || exercise.type === "weight_time" || exercise.type === "reps_time" || exercise.type === "time_duration" || exercise.type === "time_speed") && (
                            <RNText style={[styles.tableCell, styles.dataCol, { color: colors.text }]}>
                              {set.time !== undefined ? `${Math.floor(set.time / 60)}:${(set.time % 60).toString().padStart(2, '0')}` : "—"}
                            </RNText>
                          )}
                        </RNView>
                      ))}
                    </RNView>
                    )}
                    {/* ORIGINAL PILL LAYOUT - Uncomment to revert
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
                          {set.note && (
                            <FontAwesome name="sticky-note" size={12} color={colors.tint} style={styles.noteIcon} />
                          )}
                        </RNView>
                      ))}
                    </RNView>
                    */}
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
              onPress={navigateToManageExercises}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: colors.tint }]}>
                Manage Exercises
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
              onPress={handleOpenSaveTemplate}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: colors.tint }]}>
                Save as Template...
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
              onPress={navigateToTemplates}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: colors.tint }]}>
                Load Template...
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
              onPress={navigateToBodyMeasurements}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: colors.tint }]}>
                Body Measurements
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

        {/* Save as Template Modal */}
        <Modal
          visible={showSaveTemplateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSaveTemplateModal(false)}
        >
          <TouchableOpacity
            style={styles.noteModalOverlay}
            activeOpacity={1}
            onPress={() => setShowSaveTemplateModal(false)}
          >
            <View
              style={[
                styles.noteModalContent,
                { backgroundColor: colors.surface },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.noteModalTitle, { color: colors.text }]}>
                Save as Template
              </Text>
              <TextInput
                style={[
                  styles.templateNameInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Push Day"
                placeholderTextColor={colors.textSecondary}
                value={templateName}
                onChangeText={setTemplateName}
                maxLength={50}
                autoFocus
              />
              <View style={styles.noteModalButtons}>
                <TouchableOpacity
                  style={[
                    styles.noteModalButton,
                    { backgroundColor: colors.border },
                  ]}
                  onPress={() => setShowSaveTemplateModal(false)}
                >
                  <Text
                    style={[styles.noteModalButtonText, { color: colors.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.noteModalButton,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={handleSaveTemplate}
                >
                  <Text style={[styles.noteModalButtonText, { color: "#fff" }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
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
    textAlign: "left",
  },
  workoutDurationText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "left",
    marginTop: 2,
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
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  setCount: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  exerciseHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "transparent",
  },
  collapseToggle: {
    padding: 2,
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
  noteIcon: {
    marginLeft: 4,
  },
  // Table styles for sets display
  setsTable: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  tableHeader: {
    paddingVertical: 4,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tableCell: {
    fontSize: 15,
    fontWeight: "500",
  },
  setNumCol: {
    width: 24,
    textAlign: "center",
  },
  dataCol: {
    flex: 1,
    textAlign: "center",
  },
  iconCol: {
    width: 44,
    textAlign: "right",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
  },
  iconContainerLeft: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 4,
  },
  // Save as Template modal
  noteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noteModalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  templateNameInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  noteModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  noteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  noteModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
