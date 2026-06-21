import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  View as RNView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { ExerciseMediaPicker } from "@/components/ExerciseMediaPicker";
import { SelectModal } from "@/components/SelectModal";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  addExerciseDefinition,
  getExerciseDefinitionById,
  getUniqueCategories,
  updateExerciseDefinition,
} from "@/db/database";
import type { ExerciseType } from "@/types/workout";
import { generateId } from "@/utils/id";
import { deleteExerciseMediaFile, type ExerciseMedia } from "@/utils/media";

interface ExerciseDefinition {
  id?: string;
  name: string;
  category: string;
  type: ExerciseType;
  unit: string;
  description?: string;
  mediaUri?: string | null;
  mediaType?: "image" | "video" | null;
}

export default function AddExerciseDefinitionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();

  const [exercise, setExercise] = useState<ExerciseDefinition>({
    name: "",
    category: "",
    type: "weight_reps",
    unit: "kg",
    description: "",
    mediaUri: null,
    mediaType: null,
  });
  // The media URI as currently saved in the DB, used to know which file to
  // clean up once a replacement is actually saved (or discard a new pick on cancel)
  const [originalMediaUri, setOriginalMediaUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!editId);

  const handleMediaChange = async (media: ExerciseMedia | null) => {
    // Clean up a previously picked-but-unsaved file before replacing it
    if (exercise.mediaUri && exercise.mediaUri !== originalMediaUri) {
      await deleteExerciseMediaFile(exercise.mediaUri);
    }
    setExercise((prev) => ({
      ...prev,
      mediaUri: media?.uri ?? null,
      mediaType: media?.type ?? null,
    }));
  };

  const handleDiscardAndClose = async () => {
    if (exercise.mediaUri && exercise.mediaUri !== originalMediaUri) {
      await deleteExerciseMediaFile(exercise.mediaUri);
    }
    router.back();
  };

  // Android's hardware back button bypasses the header's close button (and
  // its media cleanup) entirely unless intercepted here
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleDiscardAndClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [exercise.mediaUri, originalMediaUri]);

  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [activeSelector, setActiveSelector] = useState<
    "category" | "type" | "unit" | null
  >(null);

  // Load existing categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getUniqueCategories();
        setExistingCategories(categories);

        // Default to the first category for new exercises only - never for
        // an exercise being edited (its category comes from loadDefinition
        // below). Checking prev.category via a functional update (rather
        // than the `exercise` closed over when this effect was scheduled)
        // also avoids clobbering a category that loadDefinition sets later,
        // regardless of which of the two requests resolves first.
        if (!editId && categories.length > 0) {
          setExercise((prev) =>
            prev.category ? prev : { ...prev, category: categories[0] },
          );
        }
      } catch (error) {

      }
    };

    loadCategories();
  }, [editId]);

  // Load the existing definition when editing
  useEffect(() => {
    if (!editId) return;

    const loadDefinition = async () => {
      try {
        const definition = await getExerciseDefinitionById(editId);
        if (definition) {
          setExercise({
            id: definition.id,
            name: definition.name,
            category: definition.category,
            type: definition.type as ExerciseType,
            unit: definition.unit,
            description: definition.description || "",
            mediaUri: definition.mediaUri,
            mediaType: definition.mediaType as "image" | "video" | null,
          });
          setOriginalMediaUri(definition.mediaUri);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load exercise");
      } finally {
        setIsLoading(false);
      }
    };

    loadDefinition();
  }, [editId]);

  const exerciseTypes: { label: string; value: ExerciseType }[] = [
    { label: "Weight & Reps", value: "weight_reps" },
    { label: "Distance & Time", value: "distance_time" },
    { label: "Weight & Distance", value: "weight_distance" },
    { label: "Weight & Time", value: "weight_time" },
    { label: "Reps & Distance", value: "reps_distance" },
    { label: "Reps & Time", value: "reps_time" },
    { label: "Weight Only", value: "weight" },
    { label: "Reps Only", value: "reps" },
    { label: "Distance Only", value: "distance" },
    { label: "Time (Duration)", value: "time_duration" },
    { label: "Time (Speed)", value: "time_speed" },
  ];

  const handleSave = async () => {
    if (!exercise.name.trim()) {
      Alert.alert("Error", "Exercise name is required");
      return;
    }

    // Use custom category if in custom mode
    const finalCategory = isCustomCategory ? customCategory.trim() : exercise.category;
    
    if (!finalCategory) {
      Alert.alert("Error", "Category is required");
      return;
    }

    try {
      if (exercise.id) {
        // Update existing definition
        await updateExerciseDefinition(exercise.id, {
          name: exercise.name,
          category: finalCategory,
          type: exercise.type,
          unit: exercise.unit,
          description: exercise.description || undefined,
          mediaUri: exercise.mediaUri ?? null,
          mediaType: exercise.mediaType ?? null,
        });
        if (originalMediaUri && originalMediaUri !== exercise.mediaUri) {
          deleteExerciseMediaFile(originalMediaUri);
        }
      } else {
        // Create new definition
        await addExerciseDefinition({
          id: generateId(),
          name: exercise.name,
          category: finalCategory,
          type: exercise.type,
          unit: exercise.unit,
          description: exercise.description || undefined,
          mediaUri: exercise.mediaUri || undefined,
          mediaType: exercise.mediaType || undefined,
        });
      }

      router.back();
    } catch (error) {

      Alert.alert("Error", "Failed to save exercise definition");
    }
  };

  // Saves the currently-shown (possibly edited) details as a brand new
  // exercise definition, then opens that new copy for further editing.
  // Media isn't carried over - deleting either exercise would otherwise
  // delete the shared file out from under the other one.
  const handleSaveCopy = async () => {
    if (!exercise.name.trim()) {
      Alert.alert("Error", "Exercise name is required");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : exercise.category;
    if (!finalCategory) {
      Alert.alert("Error", "Category is required");
      return;
    }

    const newId = generateId();
    try {
      await addExerciseDefinition({
        id: newId,
        name: `Copy of ${exercise.name}`,
        category: finalCategory,
        type: exercise.type,
        unit: exercise.unit,
        description: exercise.description || undefined,
      });
      router.push({
        pathname: "/add-exercise-definition",
        params: { id: newId },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to save a copy");
    }
  };

  const handleMenuPress = () => {
    Alert.alert(exercise.name || "Exercise", undefined, [
      { text: "Save a Copy", onPress: handleSaveCopy },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const getUnitsForType = (type: ExerciseType = exercise.type) => {
    if (type.includes("weight") && !type.includes("distance")) {
      return ["kg", "lbs"];
    } else if (type.includes("distance") && !type.includes("weight")) {
      return ["km", "miles", "meters", "yards"];
    } else if (type.includes("weight") && type.includes("distance")) {
      return ["kg", "lbs"];
    } else {
      return ["kg", "lbs", "km", "miles", "meters", "yards"];
    }
  };

  const handleCategoryChange = (value: string) => {
    setActiveSelector(null);
    if (value === "__CUSTOM__") {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
      setExercise((prev) => ({ ...prev, category: value }));
    }
  };

  const handleTypeChange = (value: string) => {
    setActiveSelector(null);
    const newType = value as ExerciseType;
    const unitsForNewType = getUnitsForType(newType);
    setExercise((prev) => ({
      ...prev,
      type: newType,
      unit: unitsForNewType.includes(prev.unit)
        ? prev.unit
        : unitsForNewType[0],
    }));
  };

  const handleUnitChange = (value: string) => {
    setActiveSelector(null);
    setExercise((prev) => ({ ...prev, unit: value }));
  };

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
        <TouchableOpacity onPress={handleDiscardAndClose} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {exercise.id ? "Edit Exercise" : "Add Exercise"}
        </Text>
        <View style={styles.headerActions}>
          {exercise.id && (
            <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
              <FontAwesome name="ellipsis-v" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { color: colors.tint }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
      <>
      {/* Form */}
      <ScrollView
        style={[styles.formContainer, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Exercise Name
          </Text>
          <RNView
            style={[
              styles.textInputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={exercise.name}
              onChangeText={(text) => setExercise({ ...exercise, name: text })}
              placeholder="e.g., Bench Press"
              placeholderTextColor={colors.textSecondary}
            />
          </RNView>
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>

          <TouchableOpacity
            style={[
              styles.selectField,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setActiveSelector("category")}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.selectFieldText, { color: colors.text }]}
              numberOfLines={1}
            >
              {isCustomCategory
                ? customCategory || "New Category"
                : exercise.category || "Select a category"}
            </Text>
            <FontAwesome
              name="chevron-down"
              size={14}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Custom Category Input */}
          {isCustomCategory && (
            <RNView
              style={[
                styles.textInputContainer,
                { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Enter new category name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </RNView>
          )}
        </View>

        {/* Exercise Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Log Type</Text>
          <TouchableOpacity
            style={[
              styles.selectField,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setActiveSelector("type")}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.selectFieldText, { color: colors.text }]}
              numberOfLines={1}
            >
              {exerciseTypes.find((t) => t.value === exercise.type)?.label ??
                "Select a log type"}
            </Text>
            <FontAwesome
              name="chevron-down"
              size={14}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Unit */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
          <TouchableOpacity
            style={[
              styles.selectField,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setActiveSelector("unit")}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.selectFieldText, { color: colors.text }]}
              numberOfLines={1}
            >
              {exercise.unit || "Select a unit"}
            </Text>
            <FontAwesome
              name="chevron-down"
              size={14}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Description/Notes (Optional)
          </Text>
          <RNView
            style={[
              styles.textInputContainer,
              styles.textAreaContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { color: colors.text },
              ]}
              value={exercise.description}
              onChangeText={(text) =>
                setExercise({ ...exercise, description: text })
              }
              placeholder="e.g., Keep elbows tucked, control the weight"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </RNView>
        </View>

        {/* Photo / Video */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Photo / Video (Optional)
          </Text>
          <ExerciseMediaPicker
            mediaUri={exercise.mediaUri ?? null}
            mediaType={exercise.mediaType ?? null}
            onChange={handleMediaChange}
          />
        </View>
      </ScrollView>

      <SelectModal
        visible={activeSelector === "category"}
        title="Category"
        options={[
          ...existingCategories.map((category) => ({
            label: category,
            value: category,
          })),
          { label: "+ New Category", value: "__CUSTOM__" },
        ]}
        selectedValue={isCustomCategory ? "__CUSTOM__" : exercise.category}
        onSelect={handleCategoryChange}
        onClose={() => setActiveSelector(null)}
      />

      <SelectModal
        visible={activeSelector === "type"}
        title="Log Type"
        options={exerciseTypes}
        selectedValue={exercise.type}
        onSelect={handleTypeChange}
        onClose={() => setActiveSelector(null)}
      />

      <SelectModal
        visible={activeSelector === "unit"}
        title="Unit"
        options={getUnitsForType().map((unit) => ({
          label: unit,
          value: unit,
        }))}
        selectedValue={exercise.unit}
        onSelect={handleUnitChange}
        onClose={() => setActiveSelector(null)}
      />
      </>
      )}
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuButton: {
    padding: 8,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 14,
  },
  textAreaContainer: {
    minHeight: 120,
  },
  textArea: {
    textAlignVertical: "top",
    paddingVertical: 14,
  },
  selectField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectFieldText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
});
