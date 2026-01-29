/**
 * Agenda View Component
 * Displays workouts as a scrollable list grouped by date
 */

import { SectionList, TouchableOpacity, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import { useUnits } from "@/contexts/UnitContext";
import { formatSetForDisplay } from "@/utils/format";
import type { ThemeColors } from "./types";
import type { ExerciseType, Set } from "@/types/workout";
import type { DaySection } from "./types";

interface AgendaViewProps {
  selectedDate: string;
  groupedExercises: DaySection[];
  isLoading: boolean;
  showEmptyDays: boolean;
  hasMoreData?: boolean;
  colors: ThemeColors;
  onToggleEmptyDays: () => void;
  onSelectDate: (date: string) => void;
  onRefresh?: () => void;
  onExercisePress?: (exercise: {
    id: string;
    name: string;
    type: ExerciseType;
    sets: Set[];
    date: string;
  }) => void;
  onLoadMore?: () => void;
}

export function AgendaView({
  selectedDate,
  groupedExercises,
  isLoading,
  showEmptyDays,
  hasMoreData = false,
  colors,
  onToggleEmptyDays,
  onSelectDate,
  onRefresh,
  onExercisePress,
  onLoadMore,
}: AgendaViewProps) {
  const { weightUnit, distanceUnit } = useUnits();

  const renderAgendaItem = ({ item }: { item: DaySection["data"][0] }) => {
    const summary = item.sets
      .map((set) => formatSetForDisplay(item.type as ExerciseType, set, { weightUnit, distanceUnit }))
      .join(", ");

    return (
      <TouchableOpacity
        style={[styles.agendaItem, { borderBottomColor: colors.border }]}
        onPress={() =>
          onExercisePress?.({
            id: item.id,
            name: item.name,
            type: item.type as ExerciseType,
            sets: item.sets,
            date: item.date,
          })
        }
        activeOpacity={0.7}
      >
        <Text style={[styles.agendaItemName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.agendaItemSummary, { color: colors.textSecondary }]}>
          {item.sets.length} {item.sets.length === 1 ? "set" : "sets"}: {summary}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: DaySection }) => {
    const isEmpty = section.data.length === 0;
    return (
      <TouchableOpacity
        style={[styles.agendaDayHeader, { backgroundColor: colors.background }]}
        onPress={() => onSelectDate(section.date)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.agendaDayText,
            { color: isEmpty ? colors.textSecondary : colors.tint },
            isEmpty && styles.agendaDayTextEmpty,
          ]}
        >
          {section.title}
          {isEmpty && " (rest)"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Empty Days Toggle */}
      <View
        style={[
          styles.emptyDaysToggleContainer,
          { borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.emptyDaysToggleText, { color: colors.text }]}>
          Show rest days
        </Text>
        <TouchableOpacity
          style={[
            styles.emptyDaysToggle,
            { backgroundColor: showEmptyDays ? colors.tint : colors.border },
          ]}
          onPress={onToggleEmptyDays}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.emptyDaysToggleKnob,
              {
                backgroundColor: "#ffffff",
                transform: [{ translateX: showEmptyDays ? 20 : 0 }],
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={groupedExercises}
        keyExtractor={(item, index) => item.id || `empty-${index}`}
        renderItem={renderAgendaItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.agendaList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No workouts yet
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMoreData ? (
            <TouchableOpacity
              style={[styles.loadMoreButton, { borderColor: colors.border }]}
              onPress={onLoadMore}
              activeOpacity={0.7}
            >
              <Text style={[styles.loadMoreText, { color: colors.tint }]}>
                Load More
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  agendaList: {
    paddingBottom: 40,
  },
  agendaDayHeader: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  agendaDayText: {
    fontSize: 16,
    fontWeight: "700",
  },
  agendaDayTextEmpty: {
    fontStyle: "italic",
  },
  emptyDaysToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  emptyDaysToggleText: {
    fontSize: 15,
    fontWeight: "500",
  },
  emptyDaysToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  emptyDaysToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  agendaItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  agendaItemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  agendaItemSummary: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  loadMoreButton: {
    marginHorizontal: 24,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
