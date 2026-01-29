/**
 * Calendar View Component
 * Displays a month calendar with marked exercise dates
 */

import { Calendar } from "react-native-calendars";
import { View, StyleSheet } from "react-native";

import { Text } from "@/components/Themed";
import type { ThemeColors } from "@/components/calendar/types";

interface CalendarViewProps {
  selectedDate: string;
  markedDates: Record<string, any>;
  colors: ThemeColors;
  onDayPress: (day: any) => void;
  onMonthChange?: (month: any) => void;
}

export function CalendarView({
  selectedDate,
  markedDates,
  colors,
  onDayPress,
  onMonthChange,
}: CalendarViewProps) {
  return (
    <>
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          dayTextColor: colors.text,
          monthTextColor: colors.text,
          textDisabledColor: colors.textSecondary,
          dotColor: colors.success,
          selectedDotColor: "#ffffff",
          arrowColor: colors.tint,
          textDayFontWeight: "500",
          textMonthFontWeight: "700",
          textDayHeaderFontWeight: "600",
        }}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Has exercises
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  legend: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
