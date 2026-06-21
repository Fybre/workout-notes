/**
 * Exercise info/help modal — description, reference photo/video, estimated 1RM, and history
 * Shared between the exercise logging screen and the exercise picker (long-press)
 */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ResizeMode, Video } from "expo-av";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import type { ExerciseType, Set } from "@/types/workout";
import { formatOneRepMax, formatSetForDisplay } from "@/utils/format";

interface ExerciseInfoModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseName: string;
  exerciseType: ExerciseType;
  description: string | null;
  mediaUri: string | null;
  mediaType: "image" | "video" | null;
  history: { date: string; sets: Set[] }[];
  estimatedOneRM: number | null;
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "miles";
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
}

export function ExerciseInfoModal({
  visible,
  onClose,
  exerciseName,
  exerciseType,
  description,
  mediaUri,
  mediaType,
  history,
  estimatedOneRM,
  weightUnit,
  distanceUnit,
  isFavourite,
  onToggleFavourite,
}: ExerciseInfoModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
      >
        <View
          style={[
            styles.content,
            { backgroundColor: colors.background, paddingTop: insets.top },
          ]}
        >
          {/* Modal Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {exerciseName}
            </Text>
            <View style={styles.headerActions}>
              {onToggleFavourite && (
                <TouchableOpacity onPress={onToggleFavourite} hitSlop={12}>
                  <FontAwesome
                    name={isFavourite ? "star" : "star-o"}
                    size={24}
                    color={isFavourite ? "#f5a623" : colors.tint}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={[styles.closeText, { color: colors.tint }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Photo / Video Section */}
            {mediaUri && (
              <View style={styles.mediaSection}>
                {mediaType === "video" ? (
                  <Video
                    source={{ uri: mediaUri }}
                    style={styles.media}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                  />
                ) : (
                  <Image
                    source={{ uri: mediaUri }}
                    style={styles.media}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}

            {/* Description Section */}
            {description && (
              <View
                style={[
                  styles.descriptionSection,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.label, { color: colors.textSecondary }]}
                >
                  Description
                </Text>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {description}
                </Text>
              </View>
            )}

            {/* Estimated 1RM Section */}
            {exerciseType === "weight_reps" && estimatedOneRM !== null && (
              <View
                style={[styles.oneRMSection, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Estimated 1 Rep Max
                </Text>
                <Text style={[styles.oneRMValue, { color: colors.tint }]}>
                  {formatOneRepMax(estimatedOneRM, weightUnit)}
                </Text>
                <Text
                  style={[styles.oneRMDisclaimer, { color: colors.textSecondary }]}
                >
                  Based on your best set using the Epley formula
                </Text>
              </View>
            )}

            {/* History Section */}
            <View style={styles.historySection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                History
              </Text>
              {history.length === 0 ? (
                <Text
                  style={[styles.noHistoryText, { color: colors.textSecondary }]}
                >
                  No history yet. Complete your first workout!
                </Text>
              ) : (
                history.map((entry, index) => (
                  <View
                    key={entry.date}
                    style={[
                      styles.historyEntry,
                      index < history.length - 1 && {
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.historyDate, { color: colors.tint }]}>
                      {entry.date}
                    </Text>
                    <View style={styles.historySets}>
                      {entry.sets.map((set, setIndex) => (
                        <View key={set.id} style={styles.historySetRow}>
                          <Text
                            style={[
                              styles.historySetNumber,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Set {setIndex + 1}
                          </Text>
                          <Text
                            style={[styles.historySetData, { color: colors.text }]}
                          >
                            {formatSetForDisplay(exerciseType, set, {
                              weightUnit,
                              distanceUnit,
                            })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  closeText: {
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 32,
  },
  scroll: {
    flex: 1,
  },
  mediaSection: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noHistoryText: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  historyEntry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  historySets: {
    gap: 4,
  },
  historySetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  historySetNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  historySetData: {
    fontSize: 15,
    fontWeight: "600",
  },
  oneRMSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  oneRMValue: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 4,
  },
  oneRMDisclaimer: {
    fontSize: 12,
    fontStyle: "italic",
  },
});
