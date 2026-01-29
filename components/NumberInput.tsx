/**
 * Reusable number input component with +/- buttons
 * Used for weight, reps, distance, and time inputs
 */

import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardTypeOptions,
} from "react-native";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  increment?: number;
  min?: number;
  max?: number;
  decimals?: number;
  unit?: string;
  keyboardType?: KeyboardTypeOptions;
  width?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  increment = 1,
  min = 0,
  max,
  decimals = 0,
  unit,
  keyboardType = "decimal-pad",
  width = "80%",
}: NumberInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [inputVisible, setInputVisible] = useState(false);

  const displayValue = decimals > 0 ? value.toFixed(decimals) : value.toString();
  const labelText = unit ? `${label} (${unit})` : label;

  const handleDecrement = () => {
    const newValue = Math.max(min, value - increment);
    onChange(newValue);
  };

  const handleIncrement = () => {
    if (max !== undefined) {
      const newValue = Math.min(max, value + increment);
      onChange(newValue);
    } else {
      onChange(value + increment);
    }
  };

  const handleTextChange = (text: string) => {
    const num = parseFloat(text) || 0;
    onChange(num);
  };

  return (
    <View style={[styles.container, { width }] as any}>
      <Text style={[styles.label, { color: colors.text }]}>{labelText}</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.button, { borderColor: colors.tint }]}
          onPress={handleDecrement}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: colors.tint }]}>−</Text>
        </TouchableOpacity>

        {inputVisible ? (
          <TextInput
            style={[
              styles.visibleInput,
              { color: colors.text, backgroundColor: colors.surface },
            ]}
            keyboardType={keyboardType}
            placeholder={label}
            value={displayValue}
            onChangeText={handleTextChange}
            onBlur={() => setInputVisible(false)}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.numberField}
            onPress={() => setInputVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.numberText, { color: colors.text }]}>
              {value === 0 ? "—" : displayValue}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { borderColor: colors.tint }]}
          onPress={handleIncrement}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: colors.tint }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 12,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
  numberField: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  numberText: {
    fontSize: 32,
    fontWeight: "700",
  },
  visibleInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
