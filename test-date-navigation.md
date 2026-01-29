# Date Navigation Test Plan

## Overview

The date handling has been completely refactored into a centralized system. All date operations now go through `utils/date.ts` and `hooks/useDateNavigation.ts`.

## Architecture

### Centralized Date Utilities (`utils/date.ts`)

```typescript
// Primary conversion functions
toDateString(date) -> "YYYY-MM-DD"          // Date -> ISO string
fromDateString(str) -> Date                 // ISO string -> Date

// Date retrieval
getToday() -> "YYYY-MM-DD"                  // Today's date string

// Date manipulation
addDays(dateStr, n) -> "YYYY-MM-DD"         // Add/subtract days

// Date comparison
isToday(dateStr) -> boolean
isSameDate(d1, d2) -> boolean

// Formatting
formatDisplayDate(dateStr) -> "Wed, Jan 28, 2026"
formatMonthYear(dateStr) -> "January 2026"

// Calendar utilities
getCalendarDateRange(monthStr, buffer) -> { start, end }

// URL param parsing
parseDateParam(param) -> "YYYY-MM-DD"       // Safe param parsing
```

### Navigation Hook (`hooks/useDateNavigation.ts`)

```typescript
const {
  date,           // Current date string (YYYY-MM-DD)
  goToPrevDay,    // Navigate to previous day
  goToNextDay,    // Navigate to next day
  goToDate,       // Navigate to specific date
  goToToday,      // Navigate to today
  isToday,        // Check if current date is today
} = useDateNavigation();

// Read-only date access
const date = useCurrentDate();
```

## Test Cases

### 1. Tab Navigation (Prev/Next Day Buttons)

- **Test**: Navigate from current date (27th) to previous day (26th)
- **Expected**: Date should change to 26th, exercises should load for 26th
- **Test**: Navigate from 26th to previous day (25th)
- **Expected**: Date should change to 25th, exercises should load for 25th
- **Test**: Navigate forward from 25th to 26th
- **Expected**: Date should change to 26th, exercises should load for 26th

### 2. Calendar Navigation

- **Test**: Open calendar from any date
- **Expected**: Calendar should show correct month and highlight today
- **Test**: Select a different date in calendar
- **Expected**: Should navigate back to home screen with selected date
- **Test**: Verify exercises load for the selected date

### 3. Date Consistency

- **Test**: Navigate to a date using tab buttons
- **Test**: Open calendar and verify the correct date is highlighted
- **Expected**: Calendar should show the same date as currently selected

### 4. Edge Cases

- **Test**: Navigate to dates with no exercises
- **Expected**: Should show "No exercises on this day" message
- **Test**: Navigate to today's date
- **Expected**: Should show "No exercises yet today" message
- **Test**: Rapid date navigation (quick taps)
- **Expected**: Should handle gracefully without errors

## Files Modified

1. **`utils/date.ts`** (NEW) - Centralized date utilities
2. **`hooks/useDateNavigation.ts`** (NEW) - Date navigation hook
3. **`app/(tabs)/_layout.tsx`** - Refactored to use `useDateNavigation`
4. **`app/(tabs)/index.tsx`** - Refactored to use `useCurrentDate` and `useDateNavigation`
5. **`app/calendar.tsx`** - Refactored to use `utils/date`
6. **`app/select-exercise.tsx`** - Refactored to use `parseDateParam`
7. **`app/enter-exercise.tsx`** - Refactored to use `parseDateParam` and `getToday`

## Benefits of New Architecture

1. **Single Source of Truth**: All date logic in one place
2. **Type Safety**: Consistent date string typing (YYYY-MM-DD)
3. **No Code Duplication**: Eliminated ~20 duplicate date conversion blocks
4. **Timezone Safety**: All conversions respect local timezone
5. **Testability**: Date utilities can be unit tested independently
6. **Maintainability**: Changes only needed in one place
