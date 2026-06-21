# @mirai-app/native

PJATK Student Government mobile application built with Expo and React Native.

## Technologies

- **Expo SDK 54** with new architecture
- **React 19** & **React Native 0.83.6**
- **Expo Router 6** - file-based routing
- **oRPC + Supabase** - backend and authentication
- **TypeScript** - static typing
- **Jest** & **React Native Testing Library** - testing

## Requirements

- Bun (https://bun.sh) installed
- iOS Simulator (macOS) or Android Studio (for Android emulator)
- Expo Go on physical device (optional)

## Installation

From project root:

```bash
bun install
```

## Available Commands

| Command                                  | Description                         |
| ---------------------------------------- | ----------------------------------- |
| `cd apps/native && bun run dev`          | Starts Expo development server      |
| `cd apps/native && bun run android`      | Runs app on Android emulator/device |
| `cd apps/native && bun run ios`          | Runs app on iOS simulator/device    |
| `cd apps/native && bun run web`          | Runs app in browser                 |
| `cd apps/native && bun run build`        | Builds app for production           |
| `cd apps/native && bun run lint`         | Checks code for ESLint errors       |
| `cd apps/native && bun run lint:fix`     | Automatically fixes ESLint errors   |
| `cd apps/native && bun run typecheck`    | Checks TypeScript types             |
| `cd apps/native && bun run test`         | Runs tests with coverage            |
| `cd apps/native && bun run format:check` | Checks code formatting              |
| `cd apps/native && bun run format:write` | Formats code                        |

## Project Structure

```
apps/native/
├── src/
│   ├── app/              # Expo Router routing
│   ├── components/       # React components
│   │   ├── ui/          # Shared UI components
│   │   └── ...          # Domain-specific components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Services and APIs
│   └── utils/           # Utility functions
├── assets/              # Images, icons, fonts
├── app.json             # Expo configuration
└── package.json
```

### Shared UI Components

All major UI components are located in `src/components/ui/`:

- **Buttons**: `PrimaryLoadingButton`, `PrimaryAddButton`
- **Actions**: `FloatingActionButton`
- **Modals**: `MapModalShell`, `MapModalUserItem`
- **Forms**: Consistent components for forms and input fields
- **Skeleton**: Loading placeholders (`box`/`text`/`circle`/`line` variants) with convenience exports `Skeleton.Line`, `Skeleton.Group`

### Domain Structure

Each domain (trips, groups, challenges, rewards) has its own structure in `src/components/`:

- Domain-specific components
- Domain-related hooks
- Types and interfaces

## Running from Monorepo

From project root:

```bash
# Start development server
cd apps/native && bun run dev

# Run on platform
cd apps/native && bun run android
cd apps/native && bun run ios
```

## Development

1. Start development server: `bun run dev`
2. Scan QR code in Expo Go app or choose platform (a/i/w)
3. Code reloads automatically on save

## Supabase Storage (MinIO)

Storage works through Kong at `http://localhost:8000/storage/v1` and uses MinIO as S3 backend.

1. Run Supabase environment (docker compose in `environment` directory).
2. Go to Supabase Studio (`http://localhost:3000`) and create bucket.
3. Configure RLS policies for `storage.objects` as needed by the app.

The app uses the same `EXPO_PUBLIC_SUPABASE_URL` as for Auth and Realtime.

## Routing

The app uses [Expo Router](https://docs.expo.dev/router/introduction/) - file-based routing. Files in `src/app/` automatically become screens.

### Navigation Structure

```
src/app/
├── _layout.tsx           # Main layout with Stack Navigation config
├── index.tsx             # Home screen (after login)
├── auth/
│   ├── login.tsx        # Login screen
│   └── signup.tsx       # Signup screen
├── users/
│   └── index.tsx        # User list (admin)
├── groups/
│   └── index.tsx        # Guild list (admin)
├── coins/
│   └── index.tsx        # Coin operations (admin)
├── transactions/
│   └── index.tsx        # Transaction history (admin)
└── notifications/
    └── index.tsx         # Notification management (admin)
```

### Screen Navigation

Expo Router provides `useRouter()` function for programmatic navigation:

```tsx
import { useRouter } from "expo-router";

function MyComponent() {
  const router = useRouter();

  // Navigate to screen
  router.push("/users");

  // Replace current screen (e.g., after login)
  router.replace("/");

  // Go back
  router.back();
}
```

### Screen Configuration

In `_layout.tsx` each screen is configured with its own options:

- **Auth screens** (`/auth/login`, `/auth/signup`) - no header, fade animation
- **Admin screens** (`/users`, `/groups`, etc.) - with header and title
- **Home screen** (`/`) - no header

### Access Control

Each admin screen checks user permissions and automatically redirects to home screen if user doesn't have access (not Admin, Moderator, or Service Account).

## Testing

```bash
# Run all tests
cd apps/native && bun run test

# Tests without coverage (for CI)
cd apps/native && bun run test:ci
```

For detailed testing documentation, troubleshooting, and configuration details, see [TESTING.md](../../TESTING.md).

## More Information

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Project Main README](../../README.md)
- [Android Fastlane release runbook](./docs/android-fastlane-release-runbook.md)
- [Android Fastlane rollback procedure](./docs/android-fastlane-rollback.md)
