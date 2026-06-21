/**
 * Bottom-sheet single-select list, used in place of the native inline
 * Picker for compact "tap a field, choose from a list" selections.
 *
 * The native @react-native-picker/picker renders as an inline spinning
 * wheel on iOS - squeezing that into a short bordered box (as a normal
 * form field) clips it into something tiny and hard to read/tap, and can
 * shift the page as it tries to scroll the wheel into view. A full-height
 * modal list avoids all of that.
 */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Modal, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function SelectModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectModalProps) {
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
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.content,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                  onPress={() => onSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.rowText,
                      { color: selected ? colors.tint : colors.text },
                      selected && styles.rowTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selected && (
                    <FontAwesome name="check" size={18} color={colors.tint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 18,
    fontWeight: "700",
  },
  closeText: {
    fontSize: 24,
    fontWeight: "400",
    lineHeight: 28,
  },
  list: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  rowText: {
    fontSize: 17,
  },
  rowTextSelected: {
    fontWeight: "700",
  },
});
