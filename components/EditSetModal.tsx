import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import type { ExerciseType } from "@/types";
import { getExerciseTypeFields, validateSet } from "@/utils/format";

const WEIGHT_INCREMENT = 2.5;
const REPS_INCREMENT = 1;
const DISTANCE_INCREMENT = 0.5;
const TIME_INCREMENT = 30;

interface EditSetModalProps {
  visible: boolean;
  exerciseType: ExerciseType;
  weight: number;
  reps: number;
  distance: number;
  time: number;
  note?: string;
  setNumber?: number;
  onSave: (updates: {
    weight?: number;
    reps?: number;
    distance?: number;
    time?: number;
    note?: string;
  }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function EditSetModal({
  visible,
  exerciseType,
  weight: initialWeight,
  reps: initialReps,
  distance: initialDistance,
  time: initialTime,
  note: initialNote,
  setNumber,
  onSave,
  onDelete,
  onClose,
}: EditSetModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [weight, setWeight] = useState<number>(initialWeight);
  const [reps, setReps] = useState<number>(initialReps);
  const [distance, setDistance] = useState<number>(initialDistance);
  const [time, setTime] = useState<number>(initialTime);
  const [note, setNote] = useState<string>(initialNote || "");
  const [weightInputVisible, setWeightInputVisible] = useState(false);
  const [repsInputVisible, setRepsInputVisible] = useState(false);
  const [distanceInputVisible, setDistanceInputVisible] = useState(false);
  const [timeInputVisible, setTimeInputVisible] = useState(false);

  const fields = getExerciseTypeFields(exerciseType);

  // Sync state when modal becomes visible or props change
  useEffect(() => {
    if (visible) {
      setWeight(initialWeight);
      setReps(initialReps);
      setDistance(initialDistance);
      setTime(initialTime);
      setNote(initialNote || "");
      setWeightInputVisible(false);
      setRepsInputVisible(false);
      setDistanceInputVisible(false);
      setTimeInputVisible(false);
    }
  }, [visible, initialWeight, initialReps, initialDistance, initialTime, initialNote]);

  const handleSave = () => {
    if (!validateSet(exerciseType, { weight, reps, distance, time })) {
      Alert.alert("Invalid", "Please enter valid values for this exercise");
      return;
    }

    const updates: {
      weight?: number;
      reps?: number;
      distance?: number;
      time?: number;
      note?: string;
    } = {};
    if (fields.weight) updates.weight = weight;
    if (fields.reps) updates.reps = reps;
    if (fields.distance) updates.distance = distance;
    if (fields.time) updates.time = time;
    if (note.trim()) updates.note = note.trim();

    onSave(updates);
    handleClose();
  };

  const handleDelete = () => {
    Alert.alert("Delete Set", "Are you sure you want to delete this set?", [
      {
        text: "Delete",
        onPress: () => {
          onDelete();
        },
        style: "destructive",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleClose = () => {
    setWeight(initialWeight);
    setReps(initialReps);
    setDistance(initialDistance);
    setTime(initialTime);
    setNote(initialNote || "");
    setWeightInputVisible(false);
    setRepsInputVisible(false);
    setDistanceInputVisible(false);
    setTimeInputVisible(false);
    onClose();
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View
          style={[styles.modalView, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <Text style={[styles.title, { color: colors.text }]}>
            {setNumber ? `Edit Set ${setNumber}` : "Edit Set"}
          </Text>

          {/* Weight Input Section */}
          {fields.weight && (
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Weight (kg)
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.background },
                ]}
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
                      { color: colors.text, backgroundColor: colors.background },
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
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.background },
                ]}
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
                      { color: colors.text, backgroundColor: colors.background },
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
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.background },
                ]}
              >
                <TouchableOpacity
                  style={[styles.button, { borderColor: colors.tint }]}
                  onPress={() =>
                    setDistance(Math.max(0, distance - DISTANCE_INCREMENT))
                  }
                >
                  <Text style={[styles.buttonText, { color: colors.tint }]}>
                    −
                  </Text>
                </TouchableOpacity>

                {distanceInputVisible ? (
                  <TextInput
                    style={[
                      styles.visibleInput,
                      { color: colors.text, backgroundColor: colors.background },
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
                  onPress={() => setDistance(distance + DISTANCE_INCREMENT)}
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
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.background },
                ]}
              >
                <TouchableOpacity
                  style={[styles.button, { borderColor: colors.tint }]}
                  onPress={() => setTime(Math.max(0, time - TIME_INCREMENT))}
                >
                  <Text style={[styles.buttonText, { color: colors.tint }]}>
                    −
                  </Text>
                </TouchableOpacity>

                {timeInputVisible ? (
                  <TextInput
                    style={[
                      styles.visibleInput,
                      { color: colors.text, backgroundColor: colors.background },
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
                  onPress={() => setTime(time + TIME_INCREMENT)}
                >
                  <Text style={[styles.buttonText, { color: colors.tint }]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Note Input Section */}
          <View style={styles.noteSection}>
            <Text style={[styles.label, { color: colors.text }]}>
              Note (optional)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
              ]}
              placeholder="Add a note..."
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={100}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.saveButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={handleSave}
            >
              <Text style={[styles.actionButtonText, { color: "#ffffff" }]}>
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={[styles.actionButtonText, { color: "#ff3b30" }]}>
                Delete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 12,
    height: 56,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "500",
  },
  numberField: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    fontSize: 32,
    fontWeight: "600",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  visibleInput: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  buttonGroup: {
    marginTop: 24,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    marginBottom: 4,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#ff3b30",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#6b7280",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  noteSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  noteInput: {
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: "top",
  },
});
