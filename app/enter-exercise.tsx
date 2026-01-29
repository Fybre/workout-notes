import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import Celebration from "@/components/Celebration";
import EditSetModal from "@/components/EditSetModal";
import RestTimerModal from "@/components/RestTimerModal";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  addExerciseDefinition,
  addExerciseWithDefinition,
  addSet,
  deleteSet,
  getExerciseDefinitionByName,
  getExerciseHistoryWithSets,
  getLastExerciseByName,
  getPersonalBestForExercise,
  updateSet,
} from "@/db/database";
import type { ExerciseType, Set } from "@/types/workout";
import { getToday, parseDateParam } from "@/utils/date";
import {
  calculateOneRepMax,
  formatOneRepMax,
  formatSetForDisplay,
  getExerciseTypeFields,
  validateSet,
} from "@/utils/format";
import { generateId } from "@/utils/id";
import { useUnits } from "@/contexts/UnitContext";
import {
  kgToLbs,
  lbsToKg,
  formatWeight,
} from "@/utils/units";
import { isNewPersonalBest } from "@/utils/pb-utils";

const REST_TIMER_SETTINGS_KEY = "@rest_timer_settings";

interface RestTimerSettings {
  autoStart: boolean;
  defaultTime: number;
}

const REPS_INCREMENT = 1;

interface WorkoutSet {
  id: string;
  weight?: number;
  reps?: number;
  distance?: number;
  time?: number;
}

export default function EnterWorkoutScreen() {
  const router = useRouter();
  const {
    exerciseName,
    exerciseId: paramExerciseId,
    exerciseType: paramExerciseType,
    exerciseSets: paramSets,
    date: dateParam,
  } = useLocalSearchParams<{
    exerciseName: string;
    exerciseId?: string;
    exerciseType?: ExerciseType;
    exerciseSets?: string;
    date?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Get user's unit preference
  const { weightUnit, distanceUnit, weightIncrement } = useUnits();

  // Parse date from params using centralized utility
  const exerciseDate = parseDateParam(dateParam);
  const today = getToday();

  // Weight is stored internally in kg, converted for display/input
  const [weightKg, setWeightKg] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [exerciseType] = useState<ExerciseType>(
    paramExerciseType || "weight_reps",
  );
  const [sets, setSets] = useState<WorkoutSet[]>(() => {
    if (paramSets) {
      try {
        const parsedSets = JSON.parse(paramSets);
        return parsedSets.map((s: any) => ({
          id: s.id,
          weight: s.weight,
          reps: s.reps,
          distance: s.distance,
          time: s.time,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [weightInputVisible, setWeightInputVisible] = useState(false);
  const [repsInputVisible, setRepsInputVisible] = useState(false);
  const [distanceInputVisible, setDistanceInputVisible] = useState(false);
  const [timeInputVisible, setTimeInputVisible] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [exerciseId] = useState(() => paramExerciseId || generateId());
  const [exerciseSaved, setExerciseSaved] = useState(() => !!paramExerciseId);
  const [personalBest, setPersonalBest] = useState<Set | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newPBSet, setNewPBSet] = useState<WorkoutSet | null>(null);
  const [exerciseDescription, setExerciseDescription] = useState<string | null>(
    null,
  );
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<
    { date: string; sets: Set[] }[]
  >([]);
  const [estimatedOneRM, setEstimatedOneRM] = useState<number | null>(null);

  // Rest timer state
  const [restTimerSettings, setRestTimerSettings] = useState<RestTimerSettings>(
    {
      autoStart: false,
      defaultTime: 60,
    },
  );
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [autoStartTimer, setAutoStartTimer] = useState(false);

  // Populate input values based on history
  useEffect(() => {
    const populateFromHistory = async () => {
      // Case 2: Editing today's exercise - use the last set's values
      if (paramSets) {
        try {
          const parsedSets = JSON.parse(paramSets);
          if (parsedSets.length > 0) {
            const lastSet = parsedSets[parsedSets.length - 1];
            setWeightKg(lastSet.weight ?? 0);
            setReps(lastSet.reps ?? 0);
            setDistance(lastSet.distance ?? 0);
            setTime(lastSet.time ?? 0);
            return;
          }
        } catch {
          // Fall through to historical lookup
        }
      }

      // Case 3: New exercise - look up last time this exercise was done
      if (exerciseName) {
        const lastExercise = await getLastExerciseByName(exerciseName, today);

        if (lastExercise && lastExercise.sets.length > 0) {
          // Use the FIRST set from the last session
          const firstSet = lastExercise.sets[0];
          setWeightKg(firstSet.weight ?? 0);
          setReps(firstSet.reps ?? 0);
          setDistance(firstSet.distance ?? 0);
          setTime(firstSet.time ?? 0);
        }
        // Case 1: No history - inputs remain at 0 (blank)
      }
    };

    populateFromHistory();
  }, [exerciseName, paramSets, today]);

  // Load rest timer settings
  useEffect(() => {
    const loadRestTimerSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(REST_TIMER_SETTINGS_KEY);
        if (saved) {
          setRestTimerSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load rest timer settings:", error);
      }
    };

    loadRestTimerSettings();
  }, []);

  // Fetch personal best and exercise description for this exercise
  useEffect(() => {
    const fetchPersonalBest = async () => {
      if (exerciseName) {
        const pb = await getPersonalBestForExercise(exerciseName, today);
        setPersonalBest(pb);
      }
    };

    const fetchExerciseDescription = async () => {
      if (exerciseName) {
        const definition = await getExerciseDefinitionByName(exerciseName);
        setExerciseDescription(definition?.description || null);
      }
    };

    fetchPersonalBest();
    fetchExerciseDescription();
  }, [exerciseName, today]);

  const handleAddSet = async () => {
    // Validate based on exercise type
    const isValid = validateSet(exerciseType, { weight: weightKg, reps, distance, time });

    if (!isValid) {
      Alert.alert(
        "Invalid Set",
        "Please enter valid values for this exercise type",
      );
      return;
    }

    // Save exercise on first set
    if (!exerciseSaved) {
      try {
        // Get or create exercise definition
        let definition = await getExerciseDefinitionByName(
          exerciseName || "Unknown",
        );

        if (!definition) {
          // Create a new exercise definition if it doesn't exist
          await addExerciseDefinition({
            id: generateId(),
            name: exerciseName || "Unknown",
            category: "Custom",
            type: exerciseType,
            unit: exerciseType.includes("weight")
              ? "kg"
              : exerciseType.includes("distance")
                ? "km"
                : exerciseType.includes("time")
                  ? "s"
                  : "reps",
            description: "Custom exercise",
          });

          // Get the newly created definition
          definition = await getExerciseDefinitionByName(
            exerciseName || "Unknown",
          );
        }

        if (definition) {
          // Add the exercise with the definition
          await addExerciseWithDefinition({
            id: exerciseId,
            definitionId: definition.id,
            date: exerciseDate,
          });
        } else {
          throw new Error("Failed to create exercise definition");
        }

        setExerciseSaved(true); // Mark as saved to prevent duplicate creation
      } catch (error) {
        Alert.alert("Error", "Failed to save exercise");
        console.error(error);
        return;
      }
    }

    const newSet: WorkoutSet = {
      id: generateId(),
      weight: exerciseType.includes("weight") ? weightKg : undefined,
      reps: exerciseType.includes("reps") ? reps : undefined,
      distance: exerciseType.includes("distance") ? distance : undefined,
      time: exerciseType.includes("time") ? time : undefined,
    };

    // Check if this is a new personal best
    const isPB = isNewPersonalBest(newSet, personalBest, exerciseType);

    // Save to database
    try {
      await addSet(exerciseId, {
        id: newSet.id,
        weight: newSet.weight,
        reps: newSet.reps,
        distance: newSet.distance,
        time: newSet.time,
        timestamp: Date.now(),
      });
    } catch (error) {
      Alert.alert("Error", "Failed to save set");
      console.error(error);
      return;
    }

    setSets([...sets, newSet]);

    // If PB, update the PB display and trigger celebration
    if (isPB) {
      // Convert WorkoutSet to Set for the PB display
      const pbSet: Set = {
        id: newSet.id,
        weight: newSet.weight,
        reps: newSet.reps,
        distance: newSet.distance,
        time: newSet.time,
        timestamp: Date.now(),
      };
      setPersonalBest(pbSet); // Update PB so subsequent sets compare against this new best
      setNewPBSet(newSet);
      setShowCelebration(true);

      // Stronger haptic for PB
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch (error) {
        console.log("Haptic feedback not available:", error);
      }
    } else {
      // Regular haptic for normal set
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch (error) {
        console.log("Haptic feedback not available:", error);
      }
    }

    // Auto-start rest timer if enabled
    if (restTimerSettings.autoStart) {
      setAutoStartTimer(true);
      setShowRestTimer(true);
    }

    // Keep the current values for quick entry of another set
    // Don't reset the inputs
  };

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setNewPBSet(null);
  }, []);

  const handleDeleteSet = async (setId: string) => {
    try {
      await deleteSet(setId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete set");
      console.error(error);
      return;
    }

    setSets(sets.filter((s) => s.id !== setId));
  };

  const handleEditSet = (set: WorkoutSet) => {
    // Populate inputs with the selected set's values for editing
    setWeightKg(set.weight || 0);
    setReps(set.reps || 0);
    setDistance(set.distance || 0);
    setTime(set.time || 0);
    setEditingSet(set);
  };

  const handleUpdateSet = async (updates: Partial<WorkoutSet>) => {
    if (editingSet) {
      try {
        await updateSet(editingSet.id, updates);
      } catch (error) {
        Alert.alert("Error", "Failed to update set");
        console.error(error);
        return;
      }

      setSets(
        sets.map((s) => (s.id === editingSet.id ? { ...s, ...updates } : s)),
      );
    }
  };

  const handleClose = () => {
    // If we came from select-exercise screen and no sets were added, go back to select-exercise
    // Otherwise, go back to home screen
    if (!paramExerciseId && sets.length === 0) {
      // Came from select-exercise and no sets added - go back to select-exercise
      router.back();
    } else {
      // Either came from home screen or sets were added - go to home screen with the same date
      router.replace({
        pathname: "/(tabs)",
        params: { date: exerciseDate },
      });
    }
  };

  const handleWeightChange = (text: string) => {
    const num = parseFloat(text) || 0;
    // Convert from user's unit to kg for storage
    const kgValue = weightUnit === "lbs" ? lbsToKg(num) : num;
    setWeightKg(kgValue);
  };

  const handleRepsChange = (text: string) => {
    const num = parseInt(text, 10) || 0;
    setReps(num);
  };

  const handleDistanceChange = (text: string) => {
    const num = parseFloat(text) || 0;
    setDistance(num);
  };

  const handleTimeChange = (text: string) => {
    const num = parseInt(text, 10) || 0;
    setTime(num);
  };

  // Get which input fields to show based on exercise type
  const fields = getExerciseTypeFields(exerciseType);

  // Check if Add Set button should be enabled
  const canAddSet = validateSet(exerciseType, { weight: weightKg, reps, distance, time });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Celebration Animation */}
      <Celebration
        visible={showCelebration}
        onComplete={handleCelebrationComplete}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTitleContainer}>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {exerciseName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {(exerciseDescription || exerciseHistory.length > 0) && (
            <TouchableOpacity
              onPress={async () => {
                // Load exercise history when opening modal
                if (exerciseName) {
                  const history = await getExerciseHistoryWithSets(
                    exerciseName,
                    30,
                  );
                  setExerciseHistory(history);

                  // Calculate best estimated 1RM from history
                  if (exerciseType === "weight_reps") {
                    let bestOneRM: number | null = null;
                    for (const entry of history) {
                      for (const set of entry.sets) {
                        if (set.weight && set.reps) {
                          const oneRM = calculateOneRepMax(set.weight, set.reps);
                          if (oneRM && (bestOneRM === null || oneRM > bestOneRM)) {
                            bestOneRM = oneRM;
                          }
                        }
                      }
                    }
                    setEstimatedOneRM(bestOneRM);
                  } else {
                    setEstimatedOneRM(null);
                  }
                }
                setShowInfoModal(true);
              }}
              style={styles.infoButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoIcon, { color: colors.tint }]}>ⓘ</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              setAutoStartTimer(false);
              setShowRestTimer(true);
            }}
            style={styles.stopwatchButton}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.stopwatchIcon,
                {
                  color: restTimerSettings.autoStart
                    ? colors.success
                    : colors.tint,
                },
              ]}
            >
              ⏱️
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Best Display */}
        {personalBest && (
          <View
            style={[
              styles.pbContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
              showCelebration && styles.pbContainerNew,
            ]}
          >
            <Text style={[styles.pbText, { color: colors.textSecondary }]}>
              🏆 PB: {formatSetForDisplay(exerciseType, personalBest, { weightUnit, distanceUnit })}
            </Text>
            {showCelebration && (
              <Text style={[styles.pbNewLabel, { color: colors.success }]}>
                NEW PERSONAL BEST!
              </Text>
            )}
          </View>
        )}

        {/* Input Sections Container */}
        <View style={{ flexDirection: "column", gap: 4, alignItems: "center" }}>
          <View style={{ width: "80%" }}>
            {/* Weight Input Section */}
            {fields.weight && (
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Weight ({weightUnit})
                </Text>
                <View
                  style={[styles.inputRow, { backgroundColor: colors.surface }]}
                >
                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => {
                      const currentDisplay = weightUnit === "lbs" ? kgToLbs(weightKg) : weightKg;
                      const newDisplay = Math.max(0, currentDisplay - weightIncrement);
                      setWeightKg(weightUnit === "lbs" ? lbsToKg(newDisplay) : newDisplay);
                    }}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      −
                    </Text>
                  </TouchableOpacity>

                  {weightInputVisible ? (
                    <TextInput
                      style={[
                        styles.visibleInput,
                        { color: colors.text, backgroundColor: colors.surface },
                      ]}
                      keyboardType="decimal-pad"
                      placeholder="Weight"
                      value={(weightUnit === "lbs" ? kgToLbs(weightKg) : weightKg).toString()}
                      onChangeText={handleWeightChange}
                      onBlur={() => setWeightInputVisible(false)}
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.numberField}
                      onPress={() => setWeightInputVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.numberText, { color: colors.text }]}>
                        {weightKg === 0 ? "—" : (weightUnit === "lbs" ? kgToLbs(weightKg) : weightKg).toFixed(weightUnit === "lbs" ? 1 : 1)}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => {
                      const currentDisplay = weightUnit === "lbs" ? kgToLbs(weightKg) : weightKg;
                      const newDisplay = currentDisplay + weightIncrement;
                      setWeightKg(weightUnit === "lbs" ? lbsToKg(newDisplay) : newDisplay);
                    }}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reps Input Section */}
            {fields.reps && (
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.text }]}>Reps</Text>
                <View
                  style={[styles.inputRow, { backgroundColor: colors.surface }]}
                >
                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => setReps(Math.max(0, reps - REPS_INCREMENT))}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      −
                    </Text>
                  </TouchableOpacity>

                  {repsInputVisible ? (
                    <TextInput
                      style={[
                        styles.visibleInput,
                        { color: colors.text, backgroundColor: colors.surface },
                      ]}
                      keyboardType="number-pad"
                      placeholder="Reps"
                      value={reps.toString()}
                      onChangeText={handleRepsChange}
                      onBlur={() => setRepsInputVisible(false)}
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.numberField}
                      onPress={() => setRepsInputVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.numberText, { color: colors.text }]}>
                        {reps === 0 ? "—" : reps}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => setReps(reps + REPS_INCREMENT)}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Distance Input Section */}
            {fields.distance && (
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Distance (km)
                </Text>
                <View
                  style={[styles.inputRow, { backgroundColor: colors.surface }]}
                >
                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => setDistance(Math.max(0, distance - 0.5))}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      −
                    </Text>
                  </TouchableOpacity>

                  {distanceInputVisible ? (
                    <TextInput
                      style={[
                        styles.visibleInput,
                        { color: colors.text, backgroundColor: colors.surface },
                      ]}
                      keyboardType="decimal-pad"
                      placeholder="Distance"
                      value={distance.toString()}
                      onChangeText={handleDistanceChange}
                      onBlur={() => setDistanceInputVisible(false)}
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.numberField}
                      onPress={() => setDistanceInputVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.numberText, { color: colors.text }]}>
                        {distance === 0 ? "—" : distance.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => setDistance(distance + 0.5)}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Time Input Section */}
            {fields.time && (
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Time (seconds)
                </Text>
                <View
                  style={[styles.inputRow, { backgroundColor: colors.surface }]}
                >
                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => setTime(Math.max(0, time - 30))}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      −
                    </Text>
                  </TouchableOpacity>

                  {timeInputVisible ? (
                    <TextInput
                      style={[
                        styles.visibleInput,
                        { color: colors.text, backgroundColor: colors.surface },
                      ]}
                      keyboardType="number-pad"
                      placeholder="Time"
                      value={time.toString()}
                      onChangeText={handleTimeChange}
                      onBlur={() => setTimeInputVisible(false)}
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.numberField}
                      onPress={() => setTimeInputVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.numberText, { color: colors.text }]}>
                        {time === 0 ? "—" : time}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => setTime(time + 30)}
                  >
                    <Text style={[styles.buttonText, { color: colors.tint }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Add Set Button */}
        <TouchableOpacity
          style={[
            styles.addSetButton,
            {
              backgroundColor: colors.tint,
              opacity: canAddSet ? 1 : 0.4,
            },
          ]}
          onPress={handleAddSet}
          activeOpacity={0.8}
          disabled={!canAddSet}
        >
          <Text style={[styles.addSetButtonText, { color: "#ffffff" }]}>
            Add Set
          </Text>
        </TouchableOpacity>

        {/* Sets List */}
        {sets.length > 0 && (
          <View style={styles.setsContainer}>
            <Text style={[styles.setsTitle, { color: colors.text }]}>
              Sets Logged
            </Text>
            {sets.map((set, index) => (
              <TouchableOpacity
                key={set.id}
                style={[
                  styles.setRow,
                  { backgroundColor: colors.surface },
                  { borderColor: colors.border },
                  personalBest?.id === set.id && styles.setRowPB,
                ]}
                onPress={() => handleEditSet(set)}
                activeOpacity={0.6}
              >
                <View style={styles.setInfo}>
                  <Text
                    style={[styles.setNumber, { color: colors.textSecondary }]}
                  >
                    Set {index + 1}
                  </Text>
                  {personalBest?.id === set.id && (
                    <Text style={[styles.pbBadge, { color: colors.success }]}>
                      🏆 PB
                    </Text>
                  )}
                </View>
                <Text style={[styles.setData, { color: colors.text }]}>
                  {formatSetForDisplay(exerciseType, set, { weightUnit, distanceUnit })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Set Modal */}
      <EditSetModal
        visible={editingSet !== null}
        exerciseType={exerciseType}
        weight={editingSet?.weight || 0}
        reps={editingSet?.reps || 0}
        distance={editingSet?.distance || 0}
        time={editingSet?.time || 0}
        setNumber={
          editingSet
            ? sets.findIndex((s) => s.id === editingSet.id) + 1
            : undefined
        }
        onSave={handleUpdateSet}
        onDelete={() => {
          if (editingSet) {
            handleDeleteSet(editingSet.id);
            setEditingSet(null);
          }
        }}
        onClose={() => setEditingSet(null)}
      />

      {/* Rest Timer Modal */}
      <RestTimerModal
        visible={showRestTimer}
        initialTime={restTimerSettings.defaultTime}
        onClose={() => {
          setShowRestTimer(false);
          setAutoStartTimer(false);
        }}
        autoStart={autoStartTimer}
      />

      {/* Exercise Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View
          style={[
            styles.infoModalOverlay,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              styles.infoModalContent,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.infoModalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.infoModalTitle, { color: colors.text }]}>
                {exerciseName}
              </Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Text style={[styles.closeText, { color: colors.tint }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.infoModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Description Section */}
              {exerciseDescription && (
                <View
                  style={[
                    styles.descriptionSection,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.descriptionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Description
                  </Text>
                  <Text
                    style={[styles.descriptionText, { color: colors.text }]}
                  >
                    {exerciseDescription}
                  </Text>
                </View>
              )}

              {/* Estimated 1RM Section */}
              {exerciseType === "weight_reps" && estimatedOneRM !== null && (
                <View
                  style={[
                    styles.oneRMSection,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.oneRMLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Estimated 1 Rep Max
                  </Text>
                  <Text style={[styles.oneRMValue, { color: colors.tint }]}>
                    {formatOneRepMax(estimatedOneRM, weightUnit)}
                  </Text>
                  <Text
                    style={[
                      styles.oneRMDisclaimer,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Based on your best set using the Epley formula
                  </Text>
                </View>
              )}

              {/* History Section */}
              <View style={styles.historySection}>
                <Text
                  style={[styles.historyLabel, { color: colors.textSecondary }]}
                >
                  History
                </Text>
                {exerciseHistory.length === 0 ? (
                  <Text
                    style={[
                      styles.noHistoryText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    No history yet. Complete your first workout!
                  </Text>
                ) : (
                  exerciseHistory.map((entry, index) => (
                    <View
                      key={entry.date}
                      style={[
                        styles.historyEntry,
                        index < exerciseHistory.length - 1 && {
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.historyDate, { color: colors.tint }]}
                      >
                        {entry.date}
                      </Text>
                      <View style={styles.historySets}>
                        {entry.sets.map((set, setIndex) => (
                          <View key={set.id} style={styles.historySetRow}>
                            <Text
                              style={[
                                styles.historySetNumber,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Set {setIndex + 1}
                            </Text>
                            <Text
                              style={[
                                styles.historySetData,
                                { color: colors.text },
                              ]}
                            >
                              {formatSetForDisplay(exerciseType, set, { weightUnit, distanceUnit })}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pbContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  pbContainerNew: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  pbText: {
    fontSize: 15,
    fontWeight: "600",
  },
  pbNewLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoButton: {
    padding: 8,
  },
  infoIcon: {
    fontSize: 24,
  },
  stopwatchButton: {
    padding: 8,
  },
  stopwatchIcon: {
    fontSize: 24,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  closeText: {
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 8,
    gap: 16,
    height: 72,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 28,
  },
  numberField: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  visibleInput: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1,
    textAlign: "center",
    flex: 1,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  addSetButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addSetButtonText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  setsContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  setsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  setRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setRowPB: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  setInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.5,
  },
  pbBadge: {
    fontSize: 12,
    fontWeight: "700",
  },
  setData: {
    fontSize: 18,
    fontWeight: "600",
  },
  // Info Modal Styles
  infoModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  infoModalContent: {
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  infoModalScroll: {
    flex: 1,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  historyLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  noHistoryText: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  historyEntry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  historySets: {
    gap: 4,
  },
  historySetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  historySetNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  historySetData: {
    fontSize: 15,
    fontWeight: "600",
  },
  // 1RM Section Styles
  oneRMSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  oneRMLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  oneRMValue: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 4,
  },
  oneRMDisclaimer: {
    fontSize: 12,
    fontStyle: "italic",
  },
});
