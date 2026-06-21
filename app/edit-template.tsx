import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectModal } from "@/components/SelectModal";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  getAllExerciseDefinitions,
  getTemplateById,
  getTemplateExercises,
  updateTemplate,
} from "@/db/database";

interface TemplateExerciseItem {
  id: string;
  name: string;
  category: string;
  type: string;
}

export default function EditTemplateScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { id: templateId } = useLocalSearchParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [exercises, setExercises] = useState<TemplateExerciseItem[]>([]);
  const [allExerciseDefinitions, setAllExerciseDefinitions] = useState<
    TemplateExerciseItem[]
  >([]);
  const [showAddExercise, setShowAddExercise] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [template, templateExercises, allDefinitions] =
          await Promise.all([
            getTemplateById(templateId),
            getTemplateExercises(templateId),
            getAllExerciseDefinitions(),
          ]);

        if (!template) {
          Alert.alert("Error", "Template not found");
          router.back();
          return;
        }

        setTemplateName(template.name);
        setExercises(templateExercises);
        setAllExerciseDefinitions(
          allDefinitions.map((def) => ({
            id: def.id,
            name: def.name,
            category: def.category,
            type: def.type,
          })),
        );
      } catch (error) {
        Alert.alert("Error", "Failed to load template");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [templateId, router]);

  const availableToAdd = useMemo(() => {
    const existingIds = new Set(exercises.map((ex) => ex.id));
    return allExerciseDefinitions.filter((def) => !existingIds.has(def.id));
  }, [exercises, allExerciseDefinitions]);

  const moveExercise = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    setExercises((prev) => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleRemoveExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleAddExercise = (definitionId: string) => {
    setShowAddExercise(false);
    const definition = allExerciseDefinitions.find(
      (def) => def.id === definitionId,
    );
    if (definition) {
      setExercises((prev) => [...prev, definition]);
    }
  };

  const handleDiscard = () => {
    router.back();
  };

  const handleSave = async () => {
    const name = templateName.trim();
    if (!name) {
      Alert.alert("Error", "Template name is required");
      return;
    }

    try {
      await updateTemplate(
        templateId,
        name,
        exercises.map((ex) => ex.id),
      );
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save template");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    );
  }

  return (
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
        <TouchableOpacity onPress={handleDiscard} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Template
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={[styles.saveButtonText, { color: colors.tint }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Template Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Template Name
          </Text>
          <View
            style={[
              styles.textInputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="e.g., Push Day"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Exercises ({exercises.length})
          </Text>

          {exercises.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exercises in this template
            </Text>
          ) : (
            exercises.map((exercise, index) => (
              <View
                key={exercise.id}
                style={[
                  styles.exerciseRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    onPress={() => moveExercise(index, -1)}
                    disabled={index === 0}
                    style={styles.reorderButton}
                    hitSlop={8}
                  >
                    <FontAwesome
                      name="chevron-up"
                      size={14}
                      color={index === 0 ? colors.border : colors.tint}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveExercise(index, 1)}
                    disabled={index === exercises.length - 1}
                    style={styles.reorderButton}
                    hitSlop={8}
                  >
                    <FontAwesome
                      name="chevron-down"
                      size={14}
                      color={
                        index === exercises.length - 1
                          ? colors.border
                          : colors.tint
                      }
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseInfo}>
                  <Text
                    style={[styles.exerciseName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {exercise.name}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseCategory,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {exercise.category}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleRemoveExercise(exercise.id)}
                  style={styles.removeButton}
                  hitSlop={8}
                >
                  <FontAwesome name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            style={[
              styles.addExerciseButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setShowAddExercise(true)}
            activeOpacity={0.7}
          >
            <FontAwesome name="plus" size={14} color={colors.tint} />
            <Text style={[styles.addExerciseText, { color: colors.tint }]}>
              Add Exercise
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SelectModal
        visible={showAddExercise}
        title="Add Exercise"
        options={availableToAdd.map((def) => ({
          label: def.name,
          value: def.id,
        }))}
        selectedValue=""
        onSelect={handleAddExercise}
        onClose={() => setShowAddExercise(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  saveButton: {
    padding: 8,
    marginLeft: -8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
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
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 10,
  },
  reorderButtons: {
    gap: 2,
  },
  reorderButton: {
    padding: 4,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
