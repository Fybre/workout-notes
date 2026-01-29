import FontAwesome from "@expo/vector-icons/FontAwesome";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { addDays, parseDateParam } from "@/utils/date";

// Custom tab bar with date navigation
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  // Get current date from the active tab's params
  const activeRoute = state.routes[state.index];
  const params = activeRoute.params as { date?: string } | undefined;
  const currentDate = parseDateParam(params?.date);



  const handlePrevDay = () => {
    const prevDate = addDays(currentDate, -1);
    navigation.setParams({ date: prevDate });
  };

  const handleNextDay = () => {
    const nextDate = addDays(currentDate, 1);
    navigation.setParams({ date: nextDate });
  };

  const handleCalendarPress = () => {
    navigation.navigate("calendar", { currentDate });
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePrevDay}
        style={styles.navButton}
        activeOpacity={0.7}
      >
        <FontAwesome name="chevron-left" size={20} color={colors.tint} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleCalendarPress}
        style={[styles.calendarButton, { backgroundColor: colors.tint }]}
        activeOpacity={0.8}
      >
        <FontAwesome name="calendar" size={22} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleNextDay}
        style={styles.navButton}
        activeOpacity={0.7}
      >
        <FontAwesome name="chevron-right" size={20} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 12,
    paddingHorizontal: 40,
    borderTopWidth: 1,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  );
}
