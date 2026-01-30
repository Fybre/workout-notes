import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  View as RNView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  deleteExerciseDefinition,
  getAllExerciseDefinitions,
  getUniqueCategories,
  updateExerciseDefinition,
} from "@/db/database";
import type { ExerciseType } from "@/types/workout";
import { Picker } from "@react-native-picker/picker";
import { Modal } from "react-native";

interface ExerciseDefinition {
  id: string;
  name: string;
  category: string;
  type: ExerciseType;
  unit: string;
  description: string | null;
}

export default function ManageExercisesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Edit modal state
  const [editingExercise, setEditingExercise] =
    useState<ExerciseDefinition | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Bulk category change state
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [isBulkCustomCategory, setIsBulkCustomCategory] = useState(false);
  const [bulkCustomCategory, setBulkCustomCategory] = useState("");

  // Load exercises
  const loadExercises = useCallback(async () => {
    try {
      const [defs, cats] = await Promise.all([
        getAllExerciseDefinitions(),
        getUniqueCategories(),
      ]);
      setExercises(
        defs.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          type: d.type as ExerciseType,
          unit: d.unit,
          description: d.description,
        })),
      );
      setCategories(cats);
    } catch (error) {
      Alert.alert("Error", "Failed to load exercises");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises]),
  );

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises;
    const query = searchQuery.toLowerCase();
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(query) ||
        ex.category.toLowerCase().includes(query),
    );
  }, [exercises, searchQuery]);

  // Group by category
  const groupedExercises = useMemo(() => {
    const groups = new Map<string, ExerciseDefinition[]>();
    for (const ex of filteredExercises) {
      if (!groups.has(ex.category)) {
        groups.set(ex.category, []);
      }
      groups.get(ex.category)!.push(ex);
    }
    return groups;
  }, [filteredExercises]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredExercises.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set<string>(filteredExercises.map((ex) => ex.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      "Delete Exercises",
      `Are you sure you want to delete ${selectedIds.size} exercise(s)? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              for (const id of Array.from(selectedIds)) {
                await deleteExerciseDefinition(id);
              }
              setSelectedIds(new Set());
              setIsSelectionMode(false);
              loadExercises();
            } catch (error) {
              Alert.alert("Error", "Failed to delete exercises");
            }
          },
        },
      ],
    );
  };

  const handleEditExercise = (exercise: ExerciseDefinition) => {
    setEditingExercise({ ...exercise });
    setIsCustomCategory(!categories.includes(exercise.category));
    setCustomCategory(
      !categories.includes(exercise.category) ? exercise.category : "",
    );
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExercise) return;

    const finalCategory = isCustomCategory
      ? customCategory.trim()
      : editingExercise.category;

    if (!editingExercise.name.trim()) {
      Alert.alert("Error", "Exercise name is required");
      return;
    }

    if (!finalCategory) {
      Alert.alert("Error", "Category is required");
      return;
    }

    try {
      await updateExerciseDefinition(editingExercise.id, {
        name: editingExercise.name.trim(),
        category: finalCategory,
        type: editingExercise.type,
        unit: editingExercise.unit,
        description: editingExercise.description || undefined,
      });
      setShowEditModal(false);
      setEditingExercise(null);
      loadExercises();
    } catch (error) {
      Alert.alert("Error", "Failed to update exercise");
    }
  };

  const handleBulkCategoryChange = () => {
    if (selectedIds.size === 0) return;
    setBulkCategory(categories[0] || "");
    setIsBulkCustomCategory(false);
    setBulkCustomCategory("");
    setShowBulkCategoryModal(true);
  };

  const handleApplyBulkCategory = async () => {
    const finalCategory = isBulkCustomCategory
      ? bulkCustomCategory.trim()
      : bulkCategory;

    if (!finalCategory) {
      Alert.alert("Error", "Category is required");
      return;
    }

    try {
      for (const id of selectedIds) {
        const exercise = exercises.find((ex) => ex.id === id);
        if (exercise) {
          await updateExerciseDefinition(id, {
            category: finalCategory,
          });
        }
      }
      setShowBulkCategoryModal(false);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      loadExercises();
    } catch (error) {
      Alert.alert("Error", "Failed to update categories");
    }
  };

  const getExerciseTypeLabel = (type: ExerciseType) => {
    const labels: Record<ExerciseType, string> = {
      weight_reps: "Weight & Reps",
      weight: "Weight Only",
      reps: "Reps Only",
      distance: "Distance Only",
      time_duration: "Duration",
      time_speed: "Time Trial",
      distance_time: "Distance & Time",
      weight_distance: "Weight & Distance",
      weight_time: "Weight & Time",
      reps_distance: "Reps & Distance",
      reps_time: "Reps & Time",
    };
    return labels[type] || type;
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
          Manage Exercises
        </Text>
        <View style={styles.headerRight}>
          {!isSelectionMode ? (
            <TouchableOpacity
              onPress={() => setIsSelectionMode(true)}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, { color: colors.tint }]}>
                Select
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={clearSelection}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, { color: colors.tint }]}>
                Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <RNView
          style={[
            styles.searchInputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FontAwesome
            name="search"
            size={16}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome
                name="times-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </RNView>
      </View>

      {/* Selection Actions */}
      {isSelectionMode && (
        <View
          style={[styles.selectionBar, { backgroundColor: colors.surface }]}
        >
          <TouchableOpacity
            onPress={toggleSelectAll}
            style={styles.selectionAction}
          >
            <Text style={[styles.selectionActionText, { color: colors.tint }]}>
              {selectedIds.size === filteredExercises.length
                ? "Deselect All"
                : "Select All"}
            </Text>
          </TouchableOpacity>
          <Text
            style={[styles.selectionCount, { color: colors.textSecondary }]}
          >
            {selectedIds.size} selected
          </Text>
        </View>
      )}

      {/* Bulk Actions */}
      {isSelectionMode && selectedIds.size > 0 && (
        <View style={[styles.bulkActions, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={handleBulkCategoryChange}
            style={[
              styles.bulkActionButton,
              { backgroundColor: `${colors.tint}20` },
            ]}
          >
            <FontAwesome name="tags" size={16} color={colors.tint} />
            <Text style={[styles.bulkActionText, { color: colors.tint }]}>
              Change Category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            style={[styles.bulkActionButton, { backgroundColor: "#fef2f2" }]}
          >
            <FontAwesome name="trash" size={16} color="#ef4444" />
            <Text style={[styles.bulkActionText, { color: "#ef4444" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery
                ? "No exercises match your search"
                : "No exercises found"}
            </Text>
          </View>
        ) : (
          Array.from(groupedExercises.entries()).map(
            ([category, categoryExercises]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: colors.tint }]}>
                  {category} ({categoryExercises.length})
                </Text>
                {categoryExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[
                      styles.exerciseRow,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      selectedIds.has(exercise.id) && {
                        backgroundColor: `${colors.tint}15`,
                        borderColor: colors.tint,
                      },
                    ]}
                    onPress={() =>
                      isSelectionMode
                        ? toggleSelection(exercise.id)
                        : handleEditExercise(exercise)
                    }
                    onLongPress={() => {
                      if (!isSelectionMode) {
                        setIsSelectionMode(true);
                        toggleSelection(exercise.id);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {isSelectionMode && (
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: selectedIds.has(exercise.id)
                              ? colors.tint
                              : colors.border,
                            backgroundColor: selectedIds.has(exercise.id)
                              ? colors.tint
                              : "transparent",
                          },
                        ]}
                      >
                        {selectedIds.has(exercise.id) && (
                          <FontAwesome name="check" size={12} color="#fff" />
                        )}
                      </View>
                    )}
                    <View style={styles.exerciseInfo}>
                      <Text
                        style={[styles.exerciseName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {exercise.name}
                      </Text>
                      <Text
                        style={[
                          styles.exerciseType,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {getExerciseTypeLabel(exercise.type)} • {exercise.unit}
                      </Text>
                    </View>
                    {!isSelectionMode && (
                      <FontAwesome
                        name="chevron-right"
                        size={14}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ),
          )
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Exercise
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={[styles.closeText, { color: colors.tint }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editingExercise && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Name
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      value={editingExercise.name}
                      onChangeText={(text) =>
                        setEditingExercise({ ...editingExercise, name: text })
                      }
                      placeholder="Exercise name"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Category
                    </Text>
                    <RNView
                      style={[
                        styles.pickerContainer,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Picker
                        selectedValue={
                          isCustomCategory
                            ? "__CUSTOM__"
                            : editingExercise.category
                        }
                        onValueChange={(value) => {
                          if (value === "__CUSTOM__") {
                            setIsCustomCategory(true);
                          } else {
                            setIsCustomCategory(false);
                            setEditingExercise({
                              ...editingExercise,
                              category: value,
                            });
                          }
                        }}
                        style={{ color: colors.text }}
                        dropdownIconColor={colors.tint}
                      >
                        {categories.map((cat) => (
                          <Picker.Item key={cat} label={cat} value={cat} />
                        ))}
                        <Picker.Item
                          label="+ New Category"
                          value="__CUSTOM__"
                        />
                      </Picker>
                    </RNView>
                    {isCustomCategory && (
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            color: colors.text,
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            marginTop: 8,
                          },
                        ]}
                        value={customCategory}
                        onChangeText={setCustomCategory}
                        placeholder="Enter new category"
                        placeholderTextColor={colors.textSecondary}
                      />
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Description (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.textArea,
                        {
                          color: colors.text,
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      value={editingExercise.description || ""}
                      onChangeText={(text) =>
                        setEditingExercise({
                          ...editingExercise,
                          description: text,
                        })
                      }
                      placeholder="Exercise description"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}
            >
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Category Modal */}
      <Modal
        visible={showBulkCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBulkCategoryModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text, marginBottom: 16 },
              ]}
            >
              Change Category for {selectedIds.size} Exercise(s)
            </Text>

            <RNView
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginBottom: 16,
                },
              ]}
            >
              <Picker
                selectedValue={
                  isBulkCustomCategory ? "__CUSTOM__" : bulkCategory
                }
                onValueChange={(value) => {
                  if (value === "__CUSTOM__") {
                    setIsBulkCustomCategory(true);
                  } else {
                    setIsBulkCustomCategory(false);
                    setBulkCategory(value);
                  }
                }}
                style={{ color: colors.text }}
                dropdownIconColor={colors.tint}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
                <Picker.Item label="+ New Category" value="__CUSTOM__" />
              </Picker>
            </RNView>

            {isBulkCustomCategory && (
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    marginBottom: 16,
                  },
                ]}
                value={bulkCustomCategory}
                onChangeText={setBulkCustomCategory}
                placeholder="Enter new category"
                placeholderTextColor={colors.textSecondary}
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowBulkCategoryModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleApplyBulkCategory}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  closeText: {
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 32,
  },
  headerButton: {
    padding: 8,
    marginRight: -8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectionAction: {
    paddingVertical: 4,
  },
  selectionActionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  selectionCount: {
    fontSize: 14,
  },
  bulkActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  bulkActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseType: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.7,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
