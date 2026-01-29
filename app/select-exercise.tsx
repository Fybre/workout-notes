import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useDatabase } from "@/contexts/DatabaseContext";
import { getAllExerciseDefinitions, getExerciseForDateByDefinition, getUsedExerciseIds } from "@/db/database";
import type { ExerciseType } from "@/types";
import { parseDateParam } from "@/utils/date";

const USED_FILTER_STORAGE_KEY = "@select_exercise_show_only_used";

interface ExerciseItem {
  name: string;
  id: string;
  type: ExerciseType;
  category: string;
}

interface ExerciseSection {
  title: string;
  data: ExerciseItem[];
}

export default function SelectExerciseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [usedExerciseIds, setUsedExerciseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isReady: dbReady } = useDatabase();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUsed, setShowOnlyUsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Parse date from params using centralized utility
  const exerciseDate = parseDateParam(dateParam);

  // Load persisted filter preference on mount
  useEffect(() => {
    const loadPersistedPreference = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(USED_FILTER_STORAGE_KEY);
        if (savedValue !== null) {
          setShowOnlyUsed(JSON.parse(savedValue));
        }
      } catch (error) {
        console.error("Failed to load used filter preference:", error);
      }
    };

    loadPersistedPreference();
  }, []);

  // Save filter preference when it changes
  useEffect(() => {
    const savePreference = async () => {
      try {
        await AsyncStorage.setItem(
          USED_FILTER_STORAGE_KEY,
          JSON.stringify(showOnlyUsed)
        );
      } catch (error) {
        console.error("Failed to save used filter preference:", error);
      }
    };

    savePreference();
  }, [showOnlyUsed]);

  // Load exercise data and used exercise IDs
  useEffect(() => {
    if (!dbReady) return;

    const loadExerciseData = async () => {
      try {
        setLoading(true);
        const [definitions, usedIds] = await Promise.all([
          getAllExerciseDefinitions(),
          getUsedExerciseIds(),
        ]);

        const exercises: ExerciseItem[] = definitions.map((def) => ({
          id: def.id,
          name: def.name,
          type: def.type as ExerciseType,
          category: def.category,
        }));

        setAllExercises(exercises);
        setUsedExerciseIds(usedIds);
      } catch (err) {
        console.error("Failed to load exercise definitions:", err);
        setError("Failed to load exercises");
      } finally {
        setLoading(false);
      }
    };

    loadExerciseData();
  }, [dbReady]);

  // Filter and group exercises based on search query, used toggle, and category
  const exerciseData = useMemo((): ExerciseSection[] => {
    // First filter by search query, used toggle, and category
    let filtered = allExercises;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((ex) =>
        ex.name.toLowerCase().includes(query)
      );
    }

    if (showOnlyUsed) {
      filtered = filtered.filter((ex) => usedExerciseIds.includes(ex.id));
    }

    // Group by category
    const categories = new Map<string, ExerciseItem[]>();

    // Get unique categories from filtered exercises
    const uniqueCategories = Array.from(
      new Set(filtered.map((ex) => ex.category))
    ).sort();

    for (const category of uniqueCategories) {
      const categoryExercises = filtered.filter(
        (ex) => ex.category === category
      );

      if (categoryExercises.length > 0) {
        categories.set(category, categoryExercises);
      }
    }

    // Convert map to array of sections, only including data for expanded categories
    const sections: ExerciseSection[] = [];
    categories.forEach((data, title) => {
      sections.push({ 
        title, 
        data: expandedCategories.has(title) ? data : [] 
      });
    });

    return sections;
  }, [allExercises, usedExerciseIds, searchQuery, showOnlyUsed, expandedCategories]);

  const handleClose = () => {
    router.back();
  };

  const handleSelectExercise = async (item: ExerciseItem) => {
    // Check if this exercise already exists for the current date
    const existingExercise = await getExerciseForDateByDefinition(
      item.id,
      exerciseDate
    );

    if (existingExercise) {
      // Navigate to existing exercise with its sets
      router.push({
        pathname: "/enter-exercise",
        params: {
          exerciseName: item.name,
          exerciseId: existingExercise.id,
          exerciseType: item.type,
          exerciseSets: JSON.stringify(existingExercise.sets),
          date: exerciseDate,
        },
      });
    } else {
      // Navigate to new exercise
      router.push({
        pathname: "/enter-exercise",
        params: {
          exerciseName: item.name,
          exerciseType: item.type,
          date: exerciseDate,
        },
      });
    }
  };

  const toggleShowOnlyUsed = () => {
    setShowOnlyUsed(!showOnlyUsed);
  };

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const renderExerciseRow = ({ item }: { item: ExerciseItem }) => (
    <TouchableOpacity
      style={[
        styles.exerciseRow,
        { backgroundColor: colors.surface },
        { borderBottomColor: colors.border },
      ]}
      onPress={() => handleSelectExercise(item)}
      activeOpacity={0.6}
    >
      <Text style={[styles.exerciseName, { color: colors.text }]}>
        {item.name}
      </Text>
      {usedExerciseIds.includes(item.id) && (
        <View style={[styles.usedIndicator, { backgroundColor: colors.success }]} />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({
    section: { title, data },
  }: {
    section: ExerciseSection;
  }) => {
    const isExpanded = expandedCategories.has(title);
    const exerciseCount = allExercises.filter(ex => ex.category === title).length;
    
    return (
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: colors.background }]}
        onPress={() => toggleCategoryExpanded(title)}
        activeOpacity={0.7}
      >
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>{title}</Text>
        <View style={styles.sectionHeaderRight}>
          <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>
            {exerciseCount}
          </Text>
          <FontAwesome
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.textSecondary}
            style={styles.expandIcon}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
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

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.errorContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
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
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push("/add-exercise-definition")}
          style={styles.addButton}
        >
          <Text style={[styles.addButtonText, { color: colors.tint }]}>+</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Select Exercise
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            styles.filterToggle,
            {
              backgroundColor: showOnlyUsed
                ? colors.tint
                : colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleShowOnlyUsed}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="filter"
            size={14}
            color={showOnlyUsed ? "#ffffff" : colors.text}
          />
          {showOnlyUsed && (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: "#ffffff" },
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  { color: colors.tint },
                ]}
              >
                {usedExerciseIds.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Exercise List by Category */}
      <SectionList
        sections={exerciseData}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseRow}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: colors.textSecondary }]}
            >
              {showOnlyUsed
                ? "No used exercises found"
                : searchQuery
                ? "No exercises match your search"
                : "No exercises available"}
            </Text>
          </View>
        }
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
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
  addButton: {
    padding: 8,
    marginLeft: -8,
  },
  addButtonText: {
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 32,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  expandIcon: {
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.8,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: "500",
  },
  usedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
