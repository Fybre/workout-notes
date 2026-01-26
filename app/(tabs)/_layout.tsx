import FontAwesome from "@expo/vector-icons/FontAwesome";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

// Custom tab bar with date navigation
function CustomTabBar({ state }: BottomTabBarProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  // Get current date from route params
  const currentRoute = state.routes[state.index];
  const currentDateParam = (currentRoute.params as { date?: string })?.date;
  const currentDate = currentDateParam
    ? new Date(currentDateParam)
    : new Date();

  const handlePrevDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    router.setParams({ date: prevDate.toISOString().split("T")[0] });
  };

  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    router.setParams({ date: nextDate.toISOString().split("T")[0] });
  };

  const handleCalendarPress = () => {
    router.push({
      pathname: "/calendar",
      params: { currentDate: currentDate.toISOString().split("T")[0] },
    } as any);
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
