# Workout Notes - Agent Documentation

## Project Overview

**Workout Notes** is an offline-first mobile application for tracking ad-hoc workouts on iOS and Android. Built with Expo (managed workflow) and React Native, it allows users to log exercises on-the-fly without predefined workout plans.

### Core Principles

- No predefined workouts or plans - users add exercises spontaneously
- Fast data entry with large touch targets optimized for use during workouts
- Minimal taps required to log sets
- Offline-first with no backend dependencies
- Simple, readable, maintainable code

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo (~54.0.32) with managed workflow |
| Language | TypeScript (~5.9.2) |
| Navigation | Expo Router (~6.0.22) - file-based routing |
| UI | React Native (0.81.5) with StyleSheet (no Tailwind) |
| Database | SQLite via expo-sqlite (^16.0.10) |
| State Management | React Context API + local component state |
| Storage | AsyncStorage for user preferences |
| Icons | @expo/vector-icons |

## Project Structure

```
workout-notes/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigator group
│   │   ├── _layout.tsx          # Tab bar configuration
│   │   ├── index.tsx            # Home screen (today's workouts)
│   │   └── settings-modal.tsx   # Settings screen
│   ├── _layout.tsx              # Root layout with providers
│   ├── select-exercise.tsx      # Exercise picker modal
│   ├── enter-exercise.tsx       # Log/edit sets modal
│   ├── add-exercise-definition.tsx  # Create custom exercise
│   ├── calendar.tsx             # Calendar navigation modal
│   ├── +html.tsx                # HTML wrapper for web
│   ├── +not-found.tsx           # 404 page
│   └── modal.tsx                # Example modal
├── components/                   # Reusable UI components
│   ├── Themed.tsx               # Theme-aware View/Text
│   ├── EditSetModal.tsx         # Edit/delete set modal
│   ├── Celebration.tsx          # Personal best confetti animation
│   ├── RestTimerModal.tsx       # Rest timer between sets
│   └── useColorScheme.ts        # Theme detection hooks
├── contexts/                     # React Context providers
│   ├── DatabaseContext.tsx      # SQLite initialization state
│   ├── ThemeContext.tsx         # Theme management
│   └── UnitContext.tsx          # Unit preferences (kg/lbs)
├── db/                          # Database layer
│   ├── database.ts              # Core SQLite operations
│   ├── schema.ts                # Schema versioning & migrations
│   ├── backup.ts                # Backup/restore functionality
│   ├── export.ts                # CSV export
│   ├── seedData_light.ts        # Initial exercise definitions
│   └── index.ts                 # Module exports
├── hooks/                        # Custom React hooks
│   └── useDateNavigation.ts     # Date navigation with URL params
├── types/                        # TypeScript type definitions
│   ├── workout.ts               # Exercise, Set, Workout types
│   └── index.ts                 # Type exports
├── utils/                        # Utility functions
│   ├── date.ts                  # Date manipulation utilities
│   ├── format.ts                # Exercise formatting utilities
│   ├── units.ts                 # Unit conversion (kg/lbs, km/miles)
│   └── id.ts                    # UUID generation
├── constants/                    # App constants
│   └── Colors.ts                # Theme color definitions
└── assets/                       # Static assets
    ├── images/                   # Icons, splash screen
    └── fonts/                    # Custom fonts
```

## Build and Run Commands

```bash
# Install dependencies
npm install

# Start the development server
npm start
# or
npx expo start

# Run on specific platforms
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device (macOS only)
npm run web        # Web browser

# Clear cache and restart
npx expo start --clear
```

### Prerequisites

- Node.js (LTS recommended)
- Expo CLI (`npx expo`)
- For iOS: macOS with Xcode
- For Android: Android Studio with SDK

## Architecture Details

### Navigation (Expo Router)

The app uses file-based routing with modal presentations:

| Route | Type | Purpose |
|-------|------|---------|
| `(tabs)` | Group | Bottom tab navigator (Home + Settings) |
| `(tabs)/index` | Screen | Home - workout list for selected date |
| `select-exercise` | Modal | Exercise picker with categories |
| `enter-exercise` | Modal | Log/edit exercise sets |
| `add-exercise-definition` | Modal | Create custom exercises |
| `calendar` | Modal | Date selection with swipe gestures |
| `settings-modal` | Modal | App settings |

Modals use `presentation: "transparentModal"` with slide-from-bottom animations.

### Database Architecture

**SQLite Schema (4 tables):**

```sql
schema_version          -- Tracks schema migrations
exercise_definitions    -- Catalog of available exercises (50+ predefined)
exercises              -- Exercises logged by date
sets                   -- Individual sets with weight/reps/distance/time
```

**Key Design Decisions:**

- All values stored in canonical units (kg, km) - converted at display/input time
- Immediate persistence - every change saves to SQLite instantly
- Schema versioning with migration system for future changes
- No ORM - direct SQL with TypeScript type safety

**Data Flow:**

1. App launch → `initializeSchema()` creates/updates tables
2. Home screen → `getExercisesForDate(date)` loads via `useFocusEffect`
3. User actions → Immediate SQLite write → Return to home → Auto-reload

### State Management

| State Type | Implementation |
|------------|----------------|
| Database | `DatabaseContext` - provides `isReady` state |
| Theme | `ThemeContext` - light/dark/system preference |
| Units | `UnitContext` - kg/lbs, km/miles preferences |
| Local UI | Component `useState` for forms/inputs |
| Navigation | URL params via `useLocalSearchParams` |

### Date Navigation System

Centralized date handling through `hooks/useDateNavigation.ts`:

```typescript
const { date, goToPrevDay, goToNextDay, goToToday, isToday } = useDateNavigation();
const date = useCurrentDate();  // Read-only access
```

- Dates stored as ISO strings (`YYYY-MM-DD`)
- URL params synchronize date across screens
- All date utilities in `utils/date.ts`

## Code Style Guidelines

### TypeScript Conventions

- **Strict mode enabled** - no implicit any
- Use type imports: `import type { Exercise } from "@/types"`
- Interface naming: `PascalCase` (e.g., `Exercise`, `Set`)
- Type naming: `PascalCase` with suffix (e.g., `ExerciseType`)

### Import Patterns

```typescript
// External libraries first
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

// Internal aliases (from @/* paths)
import { Text } from "@/components/Themed";
import { useDatabase } from "@/contexts/DatabaseContext";
import { getExercisesForDate } from "@/db/database";
import type { Exercise } from "@/types";
import { formatDisplayDate } from "@/utils/date";
```

### Styling Conventions

- **Pure StyleSheet** - no Tailwind or styled-components
- Theme-aware colors via `Colors[colorScheme]`
- Minimum touch targets: 44pt (buttons), 48pt+ (list items)
- Shadows for elevation on cards

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
```

### Component Patterns

- Use themed components from `@/components/Themed` for auto theme support
- Destructure props at component level
- Use `useColorScheme()` hook for theme-aware styling

```typescript
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function MyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Content</Text>
    </View>
  );
}
```

## Testing Strategy

Currently, the project relies on:

1. **Manual Testing** - Test plans documented (see `test-date-navigation.md`)
2. **Type Checking** - TypeScript strict mode catches type errors
3. **Runtime Validation** - SQLite operations wrapped in try/catch with user feedback

### Test Plans

- Date navigation edge cases (rapid taps, timezone boundaries)
- Database backup/restore operations
- Unit conversion accuracy
- Personal Best detection logic

### Future Testing Enhancements

- Jest for unit testing utilities (`utils/`, `hooks/`)
- React Native Testing Library for component tests
- E2E tests with Detox for critical user flows

## Key Features Implementation

### Exercise Types

The app supports 10 exercise types with dynamic input fields:

| Type | Fields | PB Logic |
|------|--------|----------|
| `weight_reps` | Weight + Reps | Highest weight (reps tiebreaker) |
| `weight` | Weight only | Highest weight |
| `reps` | Reps only | Most reps |
| `distance_time` | Distance + Time | Longest distance |
| `distance` | Distance only | Longest distance |
| `time_duration` | Time only | Longest time (holds/planks) |
| `time_speed` | Time only | Shortest time (sprints) |
| `weight_distance` | Weight + Distance | Highest weight |
| `weight_time` | Weight + Time | Highest weight |
| `reps_distance` | Reps + Distance | Most reps |
| `reps_time` | Reps + Time | Most reps |

### Personal Best System

- Computed on-the-fly when loading exercises
- Historical comparison excludes current date
- Visual indicator (🏆) on best set of the day
- Celebration animation on new PB

### Unit System

All values stored in canonical units (kg, km), converted for display:

```
User Input (lbs) → Convert to kg → Store in DB
DB Value (kg)    → Convert to lbs → Display to User
```

- Weight: kg (1 decimal) or lbs (0.5 increments)
- Distance: km or miles (2 decimals)
- Increment buttons use user-configurable step size

## Security Considerations

- **Local-only data** - No network requests, no backend
- **File backups** - User-initiated backup/restore to device storage
- **No sensitive data** - Workout data is fitness metrics only
- **SQLite security** - Database stored in app's private document directory

## Development Workflow

### Adding a New Screen

1. Create file in `app/` directory (e.g., `app/new-screen.tsx`)
2. Add route configuration in `app/_layout.tsx` if modal presentation needed
3. Use themed components and follow styling patterns
4. Add navigation from appropriate screen using `useRouter()`

### Adding a Database Migration

1. Edit `db/schema.ts`
2. Add migration to `migrations` array with new version number
3. Increment `CURRENT_SCHEMA_VERSION`
4. Test migration on existing database

### Adding an Exercise Definition

Edit `db/seedData_light.ts` and add to `INITIAL_EXERCISES` array:

```typescript
{
  id: generateId(),
  name: "Exercise Name",
  category: "Category",  // Chest, Back, Legs, etc.
  type: "weight_reps",   // From ExerciseType
  unit: "weight",        // weight, reps, distance, time
  description: "Optional description",
  createdAt: Date.now(),
}
```

## Common Issues and Solutions

### White Flash During Navigation

Fixed by setting `contentStyle` background color in Stack navigator options and wrapping the app in a View with background color.

### Database Not Ready

Components should check `const { isReady } = useDatabase()` and show loading state until ready.

### Date Timezone Issues

All date handling uses local timezone via `utils/date.ts` - never use `toISOString()` directly for dates.

## File References

- **Plan/Status**: `plan.md` - Detailed implementation status
- **Database Schema**: `DB_SCHEMA.md` - Complete schema documentation
- **Date Navigation**: `test-date-navigation.md` - Date system test plan
