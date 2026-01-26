import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useDatabase } from "@/contexts/DatabaseContext";
import { getDatesWithExercises } from "@/db/database";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ currentDate?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { isReady: dbReady } = useDatabase();
  const [markedDates, setMarkedDates] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState(
    params.currentDate ? new Date(params.currentDate) : new Date(),
  );

  // Load exercise dates for calendar dots
  useFocusEffect(
    useCallback(() => {
      if (!dbReady) return;

      const loadMarkedDates = async () => {
        // Query 3 months: current month ± 1 month buffer
        const start = new Date(currentMonth);
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);

        const end = new Date(currentMonth);
        end.setMonth(end.getMonth() + 2);
        end.setDate(0);

        const startDate = start.toISOString().split("T")[0];
        const endDate = end.toISOString().split("T")[0];

        const datesWithExercises = await getDatesWithExercises(
          startDate,
          endDate,
        );

        // Transform to calendar format
        const marked = datesWithExercises.reduce((acc: any, date: string) => {
          acc[date] = {
            marked: true,
            dotColor: colors.success,
          };
          return acc;
        }, {});

        // Highlight today
        const today = new Date().toISOString().split("T")[0];
        if (!marked[today]) {
          marked[today] = {};
        }
        marked[today].today = true;
        marked[today].todayTextColor = colors.success;

        setMarkedDates(marked);
      };

      loadMarkedDates();
    }, [dbReady, currentMonth, colors.tint]),
  );

  const handleDayPress = (day: any) => {
    // Navigate back to home with selected date
    router.navigate({
      pathname: "/(tabs)",
      params: { date: day.dateString },
    });
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Select Date
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Calendar
        onDayPress={handleDayPress}
        onMonthChange={(month) => setCurrentMonth(new Date(month.dateString))}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          dayTextColor: colors.text,
          todayTextColor: colors.tint,
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
    paddingHorizontal: 24,
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
