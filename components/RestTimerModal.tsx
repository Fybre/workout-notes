import { useEffect, useRef, useState, useCallback } from "react";
import {
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
} from "react-native";
import { Audio } from "expo-av";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

interface RestTimerModalProps {
  visible: boolean;
  initialTime: number; // in seconds
  onClose: () => void;
  autoStart?: boolean;
}

export default function RestTimerModal({
  visible,
  initialTime,
  onClose,
  autoStart = false,
}: RestTimerModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Initialize sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/sounds/timer-complete.mp3"),
          { shouldPlay: false }
        );
        soundRef.current = sound;
      } catch (error) {

      }
    };

    loadSound();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Reset timer when modal opens
  useEffect(() => {
    if (visible) {
      setTimeRemaining(initialTime);
      setIsRunning(false);
      setIsEditing(false);

      if (autoStart) {
        // Small delay to allow modal to animate in
        setTimeout(() => startTimer(), 300);
      }
    }
  }, [visible, initialTime, autoStart]);

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer complete
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    try {
      await soundRef.current?.replayAsync();
    } catch (error) {

    }
  }, []);

  const startTimer = () => {
    if (timeRemaining > 0) {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const cancelTimer = () => {
    setIsRunning(false);
    onClose();
  };

  const adjustTime = (delta: number) => {
    setTimeRemaining((prev) => Math.max(0, Math.min(600, prev + delta)));
  };

  const handleTimePress = () => {
    setIsEditing(true);
    setEditValue(timeRemaining.toString());
  };

  const handleEditSubmit = () => {
    const newTime = parseInt(editValue, 10);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= 600) {
      setTimeRemaining(newTime);
    }
    setIsEditing(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cancelTimer}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Rest Timer
          </Text>

          {/* Time Display */}
          <View style={styles.timeContainer}>
            <TouchableOpacity
              style={styles.timeAdjustButton}
              onPress={() => adjustTime(-10)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.timeAdjustButtonText, { color: colors.tint }]}
              >
                −10
              </Text>
            </TouchableOpacity>

            {isEditing ? (
              <TextInput
                style={[
                  styles.timeInput,
                  { color: colors.text, borderColor: colors.tint },
                ]}
                value={editValue}
                onChangeText={setEditValue}
                onBlur={handleEditSubmit}
                onSubmitEditing={handleEditSubmit}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
                maxLength={3}
              />
            ) : (
              <TouchableOpacity
                onPress={handleTimePress}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeDisplay, { color: colors.text }]}>
                  {formatTime(timeRemaining)}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.timeAdjustButton}
              onPress={() => adjustTime(10)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.timeAdjustButtonText, { color: colors.tint }]}
              >
                +10
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Text */}
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {isRunning
              ? "Resting..."
              : timeRemaining === 0
              ? "Rest complete!"
              : "Ready to start"}
          </Text>

          {/* Control Buttons */}
          <View style={styles.buttonContainer}>
            {isRunning ? (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  styles.pauseButton,
                  { backgroundColor: colors.warning },
                ]}
                onPress={pauseTimer}
                activeOpacity={0.8}
              >
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  styles.startButton,
                  { backgroundColor: colors.success },
                ]}
                onPress={startTimer}
                activeOpacity={0.8}
              >
                <Text style={styles.controlButtonText}>
                  {timeRemaining === 0 ? "Restart" : "Start"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.cancelButton,
                { backgroundColor: colors.border },
              ]}
              onPress={cancelTimer}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.controlButtonText, { color: colors.text }]}
              >
                {timeRemaining === 0 ? "Close" : "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 16,
  },
  timeAdjustButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timeAdjustButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timeInput: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    borderBottomWidth: 2,
    minWidth: 150,
    textAlign: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  controlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  startButton: {
    flex: 2,
  },
  pauseButton: {
    flex: 2,
  },
  cancelButton: {
    flex: 1,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
