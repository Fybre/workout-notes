/**
 * Exercise Picker Modal
 * Allows selecting exercises for chart display
 */

import { Modal, ScrollView, TouchableOpacity, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import type { ThemeColors } from "./types";

interface ExercisePickerModalProps {
  visible: boolean;
  exercises: { name: string; type: string }[];
  selectedExercises: { name: string; color: string }[];
  colors: ThemeColors;
  onSelect: (exerciseName: string) => void;
  onClose: () => void;
}

export function ExercisePickerModal({
  visible,
  exercises,
  selectedExercises,
  colors,
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Exercise
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.exerciseList}>
            {exercises.length === 0 ? (
              <Text style={[styles.noExercisesText, { color: colors.textSecondary }]}>
                No exercises with data yet. Log some workouts first!
              </Text>
            ) : (
              exercises.map((exercise) => {
                const isSelected = selectedExercises.find((e) => e.name === exercise.name);
                return (
                  <TouchableOpacity
                    key={exercise.name}
                    style={[
                      styles.exerciseListItem,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: `${colors.tint}20` },
                    ]}
                    onPress={() => {
                      if (!isSelected) {
                        onSelect(exercise.name);
                      }
                      onClose();
                    }}
                    disabled={!!isSelected}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.exerciseListText, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    {isSelected && (
                      <Text style={[styles.selectedIndicator, { color: colors.tint }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeText: {
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 32,
  },
  exerciseList: {
    paddingHorizontal: 16,
  },
  exerciseListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  exerciseListText: {
    fontSize: 16,
    fontWeight: "500",
  },
  selectedIndicator: {
    fontSize: 18,
    fontWeight: "700",
  },
  noExercisesText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
  },
});
