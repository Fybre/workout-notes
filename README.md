# Workout Notes

A mobile workout tracking app built with React Native and Expo. Track your exercises, view your progress with charts, and monitor personal bests - all stored locally on your device.

![App Icon](./assets/images/icon.png)

## Features

### Core Tracking
- 📊 **Exercise Tracking** - Log sets with weight, reps, distance, time, or any combination
- 📝 **Set Notes** - Add notes to individual sets (e.g., "felt easy", "grip slipping")
- 🏆 **Personal Bests** - Automatic PB detection with celebration animations
- 📈 **Estimated 1RM** - Calculate your estimated one-rep max using the Epley formula
- ⏱️ **Rest Timer** - Configurable rest timer with auto-start option between sets
- 🎤 **Voice Logging** - Log sets hands-free with voice commands (development builds only)

### Views & Navigation
- 📅 **Calendar View** - Visual calendar showing workout days
- 📝 **Agenda View** - Chronological list of all workouts with rest day indicators
- 📈 **Progress Charts** - Line charts showing exercise progress over time
- 🗓️ **Date Navigation** - Swipe between days or tap to jump to today
- 📋 **Table View** - Clean tabular display of sets on home screen

### Data & Settings
- 🔄 **Unit Support** - Switch between kg/lbs and km/miles with configurable increments
- 💾 **Data Backup** - Export/restore your data via SQLite backup
- 📤 **CSV Export** - Export all workout data to CSV for analysis
- 🌙 **Dark Mode** - Automatic system theme detection with manual override
- 📱 **Offline First** - All data stored locally in SQLite database

## Tech Stack

- **Framework**: [Expo](https://expo.dev) SDK 54 with React Native
- **Navigation**: Expo Router (file-based routing)
- **Database**: SQLite via `expo-sqlite`
- **State Management**: React Context + Hooks
- **Charts**: `react-native-chart-kit`
- **Calendar**: `react-native-calendars`
- **Icons**: FontAwesome via `@expo/vector-icons`

## Prerequisites

- **Node.js**: 18.x or newer (recommended: 20.x)
- **npm**: 9.x or newer
- **iOS Development**: macOS with Xcode 15+ (for iOS builds)
- **Android Development**: Android Studio with SDK 34+ (for Android builds)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd workout-notes
npm install
```

### 2. Start Development Server

```bash
npx expo start
```

Then press:

- `i` - Run on iOS simulator
- `a` - Run on Android emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
workout-notes/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab-based navigation
│   │   ├── index.tsx        # Home screen (daily workout view)
│   │   └── _layout.tsx      # Tab bar layout
│   ├── calendar.tsx         # Calendar/Agenda/Charts screen
│   ├── enter-exercise.tsx   # Add/edit exercise screen
│   ├── select-exercise.tsx  # Exercise picker
│   ├── settings-modal.tsx   # Settings screen
│   ├── about.tsx            # About/attribution screen
│   └── _layout.tsx          # Root layout with providers
├── components/              # React components
│   ├── calendar/            # Calendar-related components
│   ├── Celebration.tsx      # PB celebration animation
│   ├── EditSetModal.tsx     # Modal for editing sets
│   ├── RestTimerModal.tsx   # Rest timer between sets
│   ├── NumberInput.tsx      # Reusable number input
│   ├── ScreenHeader.tsx     # Header component
│   └── Themed.tsx           # Theme-aware components
├── contexts/                # React Context providers
│   ├── DatabaseContext.tsx  # Database initialization
│   ├── ThemeContext.tsx     # Theme preferences
│   └── UnitContext.tsx      # Unit preferences (kg/lbs)
├── db/                      # Database layer
│   ├── database.ts          # Main database operations
│   ├── backup.ts            # SQLite backup/restore
│   ├── export.ts            # CSV export functionality
│   └── schema.ts            # Schema migrations
├── hooks/                   # Custom React hooks
│   ├── useCalendarData.ts   # Calendar data management
│   └── useDateNavigation.ts # Date navigation logic
├── types/                   # TypeScript types
├── utils/                   # Utility functions
│   ├── date.ts              # Date utilities
│   ├── format.ts            # Display formatting
│   ├── id.ts                # ID generation
│   ├── pb-utils.ts          # Personal best calculations
│   └── units.ts             # Unit conversions (kg/lbs, km/mi)
└── assets/                  # Images, fonts, etc.
```

## Building for Production

### Local Builds

#### iOS

```bash
# Prebuild native iOS project
npx expo prebuild --platform ios

# Build locally
npx expo run:ios --configuration Release

# Or open in Xcode for manual signing/archive
open ios/WorkoutNotes.xcworkspace
```

#### Android

```bash
# Prebuild native Android project
npx expo prebuild --platform android

# Build locally
npx expo run:android --variant release

# Or open in Android Studio
open android/
```

### Building with EAS (Expo Application Services)

EAS provides cloud builds with proper signing certificates and no local tooling required.

#### Setup

1. **Install EAS CLI**

   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**

   ```bash
   eas login
   ```

3. **Create EAS Project** (one-time setup)

   ```bash
   # Create project on EAS (generates projectId in app.json)
   eas project:create

   # Or if project already exists, link to it
   eas project:init
   ```

   This adds the `extra.eas.projectId` field to `app.json`.

#### Build Commands

```bash
# Build for iOS (internal distribution)
eas build --platform ios --profile preview

# Build for Android (APK)
eas build --platform android --profile preview

# Build for app stores
# iOS: Creates .ipa for App Store
# Android: Creates .aab for Play Store
eas build --platform ios --profile production
eas build --platform android --profile production
```

#### EAS Build Profiles

The `eas.json` file includes these pre-configured profiles:

| Profile              | Purpose                  | iOS       | Android |
| -------------------- | ------------------------ | --------- | ------- |
| `development`        | Local dev with debugging | Simulator | APK     |
| `development:device` | Local dev on real device | Device    | APK     |
| `preview`            | Internal testing         | Device    | APK     |
| `preview:simulator`  | Quick testing            | Simulator | APK     |
| `production`         | App Store submission     | Device    | AAB     |

#### Development Builds

For the `development` profile (with debugging capabilities), you need `expo-dev-client`:

```bash
npm install expo-dev-client
```

Then build:

```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

#### iOS Signing with EAS

For App Store distribution, you need an Apple Developer account ($99/year):

```bash
# Generate credentials (automatic)
eas build --platform ios --profile production

# Or manage credentials manually
eas credentials:manager
```

#### Android Signing with EAS

EAS automatically generates a keystore for Android builds on first run. To use an existing keystore:

```bash
eas build --platform android --keystore-path ./path/to/keystore.jks
```

Or manage via:

```bash
eas credentials:manager
```

#### App Store Submission

Configure your App Store Connect App ID in `eas.json`:

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "1234567890"
    }
  }
}
```

Then submit:

```bash
eas submit --platform ios --profile production
```

### Environment Variables

Create `.env` files for different environments:

```bash
# .env.local
EXPO_PUBLIC_API_URL=http://localhost:3000

# .env.production
EXPO_PUBLIC_API_URL=https://api.example.com
```

## Database Schema

The app uses SQLite with the following main tables:

- **exercise_definitions** - Exercise templates (name, type, category, description)
- **exercises** - Logged exercises (date, reference to definition)
- **sets** - Individual sets (weight, reps, time, distance, note, timestamp)
- **schema_version** - Migration tracking

### Exercise Types

The app supports multiple exercise types:
- `weight_reps` - Standard weightlifting (e.g., Bench Press: 100kg x 10)
- `weight_only` - Weight-based without reps (e.g., Farmer's Walk: 50kg)
- `reps_only` - Bodyweight exercises (e.g., Pull-ups: 12 reps)
- `distance_time` - Cardio with distance and time (e.g., Running: 5km in 25:00)
- `distance_only` - Distance-based (e.g., Swimming: 1km)
- `time_only` - Time-based (e.g., Plank: 60s)

## Voice Logging

Voice logging is available in development builds (not Expo Go) and supports these patterns:

- "220 by 10" → 220kg/lbs × 10 reps
- "100 for 8" → 100kg/lbs × 8 reps
- "50 times 12" → 50kg/lbs × 12 reps
- "80 x 5" → 80kg/lbs × 5 reps
- "100 by 10 with note felt easy" → Adds note to the set

The voice input shows a preview before confirming, allowing you to edit values if needed.

## Testing

```bash
# Run TypeScript checks
npx tsc --noEmit

# Run tests (when added)
npm test
```

## Troubleshooting

### Common Issues

**Metro bundler cache issues:**

```bash
npx expo start --clear
```

**iOS build fails:**

```bash
cd ios && pod install && cd ..
npx expo run:ios
```

**Android build fails:**

```bash
cd android && ./gradlew clean && cd ..
npx expo run:android
```

**Database migration errors:**

- Check `db/schema.ts` for version conflicts
- Clear app data on device/simulator

### Package Version Notes

Due to Expo SDK 54 compatibility, these package versions are fixed:

- `@react-native-picker/picker`: 2.11.1
- `react-native-gesture-handler`: 2.28.0
- `react-native-svg`: 15.12.1

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) - Feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Icons by [FontAwesome](https://fontawesome.com/)
- Charting by [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
- Calendar by [react-native-calendars](https://github.com/wix/react-native-calendars)
