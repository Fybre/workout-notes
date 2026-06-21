/**
 * Exercise media (photo/video) capture, persistence, and cleanup
 */
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import { generateId } from "@/utils/id";

export const MEDIA_DIR_NAME = "exercise-media";

export type ExerciseMediaType = "image" | "video";

export interface ExerciseMedia {
  uri: string;
  type: ExerciseMediaType;
}

function getMediaDirectory(): Directory {
  const dir = new Directory(Paths.document, MEDIA_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

/**
 * Re-roots a stored mediaUri under the CURRENT document directory's media
 * folder, using only its filename. The document directory's actual
 * filesystem path is reassigned by iOS/Android on every reinstall (and
 * differs on every device), so an absolute path saved to the database can
 * go stale - re-deriving it from the filename on every read makes restoring
 * a backup (or just reinstalling the app) work without a migration.
 */
export function resolveMediaUri(stored: string | null): string | null {
  if (!stored) return null;
  const filename = stored.substring(stored.lastIndexOf("/") + 1);
  if (!filename) return null;
  return new File(getMediaDirectory(), filename).uri;
}

async function persistAsset(
  asset: ImagePicker.ImagePickerAsset,
): Promise<ExerciseMedia> {
  const type: ExerciseMediaType = asset.type === "video" ? "video" : "image";
  const extension = asset.uri.includes(".")
    ? asset.uri.substring(asset.uri.lastIndexOf("."))
    : type === "video"
      ? ".mp4"
      : ".jpg";

  const sourceFile = new File(asset.uri);
  const destFile = new File(getMediaDirectory(), `${generateId()}${extension}`);
  sourceFile.copy(destFile);

  return { uri: destFile.uri, type };
}

/**
 * Launch the camera to take a photo or record a video for an exercise.
 * Returns null if the user cancels or permission is denied.
 */
export async function captureExerciseMedia(): Promise<ExerciseMedia | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images", "videos"],
    quality: 0.7,
    videoMaxDuration: 30,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return persistAsset(result.assets[0]);
}

/**
 * Launch the photo library to pick a photo or video for an exercise.
 * Returns null if the user cancels or permission is denied.
 */
export async function pickExerciseMediaFromLibrary(): Promise<ExerciseMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    quality: 0.7,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return persistAsset(result.assets[0]);
}

/**
 * Delete a previously persisted exercise media file. Safe to call even if
 * the file no longer exists.
 */
export async function deleteExerciseMediaFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore - file may already be gone or URI may be invalid
  }
}
