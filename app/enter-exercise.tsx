import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import EditSetModal from "@/components/EditSetModal";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  addExerciseDefinition,
  addExerciseWithDefinition,
  addSet,
  deleteSet,
  getExerciseDefinitionByName,
  getLastExerciseByName,
  updateSet,
} from "@/db/database";
import type { ExerciseType } from "@/types/workout";
import {
  formatSetForDisplay,
  getExerciseTypeFields,
  validateSet,
} from "@/utils/format";
import { generateId } from "@/utils/id";

/**
 * Increment constants for +/- buttons
 */
const WEIGHT_INCREMENT = 2.5;
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
  } = useLocalSearchParams<{
    exerciseName: string;
    exerciseId?: string;
    exerciseType?: ExerciseType;
    exerciseSets?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [weight, setWeight] = useState<number>(0);
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

  // Populate input values based on history
  useEffect(() => {
    const populateFromHistory = async () => {
      // Case 2: Editing today's exercise - use the last set's values
      if (paramSets) {
        try {
          const parsedSets = JSON.parse(paramSets);
          if (parsedSets.length > 0) {
            const lastSet = parsedSets[parsedSets.length - 1];
            setWeight(lastSet.weight ?? 0);
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
        const today = new Date().toISOString().split("T")[0];
        const lastExercise = await getLastExerciseByName(exerciseName, today);

        if (lastExercise && lastExercise.sets.length > 0) {
          // Use the FIRST set from the last session
          const firstSet = lastExercise.sets[0];
          setWeight(firstSet.weight ?? 0);
          setReps(firstSet.reps ?? 0);
          setDistance(firstSet.distance ?? 0);
          setTime(firstSet.time ?? 0);
        }
        // Case 1: No history - inputs remain at 0 (blank)
      }
    };

    populateFromHistory();
  }, [exerciseName, paramSets]);

  const handleAddSet = async () => {
    // Validate based on exercise type
    const isValid = validateSet(exerciseType, { weight, reps, distance, time });

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
        const today = new Date().toISOString().split("T")[0];

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
            date: today,
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
      weight: exerciseType.includes("weight") ? weight : undefined,
      reps: exerciseType.includes("reps") ? reps : undefined,
      distance: exerciseType.includes("distance") ? distance : undefined,
      time: exerciseType.includes("time") ? time : undefined,
    };

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
    // Keep the current values for quick entry of another set
    // Don't reset the inputs

    // Provide haptic feedback to confirm set was added
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Silently fail if haptics are not available/supported
      console.log("Haptic feedback not available:", error);
    }
  };

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
    setWeight(set.weight || 0);
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
      // Either came from home screen or sets were added - go to home screen
      router.replace("/");
    }
  };

  const handleWeightChange = (text: string) => {
    const num = parseFloat(text) || 0;
    setWeight(num);
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
  const canAddSet = validateSet(exerciseType, { weight, reps, distance, time });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {exerciseName}
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Sections Container */}
        <View style={{ flexDirection: "column", gap: 4, alignItems: "center" }}>
          <View style={{ width: "80%" }}>
            {/* Weight Input Section */}
            {fields.weight && (
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Weight (kg)
                </Text>
                <View
                  style={[styles.inputRow, { backgroundColor: colors.surface }]}
                >
                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() =>
                      setWeight(Math.max(0, weight - WEIGHT_INCREMENT))
                    }
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
                      value={weight.toString()}
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
                        {weight === 0 ? "—" : weight.toFixed(1)}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.button, { borderColor: colors.tint }]}
                    onPress={() => setWeight(weight + WEIGHT_INCREMENT)}
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
                ]}
                onPress={() => handleEditSet(set)}
                activeOpacity={0.6}
              >
                <Text
                  style={[styles.setNumber, { color: colors.textSecondary }]}
                >
                  Set {index + 1}
                </Text>
                <Text style={[styles.setData, { color: colors.text }]}>
                  {formatSetForDisplay(exerciseType, set)}
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
    </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
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
  setNumber: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.5,
  },
  setData: {
    fontSize: 18,
    fontWeight: "600",
  },
});
