import { Text, View } from "@/components/Themed";
import { useColorScheme, useTheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { Image, Linking, ScrollView, StyleSheet } from "react-native";
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from "react-native-gesture-handler";

interface LinkItem {
  title: string;
  url: string;
  description?: string;
}

interface LibraryAttribution {
  name: string;
  url: string;
  license: string;
}

const GITHUB_BASE_URL = "https://github.com/Fybre/workout-notes/blob/main";

const DOCUMENT_LINKS: LinkItem[] = [
  {
    title: "Privacy Policy",
    url: `${GITHUB_BASE_URL}/PRIVACY.md`,
  },
  {
    title: "Terms of Use",
    url: `${GITHUB_BASE_URL}/TERMS_OF_USE.md`,
  },
  {
    title: "Support",
    url: `${GITHUB_BASE_URL}/SUPPORT.md`,
  },
  {
    title: "License",
    url: `${GITHUB_BASE_URL}/LICENSE.md`,
  },
];

const LIBRARIES: LibraryAttribution[] = [
  {
    name: "Expo",
    url: "https://expo.dev",
    license: "MIT",
  },
  {
    name: "React Native",
    url: "https://reactnative.dev",
    license: "MIT",
  },
  {
    name: "React Navigation",
    url: "https://reactnavigation.org",
    license: "MIT",
  },
  {
    name: "React Native Calendars",
    url: "https://github.com/wix/react-native-calendars",
    license: "MIT",
  },
  {
    name: "React Native Chart Kit",
    url: "https://github.com/indiespirit/react-native-chart-kit",
    license: "MIT",
  },
  {
    name: "React Native Reanimated",
    url: "https://github.com/software-mansion/react-native-reanimated",
    license: "MIT",
  },
  {
    name: "React Native Gesture Handler",
    url: "https://github.com/software-mansion/react-native-gesture-handler",
    license: "MIT",
  },
  {
    name: "date-fns",
    url: "https://date-fns.org",
    license: "MIT",
  },
];

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleClose = () => {
    router.back();
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // Ignore URL open errors
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with title and close button */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            About
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* App Icon and Info */}
          <View style={styles.appInfoSection}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.appIcon}
            />
            <Text style={[styles.appName, { color: colors.text }]}>
              Workout Notes
            </Text>
            <Text style={[styles.appVersion, { color: colors.textSecondary }]}
            >
              Version 1.0.0
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </Text>
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
            >
              Workout Notes is an offline-first mobile application for tracking
              ad-hoc workouts. No predefined plans - just log your exercises as
              you go. Built with simplicity and speed in mind for those who want
              to focus on their workout, not the app.
            </Text>
          </View>

          {/* Developer Link */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Developer
            </Text>
            <TouchableOpacity
              style={[
                styles.linkItem,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => openUrl("https://fybre.me")}
            >
              <View>
                <Text style={[styles.linkTitle, { color: colors.text }]}>
                  Fybre
                </Text>
                <Text
                  style={[styles.linkDescription, { color: colors.textSecondary }]}
                >
                  https://fybre.me
                </Text>
              </View>
              <Text style={[styles.linkArrow, { color: colors.tint }]}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Documents */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Legal
            </Text>
            {DOCUMENT_LINKS.map((link) => (
              <TouchableOpacity
                key={link.title}
                style={[
                  styles.linkItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => openUrl(link.url)}
              >
                <Text style={[styles.linkTitle, { color: colors.text }]}>
                  {link.title}
                </Text>
                <Text style={[styles.linkArrow, { color: colors.tint }]}>
                  →
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Open Source Attribution */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Open Source Libraries
            </Text>
            <Text
              style={[styles.attributionNote, { color: colors.textSecondary }]}
            >
              This app uses the following open source libraries:
            </Text>
            {LIBRARIES.map((lib) => (
              <TouchableOpacity
                key={lib.name}
                style={[
                  styles.libraryItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => openUrl(lib.url)}
              >
                <View style={styles.libraryInfo}>
                  <Text style={[styles.libraryName, { color: colors.text }]}>
                    {lib.name}
                  </Text>
                  <Text
                    style={[
                      styles.libraryLicense,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {lib.license} License
                  </Text>
                </View>
                <Text style={[styles.linkArrow, { color: colors.tint }]}>
                  →
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Copyright */}
          <View style={styles.copyrightSection}>
            <Text style={[styles.copyright, { color: colors.textSecondary }]}>
              © 2026 Fybre. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    marginBottom: 10,
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
  appInfoSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  linkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  linkDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 16,
    fontWeight: "500",
  },
  attributionNote: {
    fontSize: 14,
    marginBottom: 12,
  },
  libraryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    fontSize: 15,
    fontWeight: "500",
  },
  libraryLicense: {
    fontSize: 12,
    marginTop: 2,
  },
  copyrightSection: {
    alignItems: "center",
    marginTop: 8,
  },
  copyright: {
    fontSize: 13,
  },
});
