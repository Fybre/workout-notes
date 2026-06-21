import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useUnits } from "@/contexts/UnitContext";
import {
  getAllExerciseDefinitions,
  getExerciseForDateByDefinition,
  getExerciseHistoryWithSets,
  getRecentExerciseDefinitionIds,
  getUsedExerciseIds,
  setExerciseFavourite,
} from "@/db/database";
import type { ExerciseType, Set as WorkoutSet } from "@/types";
import { parseDateParam } from "@/utils/date";
import { calculateOneRepMax } from "@/utils/format";

const USED_FILTER_STORAGE_KEY = "@select_exercise_show_only_used";
const RECENT_EXERCISES_LIMIT = 10;

interface ExerciseItem {
  name: string;
  id: string;
  type: ExerciseType;
  category: string;
  description: string | null;
  mediaUri: string | null;
  mediaType: "image" | "video" | null;
  isFavourite: boolean;
}

interface ExerciseSection {
  title: string;
  data: ExerciseItem[];
  count: number;
  special?: boolean;
}

export default function SelectExerciseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [usedExerciseIds, setUsedExerciseIds] = useState<string[]>([]);
  const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isReady: dbReady } = useDatabase();
  const { weightUnit, distanceUnit } = useUnits();
  const insets = useSafeAreaInsets();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  // Exercise info (help) modal state
  const [infoExercise, setInfoExercise] = useState<ExerciseItem | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoHistory, setInfoHistory] = useState<
    { date: string; sets: WorkoutSet[] }[]
  >([]);
  const [infoOneRM, setInfoOneRM] = useState<number | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUsed, setShowOnlyUsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Auto-expand/collapse categories based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      // When searching, expand all categories that have matching exercises
      const filtered = allExercises.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
      const categoriesWithMatches = new Set<string>(
        filtered.map((ex) => ex.category)
      );
      if (filtered.some((ex) => ex.isFavourite)) {
        categoriesWithMatches.add("Favourites");
      }
      if (filtered.some((ex) => recentExerciseIds.includes(ex.id))) {
        categoriesWithMatches.add("Recent");
      }
      setExpandedCategories(categoriesWithMatches);
    } else {
      // When search is cleared, collapse all categories
      setExpandedCategories(new Set());
    }
  }, [searchQuery, allExercises, recentExerciseIds]);

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

      }
    };

    savePreference();
  }, [showOnlyUsed]);

  // Load exercise data and used exercise IDs - re-runs every time the screen
  // regains focus (e.g. returning from "+ Add Exercise") so newly added or
  // edited exercises show up without needing to back out and re-enter
  useFocusEffect(
    useCallback(() => {
      if (!dbReady) return;

      const loadExerciseData = async () => {
        try {
          const [definitions, usedIds, recentIds] = await Promise.all([
            getAllExerciseDefinitions(),
            getUsedExerciseIds(),
            getRecentExerciseDefinitionIds(RECENT_EXERCISES_LIMIT),
          ]);

          const exercises: ExerciseItem[] = definitions.map((def) => ({
            id: def.id,
            name: def.name,
            type: def.type as ExerciseType,
            category: def.category,
            description: def.description,
            mediaUri: def.mediaUri,
            mediaType: def.mediaType as "image" | "video" | null,
            isFavourite: !!def.isFavourite,
          }));

          setAllExercises(exercises);
          setUsedExerciseIds(usedIds);
          setRecentExerciseIds(recentIds);
        } catch (err) {

          setError("Failed to load exercises");
        } finally {
          setLoading(false);
        }
      };

      loadExerciseData();
    }, [dbReady]),
  );

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

    const filteredIds = new Set(filtered.map((ex) => ex.id));
    const byId = new Map(filtered.map((ex) => [ex.id, ex]));

    const sections: ExerciseSection[] = [];

    // Favourites - tagged via the exercise info (help) screen
    const favouriteExercises = filtered
      .filter((ex) => ex.isFavourite)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (favouriteExercises.length > 0) {
      sections.push({
        title: "Favourites",
        data: expandedCategories.has("Favourites") ? favouriteExercises : [],
        count: favouriteExercises.length,
        special: true,
      });
    }

    // Recent - most recently logged, preserving recency order
    const recentExercises = recentExerciseIds
      .filter((id) => filteredIds.has(id))
      .map((id) => byId.get(id)!);
    if (recentExercises.length > 0) {
      sections.push({
        title: "Recent",
        data: expandedCategories.has("Recent") ? recentExercises : [],
        count: recentExercises.length,
        special: true,
      });
    }

    // Group remaining exercises by category
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

    // Add category sections, only including data for expanded categories
    categories.forEach((data, title) => {
      sections.push({
        title,
        data: expandedCategories.has(title) ? data : [],
        count: data.length,
      });
    });

    return sections;
  }, [
    allExercises,
    usedExerciseIds,
    recentExerciseIds,
    searchQuery,
    showOnlyUsed,
    expandedCategories,
  ]);

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

  const handleLongPressExercise = async (item: ExerciseItem) => {
    setInfoExercise(item);
    setShowInfoModal(true);

    const history = await getExerciseHistoryWithSets(item.name, 30);
    setInfoHistory(history);

    if (item.type === "weight_reps") {
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
      setInfoOneRM(bestOneRM);
    } else {
      setInfoOneRM(null);
    }
  };

  const handleToggleFavourite = async () => {
    if (!infoExercise) return;
    const next = !infoExercise.isFavourite;

    setInfoExercise({ ...infoExercise, isFavourite: next });
    setAllExercises((prev) =>
      prev.map((ex) =>
        ex.id === infoExercise.id ? { ...ex, isFavourite: next } : ex
      )
    );

    await setExerciseFavourite(infoExercise.id, next);
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
      onLongPress={() => handleLongPressExercise(item)}
      delayLongPress={400}
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
    section: { title, count, special },
  }: {
    section: ExerciseSection;
  }) => {
    const isExpanded = expandedCategories.has(title);

    return (
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: colors.background }]}
        onPress={() => toggleCategoryExpanded(title)}
        activeOpacity={0.7}
      >
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>
          {special && (title === "Favourites" ? "★ " : "⏱ ")}
          {title}
        </Text>
        <View style={styles.sectionHeaderRight}>
          <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>
            {count}
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

  const clearSearch = () => {
    setSearchQuery("");
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
            paddingTop: insets.top + 10,
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
        <View style={styles.searchInputWrapper}>
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
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
              activeOpacity={0.7}
            >
              <FontAwesome name="times-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
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
        keyExtractor={(item, index) => `${item.id}-${index}`}
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

      {/* Exercise Info (Help) Modal - opened via long press */}
      {infoExercise && (
        <ExerciseInfoModal
          visible={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          exerciseId={infoExercise.id}
          exerciseName={infoExercise.name}
          exerciseType={infoExercise.type}
          description={infoExercise.description}
          mediaUri={infoExercise.mediaUri}
          mediaType={infoExercise.mediaType}
          history={infoHistory}
          estimatedOneRM={infoOneRM}
          weightUnit={weightUnit}
          distanceUnit={distanceUnit}
          isFavourite={infoExercise.isFavourite}
          onToggleFavourite={handleToggleFavourite}
        />
      )}
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
  searchInputWrapper: {
    flex: 1,
    position: "relative",
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 16,
    borderWidth: 1,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 13,
    padding: 4,
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
