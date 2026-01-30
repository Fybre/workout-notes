import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  View as RNView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { addExerciseDefinition, getUniqueCategories } from "@/db/database";
import type { ExerciseType } from "@/types/workout";
import { generateId } from "@/utils/id";

interface ExerciseDefinition {
  id?: string;
  name: string;
  category: string;
  type: ExerciseType;
  unit: string;
  description?: string;
}

export default function AddExerciseDefinitionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [exercise, setExercise] = useState<ExerciseDefinition>({
    name: "",
    category: "",
    type: "weight_reps",
    unit: "kg",
    description: "",
  });

  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Load existing categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getUniqueCategories();
        setExistingCategories(categories);
        
        // Set default category if available
        if (categories.length > 0 && !exercise.category) {
          setExercise(prev => ({ ...prev, category: categories[0] }));
        }
      } catch (error) {

      }
    };

    loadCategories();
  }, []);

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
      // Save to database
      await addExerciseDefinition({
        id: generateId(),
        name: exercise.name,
        category: finalCategory,
        type: exercise.type,
        unit: exercise.unit,
        description: exercise.description || undefined,
      });

      Alert.alert("Success", "Exercise definition saved successfully");
      router.back();
    } catch (error) {

      Alert.alert("Error", "Failed to save exercise definition");
    }
  };

  const getUnitsForType = () => {
    if (
      exercise.type.includes("weight") &&
      !exercise.type.includes("distance")
    ) {
      return ["kg", "lbs"];
    } else if (
      exercise.type.includes("distance") &&
      !exercise.type.includes("weight")
    ) {
      return ["km", "miles", "meters", "yards"];
    } else if (
      exercise.type.includes("weight") &&
      exercise.type.includes("distance")
    ) {
      return ["kg", "lbs"];
    } else {
      return ["kg", "lbs", "km", "miles", "meters", "yards"];
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "__CUSTOM__") {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
      setExercise({ ...exercise, category: value });
    }
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
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {exercise.id ? "Edit Exercise" : "Add Exercise"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={[styles.saveButtonText, { color: colors.tint }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

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
          
          {/* Category Picker */}
          <RNView
            style={[
              styles.pickerContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Picker
              selectedValue={isCustomCategory ? "__CUSTOM__" : exercise.category}
              onValueChange={handleCategoryChange}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.tint}
            >
              {existingCategories.map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
              <Picker.Item label="+ New Category" value="__CUSTOM__" />
            </Picker>
          </RNView>

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
          <RNView
            style={[
              styles.pickerContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Picker
              selectedValue={exercise.type}
              onValueChange={(itemValue: string) =>
                setExercise({
                  ...exercise,
                  type: itemValue as ExerciseType,
                  unit: getUnitsForType().includes(exercise.unit)
                    ? exercise.unit
                    : getUnitsForType()[0],
                })
              }
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.tint}
            >
              {exerciseTypes.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
          </RNView>
        </View>

        {/* Unit */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
          <RNView
            style={[
              styles.pickerContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Picker
              selectedValue={exercise.unit}
              onValueChange={(itemValue: string) =>
                setExercise({ ...exercise, unit: itemValue })
              }
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.tint}
            >
              {getUnitsForType().map((unit) => (
                <Picker.Item key={unit} label={unit} value={unit} />
              ))}
            </Picker>
          </RNView>
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
      </ScrollView>
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 56,
    width: "100%",
  },
});
