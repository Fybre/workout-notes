/**
 * Photo/video picker + preview for an exercise definition
 * Lets the user attach a reference photo or video of equipment/technique
 */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ResizeMode, Video } from "expo-av";
import { Alert, Image, StyleSheet, TouchableOpacity } from "react-native";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  captureExerciseMedia,
  pickExerciseMediaFromLibrary,
  type ExerciseMedia,
} from "@/utils/media";

interface ExerciseMediaPickerProps {
  mediaUri: string | null;
  mediaType: "image" | "video" | null;
  onChange: (media: ExerciseMedia | null) => void;
}

export function ExerciseMediaPicker({
  mediaUri,
  mediaType,
  onChange,
}: ExerciseMediaPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const showPickerOptions = () => {
    Alert.alert(
      "Photo or Video",
      "Add a reference photo or video showing the equipment or training style for this exercise.",
      [
        {
          text: "Take Photo / Video",
          onPress: async () => {
            const media = await captureExerciseMedia();
            if (media) onChange(media);
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            const media = await pickExerciseMediaFromLibrary();
            if (media) onChange(media);
          },
        },
        ...(mediaUri
          ? [
              {
                text: "Remove",
                style: "destructive" as const,
                onPress: () => onChange(null),
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {mediaUri ? (
        <TouchableOpacity
          onPress={showPickerOptions}
          activeOpacity={0.8}
          style={[styles.preview, { borderColor: colors.border }]}
        >
          {mediaType === "video" ? (
            <Video
              source={{ uri: mediaUri }}
              style={styles.previewMedia}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          ) : (
            <Image
              source={{ uri: mediaUri }}
              style={styles.previewMedia}
              resizeMode="contain"
            />
          )}
          <View style={[styles.editBadge, { backgroundColor: colors.tint }]}>
            <FontAwesome name="pencil" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={showPickerOptions}
          activeOpacity={0.7}
          style={[
            styles.addButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FontAwesome name="camera" size={22} color={colors.textSecondary} />
          <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
            Add Photo / Video
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
