import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,

} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  getAllExerciseDefinitions,
  addExerciseDefinition,
  getDatabase,
} from "@/db/database";
import type { ExerciseType } from "@/types/workout";
import { generateId } from "@/utils/id";

interface ExerciseDefinition {
  name: string;
  category: string;
  type: ExerciseType;
  unit: string;
  description?: string;
}

interface ExerciseSetInfo {
  name: string;
  description: string;
  count: number;
  url: string;
}

const EXERCISE_SETS: ExerciseSetInfo[] = [
  {
    name: "Small Set",
    description: "Essential exercises (~25 exercises)",
    count: 25,
    url: "https://raw.githubusercontent.com/Fybre/workout-notes/refs/heads/main/exercise_data/exercises_small.json",
  },
  {
    name: "Medium Set",
    description: "Standard workout exercises (~80 exercises)",
    count: 80,
    url: "https://raw.githubusercontent.com/Fybre/workout-notes/refs/heads/main/exercise_data/exercises_medium.json",
  },
  {
    name: "Large Set",
    description: "Comprehensive exercise library (~250 exercises)",
    count: 250,
    url: "https://raw.githubusercontent.com/Fybre/workout-notes/refs/heads/main/exercise_data/exercises_large.json",
  },
];

interface ImportPreview {
  toAdd: ExerciseDefinition[];
  existing: ExerciseDefinition[];
  totalNew: number;
  totalExisting: number;
}

export default function ImportExercisesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [loading, setLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState<ExerciseSetInfo | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [importing, setImporting] = useState(false);

  // Helper for fetch with timeout
  const fetchWithTimeout = async (url: string, timeoutMs = 30000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs/1000} seconds`);
      }
      throw error;
    }
  };

  const fetchExerciseSet = async (setInfo: ExerciseSetInfo) => {
    setLoading(true);
    setSelectedSet(setInfo);

    try {
      console.log(`[Import] Fetching from: ${setInfo.url}`);
      
      const response = await fetchWithTimeout(setInfo.url, 30000);
      
      console.log(`[Import] Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log(`[Import] Content-Type: ${contentType}`);

      const responseText = await response.text();
      console.log(`[Import] Response length: ${responseText.length} chars`);
      console.log(`[Import] First 200 chars: ${responseText.substring(0, 200)}`);

      let newExercises: ExerciseDefinition[];
      try {
        newExercises = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Import] JSON parse error:', parseError);
        throw new Error(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }

      console.log(`[Import] Parsed ${newExercises.length} exercises`);

      if (!Array.isArray(newExercises)) {
        throw new Error('Response is not an array');
      }

      if (newExercises.length === 0) {
        throw new Error('Exercise set is empty');
      }

      // Validate exercise structure
      const invalidExercises = newExercises.filter(ex => 
        !ex.name || !ex.category || !ex.type || !ex.unit
      );
      if (invalidExercises.length > 0) {
        console.error('[Import] Invalid exercises found:', invalidExercises.slice(0, 3));
        throw new Error(`${invalidExercises.length} exercises missing required fields (name, category, type, unit)`);
      }

      // Get current exercises for comparison
      // Note: Database has UNIQUE constraint on 'name' only, not name+category
      console.log('[Import] Getting current exercise definitions...');
      const currentExercises = await getAllExerciseDefinitions();
      console.log(`[Import] Found ${currentExercises.length} existing exercises`);
      
      // Create a set of existing exercise names (lowercase for case-insensitive comparison)
      const existingNames = new Set(
        currentExercises.map((ex) => ex.name.toLowerCase().trim())
      );

      // Calculate diff - match on name only since that's what the database enforces
      const toAdd: ExerciseDefinition[] = [];
      const existing: ExerciseDefinition[] = [];

      for (const newEx of newExercises) {
        const normalizedName = newEx.name.toLowerCase().trim();
        if (existingNames.has(normalizedName)) {
          existing.push(newEx);
        } else {
          toAdd.push(newEx);
          // Add to existingNames to handle duplicates within the same import file
          existingNames.add(normalizedName);
        }
      }

      console.log(`[Import] Preview: ${toAdd.length} new, ${existing.length} existing`);

      setPreview({
        toAdd,
        existing,
        totalNew: toAdd.length,
        totalExisting: existing.length,
      });
    } catch (error) {
      console.error('[Import] Error fetching exercise set:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        "Import Error", 
        `Failed to fetch exercise set:\n${errorMessage}\n\nPlease check your internet connection and try again.`
      );
      setSelectedSet(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedSet || !preview) return;

    const modeText = importMode === "replace" ? "replace" : "merge with";
    Alert.alert(
      "Confirm Import",
      `This will ${modeText} your current exercise definitions with the ${selectedSet.name}.\n\n` +
        (importMode === "replace"
          ? `All ${preview.totalExisting} existing exercises will be deleted and replaced with ${preview.totalNew + preview.totalExisting} exercises from the set.`
          : `${preview.totalNew} new exercises will be added. ${preview.totalExisting} existing exercises will be kept.`),
      [
        { text: "Cancel", style: "cancel" },
        {
          text: importMode === "replace" ? "Replace" : "Merge",
          style: importMode === "replace" ? "destructive" : "default",
          onPress: executeImport,
        },
      ]
    );
  };

  const executeImport = async () => {
    if (!selectedSet || !preview) return;

    setImporting(true);
    console.log(`[Import] Starting ${importMode} import...`);

    try {
      if (importMode === "replace") {
        // Replace mode: Clear all exercise-related data and re-add
        const db = getDatabase();
        
        console.log('[Import] Replace mode - clearing existing data...');
        
        // Due to foreign key constraints, we need to delete in order:
        // 1. Delete all sets (references exercises)
        // 2. Delete all exercises (references exercise_definitions)
        // 3. Delete all exercise definitions
        await db.withTransactionAsync(async () => {
          console.log('[Import] Deleting sets...');
          await db.runAsync("DELETE FROM sets");
          console.log('[Import] Deleting exercises...');
          await db.runAsync("DELETE FROM exercises");
          console.log('[Import] Deleting exercise definitions...');
          await db.runAsync("DELETE FROM exercise_definitions");
        });

        // Fetch exercises again for replace mode
        console.log('[Import] Fetching exercises for replace mode...');
        const response = await fetchWithTimeout(selectedSet.url, 30000);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const responseText = await response.text();
        const exercises: ExerciseDefinition[] = JSON.parse(responseText);
        console.log(`[Import] Adding ${exercises.length} exercises...`);

        let addedCount = 0;
        for (const ex of exercises) {
          try {
            await addExerciseDefinition({
              id: generateId(),
              name: ex.name,
              category: ex.category,
              type: ex.type,
              unit: ex.unit,
              description: ex.description,
            });
            addedCount++;
          } catch (addError) {
            console.error(`[Import] Error adding exercise "${ex.name}":`, addError);
            throw new Error(`Failed to add "${ex.name}": ${addError instanceof Error ? addError.message : 'Unknown error'}`);
          }
        }
        console.log(`[Import] Successfully added ${addedCount} exercises`);
      } else {
        // Merge mode: Only add new exercises
        console.log(`[Import] Merge mode - adding ${preview.toAdd.length} new exercises...`);
        let addedCount = 0;
        let failedCount = 0;
        const failedNames: string[] = [];
        
        for (const ex of preview.toAdd) {
          try {
            await addExerciseDefinition({
              id: generateId(),
              name: ex.name,
              category: ex.category,
              type: ex.type,
              unit: ex.unit,
              description: ex.description,
            });
            addedCount++;
          } catch (addError) {
            failedCount++;
            failedNames.push(ex.name);
            console.error(`[Import] Error adding exercise "${ex.name}":`, addError);
            // Continue with next exercise instead of failing completely
          }
        }
        console.log(`[Import] Added ${addedCount}, failed ${failedCount}`);
        
        // Show result alert even if some failed
        if (failedCount > 0) {
          Alert.alert(
            "Import Partially Complete",
            `Added ${addedCount} of ${preview.toAdd.length} exercises.\n\n${failedCount} exercises could not be added (duplicate names with existing exercises).`,
            [{ text: "OK", onPress: () => router.back() }]
          );
          return; // Early return to skip the success alert below
        }
      }

      Alert.alert(
        "Import Complete",
        importMode === "replace"
          ? `Successfully replaced with ${preview.totalNew + preview.totalExisting} exercises.`
          : `Successfully added ${preview.totalNew} new exercises.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('[Import] Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        "Import Failed", 
        `Failed to import exercises:\n${errorMessage}\n\nPlease try again.`
      );
    } finally {
      setImporting(false);
    }
  };

  const resetPreview = () => {
    setSelectedSet(null);
    setPreview(null);
    setImportMode("merge");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Import Exercises
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedSet ? (
          // Exercise Set Selection
          <>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Choose an exercise set to import from the GitHub repository. You can merge with your existing exercises or replace them entirely.
            </Text>

            <View style={styles.setsContainer}>
              {EXERCISE_SETS.map((set) => (
                <TouchableOpacity
                  key={set.name}
                  style={[
                    styles.setCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => fetchExerciseSet(set)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <View style={styles.setInfo}>
                    <Text style={[styles.setName, { color: colors.text }]}>
                      {set.name}
                    </Text>
                    <Text
                      style={[styles.setDescription, { color: colors.textSecondary }]}
                    >
                      {set.description}
                    </Text>
                    <Text style={[styles.setCount, { color: colors.tint }]}>
                      {set.count} exercises
                    </Text>
                  </View>
                  <FontAwesome
                    name="cloud-download"
                    size={24}
                    color={colors.tint}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Fetching exercise set...
                </Text>
              </View>
            )}

            {/* Troubleshooting Section */}
            <View style={styles.troubleshootingSection}>
              <Text style={[styles.troubleshootingTitle, { color: colors.textSecondary }]}>
                Having trouble?
              </Text>
              <Text style={[styles.troubleshootingText, { color: colors.textSecondary }]}
              numberOfLines={0}
              >
                If downloads fail, you can manually download the JSON files from the GitHub repository and import them via the Manage Exercises screen.
              </Text>
              <Text 
                style={[styles.urlText, { color: colors.tint }]} 
                numberOfLines={2} 
                ellipsizeMode="tail"
              >
                github.com/Fybre/workout-notes/tree/main/exercise_data
              </Text>
            </View>
          </>
        ) : (
          // Preview and Import Options
          <>
            <View
              style={[
                styles.selectedSetBanner,
                { backgroundColor: `${colors.tint}15` },
              ]}
            >
              <Text style={[styles.selectedSetName, { color: colors.tint }]}>
                {selectedSet.name}
              </Text>
              <TouchableOpacity onPress={resetPreview} disabled={importing}>
                <Text style={[styles.changeSetText, { color: colors.textSecondary }]}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>

            {/* Import Mode Selection */}
            <View style={styles.modeSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Import Mode
              </Text>
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor:
                        importMode === "merge"
                          ? colors.tint
                          : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setImportMode("merge")}
                  disabled={importing}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color: importMode === "merge" ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    Merge
                  </Text>
                  <Text
                    style={[
                      styles.modeButtonSubtext,
                      {
                        color:
                          importMode === "merge"
                            ? "rgba(255,255,255,0.8)"
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    Add new, keep existing
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor:
                        importMode === "replace"
                          ? "#ef4444"
                          : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setImportMode("replace")}
                  disabled={importing}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color: importMode === "replace" ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    Replace
                  </Text>
                  <Text
                    style={[
                      styles.modeButtonSubtext,
                      {
                        color:
                          importMode === "replace"
                            ? "rgba(255,255,255,0.8)"
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    Delete all, import new
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview Stats */}
            {preview && (
              <View style={styles.previewSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Preview
                </Text>

                <View
                  style={[
                    styles.statsContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      New exercises to add:
                    </Text>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                      +{preview.totalNew}
                    </Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Already exist (will be {importMode === "replace" ? "replaced" : "kept"}):
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color:
                            importMode === "replace"
                              ? colors.error
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {preview.totalExisting}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.text }]}>
                      Total after import:
                    </Text>
                    <Text style={[styles.statValue, { color: colors.tint }]}>
                      {importMode === "replace"
                        ? preview.totalNew + preview.totalExisting
                        : preview.totalNew + preview.totalExisting}
                    </Text>
                  </View>
                </View>

                {preview.toAdd.length > 0 && (
                  <View style={styles.previewListSection}>
                    <Text
                      style={[styles.previewListTitle, { color: colors.text }]}
                    >
                      New exercises ({preview.toAdd.length})
                    </Text>
                    <View
                      style={[
                        styles.previewList,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      {preview.toAdd.slice(0, 5).map((ex, index) => (
                        <View
                          key={index}
                          style={[
                            styles.previewItem,
                            index < 4 && {
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.previewItemName,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {ex.name}
                          </Text>
                          <Text
                            style={[
                              styles.previewItemCategory,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {ex.category}
                          </Text>
                        </View>
                      ))}
                      {preview.toAdd.length > 5 && (
                        <Text
                          style={[
                            styles.moreItems,
                            { color: colors.textSecondary },
                          ]}
                        >
                          +{preview.toAdd.length - 5} more...
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Import Button */}
            <TouchableOpacity
              style={[
                styles.importButton,
                {
                  backgroundColor:
                    importMode === "replace" ? "#ef4444" : colors.tint,
                  opacity: importing ? 0.6 : 1,
                },
              ]}
              onPress={handleImport}
              disabled={importing || !preview}
              activeOpacity={0.8}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.importButtonText}>
                  {importMode === "replace" ? "Replace & Import" : "Merge & Import"}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
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
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  setsContainer: {
    gap: 12,
  },
  setCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  setInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  setDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  setCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  selectedSetBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  selectedSetName: {
    fontSize: 16,
    fontWeight: "700",
  },
  changeSetText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  modeButtonSubtext: {
    fontSize: 12,
  },
  previewSection: {
    marginBottom: 24,
  },
  statsContainer: {
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 15,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statDivider: {
    height: 1,
    marginVertical: 8,
  },
  previewListSection: {
    marginTop: 16,
  },
  previewListTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  previewList: {
    borderRadius: 12,
    overflow: "hidden",
  },
  previewItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  previewItemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  previewItemCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  moreItems: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    fontStyle: "italic",
  },
  importButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  importButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  troubleshootingSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  urlText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
