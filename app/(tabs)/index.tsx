import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useDatabase } from "@/contexts/DatabaseContext";
import { deleteExercise, getExercisesForDate } from "@/db/database";
import type { Exercise, ExerciseType } from "@/types";
import { formatSetForDisplay } from "@/utils/format";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const { isReady: dbReady } = useDatabase();

  // Load today's exercises when screen comes into focus and db is ready
  useFocusEffect(
    useCallback(() => {
      if (!dbReady) return;

      const loadExercises = async () => {
        try {
          const today = new Date().toISOString().split("T")[0];
          const data = await getExercisesForDate(today);
          setExercises(
            data.map((ex) => ({ ...ex, type: ex.type as ExerciseType })),
          );
        } catch (error) {
          console.error("Failed to load exercises:", error);
          setExercises([]);
        }
      };

      loadExercises();
    }, [dbReady]),
  );

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleStartExercise = () => {
    router.push("/select-exercise");
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
              const today = new Date().toISOString().split("T")[0];
              const updatedExercises = await getExercisesForDate(today);
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
        {/* Header: Today's Date */}
        <View style={styles.header}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {dateString}
          </Text>
        </View>

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
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    <Text
                      style={[styles.setCount, { color: colors.textSecondary }]}
                    >
                      {exercise.sets.length}{" "}
                      {exercise.sets.length === 1 ? "set" : "sets"}
                    </Text>
                    <RNView style={styles.setsPreview}>
                      {exercise.sets.map((set) => (
                        <RNText
                          key={set.id}
                          style={[
                            styles.setPreview,
                            {
                              color: colors.tint,
                              backgroundColor: `${colors.tint}15`,
                            },
                          ]}
                        >
                          {formatSetForDisplay(exercise.type, set)}
                        </RNText>
                      ))}
                    </RNView>
                  </TouchableOpacity>
                </Swipeable>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No exercises yet today
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
  },
  dateText: {
    fontSize: 24,
    fontWeight: "600",
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
});
