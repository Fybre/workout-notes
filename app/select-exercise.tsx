import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useDatabase } from "@/contexts/DatabaseContext";
import { getAllExerciseDefinitions } from "@/db/database";
import type { ExerciseType } from "@/types";

interface ExerciseItem {
  name: string;
  id: string;
  type: ExerciseType;
}

interface ExerciseSection {
  title: string;
  data: ExerciseItem[];
}

export default function SelectExerciseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [exerciseData, setExerciseData] = useState<ExerciseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isReady: dbReady } = useDatabase();

  useEffect(() => {
    if (!dbReady) return;

    const loadExerciseData = async () => {
      try {
        setLoading(true);
        const definitions = await getAllExerciseDefinitions();

        // Group definitions by category
        const categories = new Map<string, ExerciseItem[]>();

        // Add Recent category first (exercises with category "Recent")
        const recentExercises = definitions
          .filter((def) => def.category === "Recent")
          .map((def) => ({
            id: def.id,
            name: def.name,
            type: def.type as ExerciseType,
          }));

        if (recentExercises.length > 0) {
          categories.set("Recent", recentExercises);
        }

        // Add other categories
        const otherCategories = ["Chest", "Back", "Shoulders", "Legs", "Arms"];
        for (const category of otherCategories) {
          const categoryExercises = definitions
            .filter((def) => def.category === category)
            .map((def) => ({
              id: def.id,
              name: def.name,
              type: def.type as ExerciseType,
            }));

          if (categoryExercises.length > 0) {
            categories.set(category, categoryExercises);
          }
        }

        // Convert map to array of sections
        const sections: ExerciseSection[] = [];
        categories.forEach((data, title) => {
          sections.push({ title, data });
        });

        setExerciseData(sections);
      } catch (err) {
        console.error("Failed to load exercise definitions:", err);
        setError("Failed to load exercises");
      } finally {
        setLoading(false);
      }
    };

    loadExerciseData();
  }, [dbReady]);

  const handleClose = () => {
    router.back();
  };

  const handleSelectExercise = (item: ExerciseItem) => {
    // Navigate to enter-exercise modal with exercise name and type as params
    router.push({
      pathname: "/enter-exercise",
      params: { exerciseName: item.name, exerciseType: item.type },
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
    </TouchableOpacity>
  );

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: ExerciseSection;
  }) => (
    <View
      style={[styles.sectionHeader, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.tint }]}>{title}</Text>
    </View>
  );

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

      {/* Exercise List */}
      <SectionList
        sections={exerciseData}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseRow}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.8,
  },
  exerciseRow: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: "500",
  },
});
