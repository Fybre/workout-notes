import { Text } from "@/components/Themed";
import { useColorScheme, useTheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { clearDatabase, clearWorkoutData } from "@/db/database";
import {
  createAndShareBackup,
  pickAndRestoreBackup,
  getDatabaseSize,
  formatFileSize,
} from "@/db/backup";
import { useUnits } from "@/contexts/UnitContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View, ActivityIndicator } from "react-native";
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from "react-native-gesture-handler";

const REST_TIMER_SETTINGS_KEY = "@rest_timer_settings";

interface RestTimerSettings {
  autoStart: boolean;
  defaultTime: number;
}

export default function SettingsModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  // Unit preferences from context
  const { weightUnit, distanceUnit, weightIncrement, setWeightUnit, setDistanceUnit, setWeightIncrement } = useUnits();

  // Rest timer settings
  const [restTimerSettings, setRestTimerSettings] = useState<RestTimerSettings>(
    {
      autoStart: false,
      defaultTime: 60,
    },
  );

  // Use the theme context
  const { theme, setTheme, effectiveColorScheme } = useTheme();

  // Backup/restore state
  const [dbSize, setDbSize] = useState<number>(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load rest timer settings on mount
  useEffect(() => {
    const loadRestTimerSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(REST_TIMER_SETTINGS_KEY);
        if (saved) {
          setRestTimerSettings(JSON.parse(saved));
        }
      } catch (error) {

      }
    };

    loadRestTimerSettings();
  }, []);

  // Load database size on mount
  useEffect(() => {
    const loadDbSize = async () => {
      const size = await getDatabaseSize();
      setDbSize(size);
    };

    loadDbSize();
  }, []);

  // Save rest timer settings when they change
  const updateRestTimerSettings = async (
    updates: Partial<RestTimerSettings>,
  ) => {
    const newSettings = { ...restTimerSettings, ...updates };
    setRestTimerSettings(newSettings);
    try {
      await AsyncStorage.setItem(
        REST_TIMER_SETTINGS_KEY,
        JSON.stringify(newSettings),
      );
    } catch (error) {

    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await createAndShareBackup();
      if (result.success) {
        Alert.alert(
          "Backup Created",
          `Your workout data has been backed up successfully.\n\nSize: ${formatFileSize(result.fileSize ?? 0)}`,
        );
        // Refresh database size
        setDbSize(await getDatabaseSize());
      } else {
        Alert.alert("Backup Failed", result.error ?? "Failed to create backup");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred during backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      "Restore Data",
      "This will replace ALL your current workout data with the backup. This cannot be undone. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            setIsRestoring(true);
            try {
              const result = await pickAndRestoreBackup();
              if (result.success) {
                if (result.requiresRestart) {
                  Alert.alert(
                    "Restore Complete",
                    "Your data has been restored. Please restart the app to complete the process.",
                    [{ text: "OK", onPress: () => router.back() }],
                  );
                } else {
                  Alert.alert("Restore Complete", "Your data has been restored successfully.");
                }
              } else {
                if (result.error !== "User cancelled") {
                  Alert.alert("Restore Failed", result.error ?? "Failed to restore backup");
                }
              }
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred during restore");
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ],
    );
  };

  const handleClearWorkoutData = () => {
    Alert.alert(
      "Clear Workout Data",
      "Are you sure you want to delete all your logged workouts and sets? Your custom exercise definitions will be preserved. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Workouts",
          style: "destructive",
          onPress: async () => {
            try {
              await clearWorkoutData();
              Alert.alert("Success", "All workout data has been cleared. Your exercise definitions have been preserved.");
            } catch (error) {

              Alert.alert("Error", "Failed to clear workout data.");
            }
          },
        },
      ],
    );
  };

  const handleClearDatabase = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to permanently delete ALL your data? This includes all workout logs, sets, AND custom exercise definitions. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await clearDatabase();
              Alert.alert("Success", "All data has been cleared. The app has been reset to its initial state.");
            } catch (error) {

              Alert.alert("Error", "Failed to clear database.");
            }
          },
        },
      ],
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with title and close button */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Settings
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Units Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Units
            </Text>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Weight
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    weightUnit === "kg" && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setWeightUnit("kg")}
                >
                  <Text
                    style={[
                      styles.radioText,
                      weightUnit === "kg" && { color: "white" },
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    weightUnit === "lbs" && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setWeightUnit("lbs")}
                >
                  <Text
                    style={[
                      styles.radioText,
                      weightUnit === "lbs" && { color: "white" },
                    ]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Weight Increment
                </Text>
                <Text
                  style={[styles.settingHint, { color: colors.textSecondary }]}
                >
                  Step size for +/- buttons
                </Text>
              </View>
              <View style={styles.timeControl}>
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() => {
                    const step = 0.5;
                    const newIncrement = Math.max(step, weightIncrement - step);
                    setWeightIncrement(newIncrement);
                  }}
                >
                  <Text style={[styles.timeButtonText, { color: colors.tint }]}>
                    −
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.timeValue, { color: colors.text }]}>
                  {weightUnit === "lbs" && weightIncrement % 1 === 0
                    ? weightIncrement.toFixed(0)
                    : weightIncrement.toFixed(1)}
                </Text>
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() => {
                    const step = 0.5;
                    setWeightIncrement(weightIncrement + step);
                  }}
                >
                  <Text style={[styles.timeButtonText, { color: colors.tint }]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Distance
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    distanceUnit === "km" && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setDistanceUnit("km")}
                >
                  <Text
                    style={[
                      styles.radioText,
                      distanceUnit === "km" && { color: "white" },
                    ]}
                  >
                    km
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    distanceUnit === "miles" && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setDistanceUnit("miles")}
                >
                  <Text
                    style={[
                      styles.radioText,
                      distanceUnit === "miles" && { color: "white" },
                    ]}
                  >
                    miles
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Theme Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Theme
            </Text>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Appearance
                </Text>
                <Text
                  style={[styles.settingHint, { color: colors.textSecondary }]}
                >
                  Active: {effectiveColorScheme === "dark" ? "Dark" : "Light"}{" "}
                  mode
                </Text>
              </View>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    theme === "system" && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setTheme("system")}
                >
                  <Text
                    style={[
                      styles.radioText,
                      theme === "system" && { color: "white" },
                    ]}
                  >
                    System
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    theme === "light" && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setTheme("light")}
                >
                  <Text
                    style={[
                      styles.radioText,
                      theme === "light" && { color: "white" },
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    theme === "dark" && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setTheme("dark")}
                >
                  <Text
                    style={[
                      styles.radioText,
                      theme === "dark" && { color: "white" },
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Rest Timer Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Rest Timer
            </Text>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto Start Rest Timer
                </Text>
                <Text
                  style={[styles.settingHint, { color: colors.textSecondary }]}
                >
                  Automatically start after adding a set
                </Text>
              </View>
              <Switch
                value={restTimerSettings.autoStart}
                onValueChange={(value) =>
                  updateRestTimerSettings({ autoStart: value })
                }
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor={
                  restTimerSettings.autoStart ? "#ffffff" : colors.textSecondary
                }
              />
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Default Rest Time
              </Text>
              <View style={styles.timeControl}>
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() =>
                    updateRestTimerSettings({
                      defaultTime: Math.max(
                        10,
                        restTimerSettings.defaultTime - 10,
                      ),
                    })
                  }
                >
                  <Text style={[styles.timeButtonText, { color: colors.tint }]}>
                    −
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.timeValue, { color: colors.text }]}>
                  {formatTime(restTimerSettings.defaultTime)}
                </Text>
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() =>
                    updateRestTimerSettings({
                      defaultTime: Math.min(
                        600,
                        restTimerSettings.defaultTime + 10,
                      ),
                    })
                  }
                >
                  <Text style={[styles.timeButtonText, { color: colors.tint }]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Data Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data
            </Text>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Database Size
                </Text>
                <Text
                  style={[styles.settingHint, { color: colors.textSecondary }]}
                >
                  {formatFileSize(dbSize)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={handleBackup}
              disabled={isBackingUp || isRestoring}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Backup Data
                </Text>
                <Text
                  style={[styles.settingHint, { color: colors.textSecondary }]}
                >
                  Export to file
                </Text>
              </View>
              {isBackingUp ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Text style={[styles.settingValue, { color: colors.tint }]}>
                  ⬇️
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={handleRestore}
              disabled={isBackingUp || isRestoring}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Restore Data
                </Text>
                <Text
                  style={[styles.settingHint, { color: colors.textSecondary }]}
                >
                  Import from backup
                </Text>
              </View>
              {isRestoring ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Text style={[styles.settingValue, { color: colors.tint }]}>
                  ⬆️
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Danger Zone Section */}
          <View style={styles.section}>
            <Text style={[styles.dangerSectionTitle, { color: "#ef4444" }]}>
              Danger Zone
            </Text>

            <TouchableOpacity
              style={[
                styles.dangerSettingItem,
                { borderBottomColor: "#ef4444", backgroundColor: "#fef2f2" },
              ]}
              onPress={handleClearWorkoutData}
              disabled={isBackingUp || isRestoring}
            >
              <View>
                <Text style={[styles.dangerSettingLabel, { color: "#dc2626" }]}>
                  Clear Workout Data
                </Text>
                <Text
                  style={[styles.dangerSettingHint, { color: "#ef4444" }]}
                >
                  Delete logged workouts, keep exercise definitions
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: "#ef4444" }]}>
                📝
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dangerSettingItem,
                { borderBottomColor: "#ef4444", backgroundColor: "#fef2f2" },
              ]}
              onPress={handleClearDatabase}
              disabled={isBackingUp || isRestoring}
            >
              <View>
                <Text style={[styles.dangerSettingLabel, { color: "#dc2626" }]}>
                  Clear All Data
                </Text>
                <Text
                  style={[styles.dangerSettingHint, { color: "#ef4444" }]}
                >
                  Reset everything including custom exercises
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: "#ef4444" }]}>
                🗑️
              </Text>
            </TouchableOpacity>
          </View>

          {/* Exercise Database Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Exercise Database
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/manage-exercises")}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Manage Exercises
                </Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>
                  Edit, delete, or categorize your exercises
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.tint }]}>
                →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/import-exercises")}
            >
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Import Exercise Library
                </Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>
                  Load exercise sets from GitHub (merge or replace)
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.tint }]}>
                →
              </Text>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/about")}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                About Workout Notes
              </Text>
              <Text style={[styles.settingValue, { color: colors.tint }]}>
                →
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    marginBottom: 10,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingHint: {
    fontSize: 13,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timeButtonText: {
    fontSize: 20,
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "700",
    minWidth: 60,
    textAlign: "center",
  },
  // Danger zone styles
  dangerSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dangerSettingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  dangerSettingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  dangerSettingHint: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
});
