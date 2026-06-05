# @mirai-app/native - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

> **Native-Specific Overrides**:
> - Uses Expo SDK 54
> - React Native 0.83.6
> - Uses `expo-router` for navigation
> - Tailwind CSS via NativeWind

## Purpose

Expo React Native application for iOS and Android. The primary mobile interface for the MIRAI event management platform.

## Tech Stack

- **Framework**: Expo ~54.0.33
- **React Native**: 0.83.6
- **Router**: Expo Router ~6.0.23
- **Styling**: Tailwind CSS 3.4 + NativeWind 4.2.1
- **State**: Zustand 5.0.11
- **API**: oRPC + React Query

## Development Commands

```bash
# Start dev server
bun run dev
# or
bunx expo start

# Platform-specific
bun run android    # Android emulator
bun run ios        # iOS simulator
bun run web        # Web (expo-web)

# Code quality
bun run lint       # ESLint
bun run typecheck  # TypeScript
bun run format:check
bun run format:write

# Testing
bun run test       # Run tests with coverage
bun run test:ci    # CI mode (pass with no tests)
bun run test:watch # Watch mode

# Build
bun run build      # Export for production
```

## Release Commands

Uses Fastlane for automated releases:

```bash
# Android
bun run release:android:build
bun run release:android:submit

# iOS
bun run release:ios:build
bun run release:ios:submit
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL |

## Dependencies

### Internal

`@mirai-app/auth` · `@mirai-app/shared` · `@mirai-app/supabase` · `@mirai-app/orpc`

### Key External

`expo` · `expo-router` · `nativewind` · `@react-navigation/native` · `zustand` · `@tanstack/react-query`

## Overrides to Root Conventions

1. **Uses Expo CLI** instead of standard `dev` script
2. **Platform-specific scripts**: `ios`, `android`, `web`
3. **Uses Fastlane** for release management
4. **Patches node modules** via `postinstall` script

## Native-Specific Code Quality Rules

See [Native Code Quality](./../../docs/apps/native/code-quality.md) and [Testing Conventions](./../../docs/conventions/testing.md) for detailed standards. Key rules:

- **Bundle Budget**: Every KB matters for OTA. Verify dependencies >5KB replace existing ones.
- **Hook Test Anti-Patterns**: Stop mock-verification hook tests. Extract pure domain logic to `@mirai-app/shared`.
- **Pure Function Extraction**: Name with `calculateXxx`, `syncXxx`, `executeXxx`, `buildXxx`, `toXxxOrNull`.
- **Mock Removal for UI**: Render real components. Query by descriptive `testID` props.
- **MSW Patterns**: Use Mock Service Worker for API mocking in component tests. Avoid mocking React Query internals.

## Background Location Patterns

### GPS-Aware Delta Filtering

When filtering location updates to reduce noise while preserving precision:

- **Formula**: `threshold = max(accuracy * 2, 15 meters)` — adaptive to GPS quality
- **First update always sends**: When `lastSentLocation` is null, send immediately (e.g., after restart)
- **Use Haversine formula** for distance calculation (Earth radius `6371e3`)

### Hybrid Persistence for Sensitive Data

For data that must survive app restarts but needs instant access:

- **In-memory state**: `lastSentLocation` in `BackgroundTaskState` for zero-I/O filtering
- **SecureStore backup**: `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` for restart resilience
- **Fire-and-forget writes**: `void deps.setLastSentLocation()` — never block the background task
- **Read fallback**: If SecureStore read fails, return `null` → sends one unfiltered update, then resumes filtering
- **Why SecureStore over AsyncStorage**: GPS coordinates are sensitive data. AsyncStorage is unencrypted, included in backups, and has no TTL.

### Background Task Architecture

- **State**: `isSending` flag prevents concurrent sends; `lastSentLocation` enables filtering
- **Deps injection**: `getLastSentLocation`, `setLastSentLocation` passed as dependencies for testability
- **Error handling**: All errors caught and silently ignored — background task must never crash
- **Hot reload safety**: Catch "has already been defined" errors from `TaskManager.defineTask`

## Links

[Setup](../../docs/apps/native/setup.md) · [Navigation](../../docs/apps/native/navigation.md) · [Deployment](../../docs/apps/native/deployment.md) · [OTA Updates](../../docs/apps/native/ota-updates.md) · [State Management](../../docs/apps/native/state-management.md) · [Root AGENTS.md](../../AGENTS.md)
