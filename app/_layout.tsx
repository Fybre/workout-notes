import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import { UnitProvider } from "@/contexts/UnitContext";

// Custom themes matching our color palette
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
  cardStyle: {
    backgroundColor: Colors.light.background,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
  cardStyle: {
    backgroundColor: Colors.dark.background,
  },
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <UnitProvider>
        <RootLayoutNav />
      </UnitProvider>
    </CustomThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <DatabaseProvider>
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack
            screenOptions={{
              // Prevent white flash during transitions by setting content style
              contentStyle: {
                backgroundColor: colors.background,
              },
              animationTypeForReplace: "push",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                contentStyle: {
                  backgroundColor: colors.background,
                },
              }}
            />
            <Stack.Screen
              name="select-exercise"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                contentStyle: {
                  backgroundColor: colors.background,
                },
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="enter-exercise"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                contentStyle: {
                  backgroundColor: colors.background,
                },
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="add-exercise-definition"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                contentStyle: {
                  backgroundColor: colors.background,
                },
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="calendar"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                contentStyle: {
                  backgroundColor: colors.background,
                },
                animation: "slide_from_left",
                gestureEnabled: true,
                gestureDirection: "horizontal",
              }}
            />
            <Stack.Screen
              name="settings-modal"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                contentStyle: {
                  backgroundColor: colors.background,
                },
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
        </View>
      </ThemeProvider>
    </DatabaseProvider>
  );
}
