import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  applyTemplateToDate,
  deleteTemplate,
  getAllTemplates,
} from "@/db/database";
import { parseDateParam } from "@/utils/date";

interface TemplateItem {
  id: string;
  name: string;
  exerciseCount: number;
}

export default function TemplatesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const date = parseDateParam(dateParam);

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates]),
  );

  const handleApplyTemplate = (template: TemplateItem) => {
    Alert.alert(
      "Apply Template",
      `Add the ${template.exerciseCount} exercise${template.exerciseCount === 1 ? "" : "s"} from "${template.name}" to this day?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            try {
              await applyTemplateToDate(template.id, date);
              router.dismissTo({ pathname: "/(tabs)", params: { date } });
            } catch (error) {
              Alert.alert("Error", "Failed to apply template");
            }
          },
        },
      ],
    );
  };

  const handleDeleteTemplate = (template: TemplateItem) => {
    Alert.alert(
      "Delete Template",
      `Delete the template "${template.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTemplate(template.id);
              loadTemplates();
            } catch (error) {
              Alert.alert("Error", "Failed to delete template");
            }
          },
        },
      ],
    );
  };

  const renderRightActions = (template: TemplateItem) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDeleteTemplate(template)}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Templates
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Text style={[styles.closeText, { color: colors.tint }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {!loading && templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No templates yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Save today's exercises as a template from the home screen menu
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {templates.map((template) => (
              <Swipeable
                key={template.id}
                renderRightActions={() => renderRightActions(template)}
                overshootRight={false}
                friction={2}
              >
                <TouchableOpacity
                  style={[
                    styles.templateRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleApplyTemplate(template)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: colors.text }]}>
                      {template.name}
                    </Text>
                    <Text
                      style={[
                        styles.templateCount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {template.exerciseCount} exercise
                      {template.exerciseCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <FontAwesome
                    name="chevron-right"
                    size={14}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </Swipeable>
            ))}
          </ScrollView>
        )}
      </View>
    </GestureHandlerRootView>
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
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
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  templateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 17,
    fontWeight: "600",
  },
  templateCount: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteAction: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
