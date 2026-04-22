# @mirai-app/native - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

> **Native-Specific Overrides**:
> - Uses Expo SDK 54
> - React Native 0.81.5
> - Uses `expo-router` for navigation
> - Tailwind CSS via NativeWind

## Purpose

Expo React Native application for iOS and Android. The primary mobile interface for the MIRAI event management platform.

## Tech Stack

- **Framework**: Expo ~54.0.33
- **React Native**: 0.81.5
- **Router**: Expo Router ~6.0.23
- **Styling**: Tailwind CSS 3.4 + NativeWind 4.2.1
- **State**: Zustand 5.0.11
- **API**: tRPC + React Query

## Key Files

```
apps/native/
├── app/                  # Expo Router pages
│   ├── (tabs)/           # Tab navigation
│   ├── _layout.tsx       # Root layout
│   └── index.tsx         # Entry point
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── stores/           # Zustand stores
│   └── utils/            # Utilities
├── scripts/              # Build scripts
├── fastlane/             # iOS/Android releases
├── package.json
└── AGENTS.md             # This file
```

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

- `@mirai-app/auth` - Authentication
- `@mirai-app/shared` - Shared utilities
- `@mirai-app/supabase` - Supabase client
- `@mirai-app/trpc` - tRPC client

### Key External

- `expo` - Expo SDK
- `expo-router` - File-based routing
- `nativewind` - Tailwind for RN
- `@react-navigation/native` - Navigation
- `zustand` - State management
- `@tanstack/react-query` - Data fetching

## Overrides to Root Conventions

1. **Uses Expo CLI** instead of standard `dev` script
2. **Platform-specific scripts**: `ios`, `android`, `web`
3. **Uses Fastlane** for release management
4. **Patches node modules** via `postinstall` script

## Links

- [Setup guide](../../docs/apps/native/setup.md)
- [Navigation](../../docs/apps/native/navigation.md)
- [Deployment](../../docs/apps/native/deployment.md)
- [OTA Updates](../../docs/apps/native/ota-updates.md)
- [State Management](../../docs/apps/native/state-management.md)
- [Root AGENTS.md](../../AGENTS.md)
