# Native App Setup

## Overview

This guide covers setting up the Expo React Native app for development.

## Prerequisites

### Required

- Bun 1.3.6+
- Node.js 20+
- Expo CLI (via `bunx expo`)

### iOS Development (macOS only)

- Xcode 15+
- iOS Simulator
- CocoaPods (`sudo gem install cocoapods`)

### Android Development

- Android Studio
- Android SDK
- Android Emulator

## Installation

### 1. Install Dependencies

```bash
cd apps/native
bun install
```

### 2. Configure Environment

Create environment file:

```bash
# From project root
cp environment/.env.dev.example environment/.env.dev
```

Required variables:
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. iOS Setup (macOS)

```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..
```

### 4. Android Setup

```bash
# Android SDK should be configured via Android Studio
# Set ANDROID_HOME if not already set
export ANDROID_HOME=$HOME/Library/Android/sdk
```

## Running the App

### Development Mode

```bash
# Start Metro bundler
bun run dev

# In another terminal, run on device:
bun run ios      # iOS simulator
bun run android  # Android emulator
```

### Using Expo Go

1. Install Expo Go app on your device
2. Start dev server: `bun run dev`
3. Scan QR code with camera (iOS) or Expo Go (Android)

### Troubleshooting

#### Metro bundler issues

```bash
# Clear cache
rm -rf node_modules .expo
bun install
```

#### iOS build fails

```bash
# Clean build
cd ios && rm -rf build Pods Podfile.lock && pod install && cd ..
```

#### Android build fails

```bash
# Clean build
cd android && ./gradlew clean && cd ..
```

## Development Workflow

### File Structure

```
app/
├── _layout.tsx          # Root layout with providers
├── (tabs)/              # Tab navigation group
│   ├── _layout.tsx      # Tab layout
│   ├── index.tsx        # Home screen
│   └── profile.tsx      # Profile screen
├── auth/                # Auth screens
│   ├── sign-in.tsx
│   └── sign-up.tsx
└── [id].tsx             # Dynamic route
```

### Adding a Screen

1. Create file in `app/` directory
2. Export default component
3. File path = route path

```typescript
// app/settings.tsx
import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View>
      <Text>Settings</Text>
    </View>
  );
}
```

Access at `/settings`

## EAS Build

### Setup

```bash
# Install EAS CLI
bun add -g eas-cli

# Login
eas login

# Configure project
eas build:configure
```

### Build Commands

```bash
# Development build
eas build --profile development

# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

## Further Reading

- [Expo Documentation](https://docs.expo.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind](https://www.nativewind.dev/)
