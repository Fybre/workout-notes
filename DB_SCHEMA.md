# SQLite Database Schema & Implementation

## Schema

```sql
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE sets (
  id TEXT PRIMARY KEY,
  exerciseId TEXT NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY(exerciseId) REFERENCES exercises(id)
);

CREATE INDEX idx_exercises_date ON exercises(date);
CREATE INDEX idx_sets_exerciseId ON sets(exerciseId);
```

### Tables

**exercises** - One record per exercise per day

- `id` (TEXT, PK): Unique exercise ID (UUID)
- `name` (TEXT): Exercise name (e.g., "Bench Press")
- `date` (TEXT): Date in YYYY-MM-DD format
- `createdAt` (INTEGER): Timestamp when exercise was created

**sets** - Individual sets logged for each exercise

- `id` (TEXT, PK): Unique set ID (UUID)
- `exerciseId` (TEXT, FK): Reference to exercise
- `weight` (REAL): Weight lifted (e.g., 185.5)
- `reps` (INTEGER): Repetitions completed
- `timestamp` (INTEGER): When set was logged

### Indices

- `idx_exercises_date`: Fast lookup of exercises by date
- `idx_sets_exerciseId`: Fast lookup of sets by exercise

## Database Helper Functions

All functions are in `db/database.ts`:

### Initialization

```typescript
// Initialize database on app launch
await initializeDatabase();

// Get database connection
const db = await getDatabase();
```

### Exercise Operations

```typescript
// Add a new exercise
await addExercise(exercise: Exercise)

// Get all exercises for a specific date
const exercises = await getExercisesForDate(date: string)

// Delete an exercise and all its sets
await deleteExercise(exerciseId: string)
```

### Set Operations

```typescript
// Add a set to an exercise
await addSet(exerciseId: string, set: Set)

// Get all sets for an exercise
const sets = await getSetsForExercise(exerciseId: string)

// Update a set's weight and reps
await updateSet(setId: string, weight: number, reps: number)

// Delete a set
await deleteSet(setId: string)
```

### Utility

```typescript
// Clear all data (useful for testing)
await clearAllData();
```

## Example Usage

### From enter-exercise.tsx (Add Set)

```typescript
import { addSet, addExercise } from "@/db/database";

// Initialize exercise on component mount
useEffect(() => {
  const saveExercise = async () => {
    const today = new Date().toISOString().split("T")[0];
    await addExercise({
      id: exerciseId,
      name: exerciseName || "Unknown",
      date: today,
      sets: [],
      createdAt: Date.now(),
    });
  };
  saveExercise().catch(console.error);
}, [exerciseId, exerciseName]);

// Save set when user adds it
const handleAddSet = async () => {
  const newSet = {
    id: uuidv4(),
    weight,
    reps,
    timestamp: Date.now(),
  };

  try {
    await addSet(exerciseId, newSet);
    setSets([...sets, newSet]);
    setWeight(0);
    setReps(0);
  } catch (error) {
    Alert.alert("Error", "Failed to save set");
  }
};
```

### From (tabs)/index.tsx (Load Today's Exercises)

```typescript
import { initializeDatabase, getExercisesForDate } from "@/db/database";
import { useFocusEffect } from "expo-router";

// Initialize database on app launch
useState(() => {
  initializeDatabase().catch(console.error);
});

// Load exercises when screen comes into focus
useFocusEffect(
  useCallback(() => {
    const loadExercises = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const data = await getExercisesForDate(today);
        if (data.length > 0) {
          setExercises(data);
        }
      } catch (error) {
        console.error("Failed to load exercises:", error);
      }
    };
    loadExercises();
  }, []),
);
```

## Data Flow

1. **App Launch** → `initializeDatabase()` creates tables
2. **Home Screen** → `getExercisesForDate(today)` loads exercises
3. **Select Exercise** → Navigate to `enter-exercise` modal
4. **Save Exercise** → `addExercise()` creates exercise record
5. **Add Set** → `addSet()` saves to sets table immediately
6. **Edit Set** → `updateSet()` updates weight/reps
7. **Delete Set** → `deleteSet()` removes from database
8. **Return to Home** → Data reloads via `useFocusEffect`

## Features

✅ **Simple Schema** - Only 2 tables, no complex relationships
✅ **Immediate Persistence** - All changes saved to SQLite immediately
✅ **No Migrations** - Creates tables on first run
✅ **No ORM** - Direct SQL with type safety via TypeScript
✅ **Date Grouping** - Exercises grouped by YYYY-MM-DD date
✅ **Reactive Loading** - Data reloads when screen comes into focus
✅ **Error Handling** - Try/catch blocks with user feedback
