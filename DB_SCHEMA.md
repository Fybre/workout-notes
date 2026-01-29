# SQLite Database Schema & Implementation

## Schema

```sql
-- Schema version tracking
CREATE TABLE schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Exercise definitions (catalog of available exercises)
CREATE TABLE exercise_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  createdAt INTEGER NOT NULL
);

-- Exercises logged by date
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  definitionId TEXT NOT NULL,
  date TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY(definitionId) REFERENCES exercise_definitions(id)
);

-- Individual sets
CREATE TABLE sets (
  id TEXT PRIMARY KEY,
  exerciseId TEXT NOT NULL,
  weight REAL,
  reps INTEGER,
  distance REAL,
  time INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY(exerciseId) REFERENCES exercises(id)
);

CREATE INDEX idx_exercises_date ON exercises(date);
CREATE INDEX idx_sets_exerciseId ON sets(exerciseId);
CREATE INDEX idx_exercise_definitions_name ON exercise_definitions(name);
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


## Schema Versioning & Migrations

The database includes a schema version tracking system to handle future schema changes.

### Schema Version Table

```sql
CREATE TABLE schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

### Current Version

```typescript
const CURRENT_SCHEMA_VERSION = 1;
```

### Adding Migrations

To add a new migration, edit `db/schema.ts`:

```typescript
export const migrations: Migration[] = [
  {
    version: 2,
    name: "Add user_preferences table",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
];
```

Then increment `CURRENT_SCHEMA_VERSION` to match the highest migration version.

### Migration API

```typescript
import { 
  getCurrentSchemaVersion, 
  runMigrations,
  validateSchema 
} from "@/db/schema";
import { getDatabase } from "@/db/database";

const db = getDatabase();

// Get current version
const version = await getCurrentSchemaVersion(db);

// Run pending migrations
const migrationsApplied = await runMigrations(db);

// Validate database integrity
const isValid = await validateSchema(db);
```

## Backup & Restore

File-level backup and restore functionality is available in `db/backup.ts`.

### Features

- **Atomic backups** - Single file copy operation
- **Share functionality** - Export backups via native share sheet
- **Automatic validation** - Validates backup files before restore
- **Safety backup** - Current database is backed up before restore
- **App restart required** - After restore, app restart loads new data

### Backup API

```typescript
import { 
  createAndShareBackup, 
  pickAndRestoreBackup,
  getDatabaseSize,
  formatFileSize 
} from "@/db/backup";

// Create and share backup
const result = await createAndShareBackup();
if (result.success) {
  console.log(`Backup: ${result.fileName} (${formatFileSize(result.fileSize)})`);
}

// Restore from backup
const restore = await pickAndRestoreBackup();
if (restore.success) {
  // App restart required
}

// Get database info
const size = await getDatabaseSize();
```

### Usage in Settings

The Settings modal includes UI for:
- **Database Size** - Shows current database size
- **Backup Data** - Creates and shares a `.db` backup file
- **Restore Data** - Picks a backup file and restores it

### Backup File Format

Backups are standard SQLite database files with naming convention:
```
workout-backup-YYYY-MM-DD-HH-mm-ss.db
```

### Implementation Details

1. **Backup Location**: Files are created in the app's cache directory for sharing
2. **Database Location**: `SQLite/workout.db` in the app's document directory
3. **Safety**: Current database is saved as `pre-restore-backup-<timestamp>.db` before restore
4. **Validation**: Files are checked for minimum size (4KB) and SQLite format

## CSV Export

Export workout data to CSV format for analysis in Excel, Google Sheets, or other applications.

### CSV Format

The exported CSV includes the following columns:

| Column | Description |
|--------|-------------|
| `Date` | Exercise date (YYYY-MM-DD) |
| `Exercise` | Exercise name |
| `Category` | Exercise category (e.g., Chest, Back, Legs) |
| `Type` | Exercise type (e.g., Weight & Reps, Distance & Time) |
| `Set #` | Set number for the exercise on that date |
| `Weight` | Weight lifted (if applicable) |
| `Reps` | Repetitions completed (if applicable) |
| `Distance` | Distance covered (if applicable) |
| `Time (seconds)` | Time in seconds (if applicable) |
| `Time (formatted)` | Time formatted as M:SS |

### Sample CSV Output

```csv
Date,Exercise,Category,Type,Set #,Weight,Reps,Distance,Time (seconds),Time (formatted)
2024-01-15,Bench Press,Chest,Weight & Reps,1,185,10,,,
2024-01-15,Bench Press,Chest,Weight & Reps,2,185,9,,,
2024-01-15,Squat,Legs,Weight & Reps,1,225,8,,,
2024-01-16,Running,Cardio,Distance & Time,1,,,5000,1800,30:00
```

### Export API

```typescript
import { exportAndShareCsv, exportToCsv } from "@/db/export";

// Export and share in one operation
const result = await exportAndShareCsv();
if (result.success) {
  console.log(`Exported ${result.recordCount} records`);
}

// Just create the file (without sharing)
const result = await exportToCsv();
if (result.success) {
  // result.fileUri contains the file path
  // result.fileName contains the filename
}
```

### Usage in Home Screen

The home screen menu (⋮ button) includes an **"Export to CSV"** option that:
1. Exports all workout data to a CSV file
2. Opens the native share sheet to save/share the file
3. Shows loading indicator during export
4. Displays success/error alerts

### Export File Naming

Files are named with the current date:
```
workout-export-YYYY-MM-DD.csv
```

## Unit System

The app supports both metric (kg, km) and imperial (lbs, miles) units for weight and distance measurements.

### Storage Strategy

**All values are stored in canonical units (kg, km) in the database.**

```
User Input (lbs) → Convert to kg → Store in DB
DB Value (kg)    → Convert to lbs → Display to User
```

### Why This Approach?

- **Data consistency** - All data in DB is in standard units
- **Easy unit switching** - User can switch units anytime without data migration
- **Accurate calculations** - PB detection and 1RM calculations work on consistent units
- **Clean exports** - CSV exports raw kg values for data portability

### Supported Conversions

| Measurement | Storage Unit | Display Options | Conversion |
|-------------|--------------|-----------------|------------|
| Weight      | kg           | kg, lbs         | 1 kg = 2.20462 lbs |
| Distance    | km           | km, miles       | 1 km = 0.621371 miles |

### User Preferences

Users can set their preferred units in Settings:
- **Weight**: kg or lbs
- **Weight Increment**: Amount to add/subtract with +/- buttons (e.g., 2.5 kg, 5 lbs)
- **Distance**: km or miles

Preferences are persisted to AsyncStorage and apply app-wide immediately.

### Weight Increment

Users can customize the increment amount used by the +/- buttons in the exercise entry screen:

- **Default**: 2.5 kg (when using kg) or 5 lbs (when using lbs)
- **Range**: Typically 0.5 to 50+ in 0.5 unit steps
- **Unit-specific**: The increment is stored and displayed in the user's current weight unit

When switching between kg and lbs, the increment value is **preserved** (not converted), so users may want to adjust it when changing units.

### API

```typescript
import { useUnits } from "@/contexts/UnitContext";
import { formatWeight, kgToLbs, lbsToKg } from "@/utils/units";

// Get user's preferred units
const { weightUnit, distanceUnit, setWeightUnit, setDistanceUnit } = useUnits();

// Convert between units
const kg = lbsToKg(135);      // 61.23 kg
const lbs = kgToLbs(100);     // 220.5 lbs

// Format for display
const display = formatWeight(100, "lbs");  // "220.5 lbs"
```

### Display Rounding

- **kg**: Displayed with 1 decimal place (e.g., "100.0 kg")
- **lbs**: Rounded to nearest 0.5 (standard gym plate increment)
- **km**: Displayed with 2 decimal places
- **miles**: Displayed with 2 decimal places

## Features

✅ **Simple Schema** - 4 tables with clear relationships
✅ **Schema Versioning** - Migration system for future changes
✅ **Immediate Persistence** - All changes saved to SQLite immediately
✅ **File-Level Backups** - Atomic copy operations for reliability
✅ **CSV Export** - Export workout data to Excel-compatible format
✅ **Unit Flexibility** - Support for kg/lbs and km/miles
✅ **Customizable Increments** - Adjustable weight step size
✅ **No ORM** - Direct SQL with type safety via TypeScript
✅ **Date Grouping** - Exercises grouped by YYYY-MM-DD date
✅ **Reactive Loading** - Data reloads when screen comes into focus
✅ **Error Handling** - Try/catch blocks with user feedback
