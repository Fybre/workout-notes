import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
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
  isDefault?: boolean;
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
    description: "Standard workout exercises (~80 exercises) — Default exercise set",
    count: 80,
    url: "https://raw.githubusercontent.com/Fybre/workout-notes/refs/heads/main/exercise_data/exercises_medium.json",
    isDefault: true,
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
  const [manualFile, setManualFile] = useState<{ name: string; exercises: ExerciseDefinition[] } | null>(null);

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

  // Manual file import
  const handleManualImport = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      // Read file content
      const response = await fetch(file.uri);
      const fileContent = await response.text();

      // Parse JSON
      let exercises: ExerciseDefinition[];
      try {
        exercises = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please select a valid exercise JSON file.');
      }

      if (!Array.isArray(exercises)) {
        throw new Error('File must contain an array of exercises');
      }

      if (exercises.length === 0) {
        throw new Error('Exercise set is empty');
      }

      // Validate exercise structure
      const invalidExercises = exercises.filter(ex => 
        !ex.name || !ex.category || !ex.type || !ex.unit
      );
      if (invalidExercises.length > 0) {
        throw new Error(`${invalidExercises.length} exercises missing required fields (name, category, type, unit)`);
      }

      // Calculate diff
      const currentExercises = await getAllExerciseDefinitions();
      const existingNames = new Set(
        currentExercises.map((ex) => ex.name.toLowerCase().trim())
      );

      const toAdd: ExerciseDefinition[] = [];
      const existing: ExerciseDefinition[] = [];

      for (const newEx of exercises) {
        const normalizedName = newEx.name.toLowerCase().trim();
        if (existingNames.has(normalizedName)) {
          existing.push(newEx);
        } else {
          toAdd.push(newEx);
          existingNames.add(normalizedName);
        }
      }

      setManualFile({ name: file.name, exercises });
      setPreview({
        toAdd,
        existing,
        totalNew: toAdd.length,
        totalExisting: existing.length,
      });

    } catch (error) {
      console.error('[Import] Manual import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Import Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseSet = async (setInfo: ExerciseSetInfo) => {
    setLoading(true);
    setSelectedSet(setInfo);

    try {
      const response = await fetchWithTimeout(setInfo.url, 30000);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();

      let newExercises: ExerciseDefinition[];
      try {
        newExercises = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Import] JSON parse error:', parseError);
        throw new Error(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }

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
      const currentExercises = await getAllExerciseDefinitions();
      
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
    if ((!selectedSet && !manualFile) || !preview) return;

    const sourceName = manualFile ? manualFile.name : selectedSet?.name;
    const modeText = importMode === "replace" ? "replace" : "merge with";
    Alert.alert(
      "Confirm Import",
      `This will ${modeText} your current exercise definitions with ${sourceName}.\n\n` +
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
    if ((!selectedSet && !manualFile) || !preview) return;

    setImporting(true);

    try {
      if (importMode === "replace") {
        // Replace mode: Clear all exercise-related data and re-add
        const db = getDatabase();
        
        // Due to foreign key constraints, we need to delete in order:
        // 1. Delete all sets (references exercises)
        // 2. Delete all exercises (references exercise_definitions)
        // 3. Delete all exercise definitions
        await db.withTransactionAsync(async () => {
          await db.runAsync("DELETE FROM sets");
          await db.runAsync("DELETE FROM exercises");
          await db.runAsync("DELETE FROM exercise_definitions");
        });

        // Get exercises for replace mode (from URL or manual file)
        let exercises: ExerciseDefinition[];
        if (manualFile) {
          exercises = manualFile.exercises;
        } else if (selectedSet) {
          const response = await fetchWithTimeout(selectedSet.url, 30000);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }
          const responseText = await response.text();
          exercises = JSON.parse(responseText);
        } else {
          throw new Error('No exercise source available');
        }

        // Deduplicate exercises by name (keep first occurrence)
        const uniqueExercises: ExerciseDefinition[] = [];
        const seenNames = new Set<string>();
        
        for (const ex of exercises) {
          const normalizedName = ex.name.toLowerCase().trim();
          if (!seenNames.has(normalizedName)) {
            seenNames.add(normalizedName);
            uniqueExercises.push(ex);
          }
        }

        let addedCount = 0;
        for (const ex of uniqueExercises) {
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
      } else {
        // Merge mode: Only add new exercises
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
    setManualFile(null);
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
        {!selectedSet && !manualFile ? (
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
                    <View style={styles.setNameRow}>
                      <Text style={[styles.setName, { color: colors.text }]}>
                        {set.name}
                      </Text>
                      {set.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.success }]}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
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

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Manual Import Section */}
            <View style={styles.manualImportSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Manual Import
              </Text>
              <Text style={[styles.manualImportDescription, { color: colors.textSecondary }]}>
                Have your own exercise set? Import a JSON file from your device.
              </Text>
              <TouchableOpacity
                style={[
                  styles.manualImportButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={handleManualImport}
                disabled={loading}
                activeOpacity={0.7}
              >
                <FontAwesome name="folder-open" size={20} color={colors.tint} />
                <Text style={[styles.manualImportButtonText, { color: colors.text }]}>
                  Browse for JSON File
                </Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading exercise set...
                </Text>
              </View>
            )}

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
                {manualFile ? manualFile.name : selectedSet?.name}
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
  setNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  setName: {
    fontSize: 17,
    fontWeight: "700",
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
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
  divider: {
    height: 1,
    marginVertical: 24,
  },
  manualImportSection: {
    marginBottom: 8,
  },
  manualImportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  manualImportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  manualImportButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
