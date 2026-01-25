# Workout Notes App - Implementation Plan

## Overview

**Ad-hoc workout tracking app** for iOS and Android using Expo (managed workflow) with TypeScript and Expo Router.

### Core Principles

- No predefined workouts or plans
- Users add exercises on-the-fly
- Fast data entry with large touch targets
- Minimal taps required
- Offline-first, no backend
- Simple, readable code

### Technology Stack

- Framework: Expo (managed workflow)
- Navigation: Expo Router (file-based routing)
- Language: TypeScript
- Styling: React Native StyleSheet (no Tailwind)
- State: Local component state + simple global store
- Persistence: Local (SQLite later)

---

## Screen Structure (Expo Router)

### Folder Layout

```
app/
├── _layout.tsx                (Root layout)
├── (tabs)/                    (Tab navigator group)
│   ├── _layout.tsx           (Tab bar: Home + Settings)
│   ├── index.tsx             (Home screen)
│   └── two.tsx               (Settings - placeholder)
├── select-exercise.tsx          (Modal: Exercise picker)
├── enter-exercise.tsx        (Modal: Log/edit sets)
├── add-exercise-definition.tsx (Modal: Add custom exercise definitions)
├── +html.tsx                 (Existing)
├── +not-found.tsx            (Existing)
└── modal.tsx                 (Existing)

components/
├── EditSetModal.tsx          (Modal for editing/deleting individual sets)
├── Themed.tsx                (Theme-aware View/Text)
├── useColorScheme.ts         (Theme hook)
└── useColorScheme.web.ts     (Web fallback)

db/
├── database.ts               (SQLite persistence layer)
└── seedData.ts               (Initial exercise definitions)

types/
├── workout.ts                (Data model interfaces)
└── index.ts                  (Type exports)

utils/
├── id.ts                     (ID generation)
└── format.ts                 (Formatting utilities)
```

### Routes & Purposes

| Route                     | Type   | Purpose                                    | Status |
| ------------------------- | ------ | ------------------------------------------ | ------ |
| `(tabs)`                  | Group  | Bottom tab navigator                       | ✅     |
| `(tabs)/index`            | Screen | Home - today's workouts + "+" button       | ✅     |
| `(tabs)/two`              | Screen | Settings - placeholder                     | ⏳     |
| `select-exercise`         | Modal  | Exercise picker with categories and search | ✅     |
| `enter-exercise`          | Modal  | Log/edit sets with dynamic input fields    | ✅     |
| `add-exercise-definition` | Modal  | Add custom exercise definitions            | ✅     |

### Navigation Flow

1. **Home** (default) → Tap "+" → Select Exercise modal → Select exercise → Enter Exercise modal
2. **Enter Exercise modal** → Log sets with dynamic input fields → Save → Return to Home
3. **Home** → Tap existing exercise → Enter Exercise modal (edit mode, populated with data)
4. **Enter Exercise modal** → Edit/delete sets → Auto-sync to SQLite → Return to Home
5. **Select Exercise modal** → Tap "+" → Add Exercise Definition modal → Create custom exercise
6. **Home** → Settings tab → Settings screen (placeholder)

---

## Data Model

### TypeScript Types (in `types/workout.ts`)

```
ExerciseType =
  | "weight_reps"
  | "distance_time"
  | "weight_distance"
  | "weight_time"
  | "reps_distance"
  | "reps_time"
  | "weight"
  | "reps"
  | "distance"
  | "time"

Set {
  id: string (UUID)
  reps?: number
  weight?: number
  distance?: number
  time?: number
  timestamp: number (ms, for ordering)
}

Exercise {
  id: string (UUID)
  definitionId: string
  name: string
  type: ExerciseType
  sets: Set[]
  date: string (ISO date: "2026-01-24")
  createdAt: number (timestamp)
}

Workout {
  date: string (ISO date, unique key)
  exercises: Exercise[]
}
```

### Key Design Decisions

- **Exercise definitions** — Separate table for reusable exercise definitions with categories, types, and units
- **Dynamic input fields** — Enter Exercise modal shows/hides fields based on exercise type
- **By-date grouping** — Implicit via Exercise.date field
- **Editing sets** — Find exercise by ID, update set in array
- **Deleting sets** — Remove from array; remove exercise if empty
- **Recent exercises** — Special "Recent" category for frequently used exercises

---

## Component Architecture

### Home Screen (`(tabs)/index.tsx`)

- ✅ Shows today's date prominently
- ✅ Lists exercises for today (loaded from SQLite)
- ✅ Large "+" button ("Start Workout") - 60pt height
- ✅ Tap exercise → opens enter-exercise modal in edit mode (populated with existing sets)
- ✅ Tap "+" → opens select-exercise modal to create new exercise
- ✅ Loads data from SQLite on app launch and when screen comes into focus
- ✅ Swipe-to-delete functionality for exercises
- ✅ Shows set previews with formatted display
- ✅ Empty state with helpful messaging

### Exercise Picker Modal (`select-exercise.tsx`)

- ✅ SectionList with categories (Recent, Chest, Back, Shoulders, Legs, Arms)
- ✅ Sticky section headers for quick navigation
- ✅ 50+ exercise definitions from database
- ✅ Large rows (48pt+) for easy tapping
- ✅ Navigates to enter-exercise modal with exerciseName and exerciseType params
- ✅ "+" button to add custom exercise definitions
- ✅ Recent exercises category for frequently used exercises
- Future: Search/filter functionality

### Enter Exercise Modal (`enter-exercise.tsx`)

- ✅ Header with exercise name and close button (✕)
- ✅ Dynamic input fields based on exercise type (weight, reps, distance, time)
- ✅ Large +/- buttons (44pt) and number displays (40px)
- ✅ Inputs centered at 70% width with minimal vertical gap
- ✅ Add Set button (56pt height) - saves immediately to SQLite
- ✅ Sets list below with large touch targets (48pt+)
- ✅ Tap set → opens EditSetModal for editing/deleting
- ✅ Create mode: Exercise saved only when first set is added
- ✅ Edit mode: Populated with existing exercise data and sets from navigation params
- ✅ Background color synced to prevent white flash on close
- ✅ Auto-sync all changes to SQLite
- ✅ Haptic feedback on successful set addition
- ✅ Smart defaults from exercise history

### EditSetModal (`components/EditSetModal.tsx`)

- ✅ Modal overlay with centered content (90% width, max 500px)
- ✅ Same +/- layout as enter-exercise for consistency
- ✅ Save button to commit weight/reps changes to SQLite
- ✅ Delete button with Alert confirmation
- ✅ Close button to dismiss
- ✅ Works on mobile (iOS/Android)

### Add Exercise Definition Modal (`add-exercise-definition.tsx`)

- ✅ Form with exercise name, category, type, unit, and description
- ✅ Category picker with 8 options (Chest, Back, Shoulders, Legs, Arms, Core, Cardio, Other)
- ✅ Exercise type picker with 10 different exercise types
- ✅ Unit picker that adapts based on exercise type
- ✅ Description field for optional notes
- ✅ Save button that validates and saves to database
- ✅ Navigation back to select-exercise screen after save

### Settings Screen (`(tabs)/settings.tsx`)

- ⏳ Placeholder component created
- Future: Weight unit preference (kg/lbs), theme toggle, etc.

---

## Persistence & Data Flow

### SQLite Implementation (`db/database.ts`)

**Schema:**

- `exercises` table: id, name, date, createdAt
- `sets` table: id, exerciseId, weight, reps, timestamp
- Indices on date and exerciseId for fast lookups

**Key Functions:**

- `initializeDatabase()` - Creates tables on app launch
- `addExercise()` - Creates exercise (only on first set add)
- `addSet()` - Saves individual set, immediate persistence
- `updateSet()` - Modifies weight/reps, immediate persistence
- `deleteSet()` - Removes set, immediate persistence
- `getExercisesForDate()` - Loads all exercises + sets for a date
- `getSetsForExercise()` - Loads all sets for an exercise

**Data Flow:**

1. Home screen calls `getExercisesForDate()` on mount and when focused
2. User selects exercise → navigates to enter-exercise with exercise data
3. User adds/edits/deletes sets → each action immediately saved to SQLite
4. User closes modal → `router.back()` returns to home
5. Home screen refocuses → reloads latest data from SQLite

**Offline-First:**

- All data stored locally in SQLite
- No backend required
- Changes persist across app restarts
- useFocusEffect ensures fresh data on screen return

---

## Styling Approach

- ✅ React Native StyleSheet
- ✅ Theme-aware colors via `useColorScheme()` hook
- ✅ Large touch targets: 44-60pt minimum
- ✅ Dynamic dark/light mode support
- ✅ Input sections centered at 70% width on larger screens
- ✅ Consistent spacing: 4-12px vertical gaps for compact UI
- ✅ No Tailwind (pure StyleSheet)

---

## State Management

- ✅ Local component state for form inputs (weight, reps, sets[])
- ✅ SQLite for persistent storage
- ✅ useFocusEffect for reactive data loading
- ✅ No external state management library needed (simple enough for props/local state)
- Note: ID generation via custom `generateId()` (timestamp + random) - works without crypto

---

## Next Steps (Execution Order)

### Completed ✅

1. ✅ Define requirements & screen structure
2. ✅ Define data model (types in `types/workout.ts`)
3. ✅ Create types file with Set, Exercise, Workout interfaces
4. ✅ Build Home screen with SQLite integration
5. ✅ Build Exercise Picker modal with 50+ exercises
6. ✅ Build Enter Exercise modal with dynamic input fields
7. ✅ Build EditSetModal for set editing/deletion
8. ✅ Build Add Exercise Definition modal for custom exercises
9. ✅ Wire up navigation between modals
10. ✅ Implement SQLite persistence layer with exercise definitions
11. ✅ Theme-aware styling with dark/light mode
12. ✅ Large touch targets (44-60pt)
13. ✅ Immediate persistence on add/edit/delete
14. ✅ Edit existing exercises from home screen
15. ✅ Swipe-to-delete functionality
16. ✅ Smart defaults from exercise history
17. ✅ Haptic feedback for user confirmation
18. ✅ Recent exercises tracking

### In Progress ⏳

- Settings screen placeholder (exists but needs implementation)

### Future Enhancements 🔮

1. Settings: Unit preference (kg/lbs), theme toggle
2. Exercise history: Search/filter functionality
3. Analytics: Volume trends, PR tracking
4. Backup/export: iCloud sync, CSV export
5. Exercise notes: Add text notes to sets
6. Photo capture: Log exercise with photos
7. Multi-language support
8. Exercise categories: Core, Cardio, Other

---

## Design Notes

- ✅ Ad-hoc means users don't pre-plan; exercises are added as they happen
- ✅ "Fast data entry" achieved via:
  - Dynamic form fields based on exercise type (weight, reps, distance, time)
  - Large buttons and touch targets (44-60pt)
  - +/- increment buttons for quick adjustments
  - Direct set add with no confirmation dialog
  - Immediate SQLite persistence
  - Smart defaults from exercise history
- ✅ Exercise definitions provide reusable templates with categories, types, and units
- ✅ SQLite provides offline-first, no-backend approach
- ✅ Modal animations enabled for smooth UX
- ✅ Background color synced to prevent visual flash on close
- 📱 Primary target: Mobile (iOS/Android via Expo)
- 🌐 Web support: Basic functionality (modal state sync may have minor issues)
