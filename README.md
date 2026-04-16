[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](README_PL.md)<br>
[![AGPLv3](https://img.shields.io/badge/License-AGPLv3-blue)](LICENSE)
<img width="1440" height="565" alt="mirai_app_banner" src="https://github.com/user-attachments/assets/88e9e651-ec6d-458f-b650-4a351b1bb534" />

<div align="center">
<h1>MIRAI</h1>
<b>PJATK Student Government Mobile Application</b>
<p>also known as: Project <code>PJApp</code></p>
<p>A trip application for integration trips.<br>Expanding soon into a general Student Government application for all students.</p>
</div>

<br>

## Want to join?

Read the [collaboration guidelines](CONTRIBUTING.md).

> [!IMPORTANT]
> **Call for Mainteiners**
>
> We are looking for maintainers to take over the project.
> If you are interested, please contact the PJAIT's Student Council.

## Project Structure

This monorepo uses **Turborepo** for builds and **Bun workspaces** for package management.

See [`turbo.json`](turbo.json) and [`bun.lock`](bun.lock) for configuration details.

It contains:

- **Native application** (Expo / React Native) → [`@mirai-app/native`](apps/native/)
- **Backend server** (Hono + GraphQL) → [`@mirai-app/backend-server`](apps/backend-server/)
- **Notification sender** (Expo Push Notifications) → [`@mirai-app/notification-sender`](apps/notification-sender/)
- **Seed CLI** (Database & Storage seeding) → [`@mirai-app/seed`](apps/seed/)
- **Shared packages** → [`packages`](packages/)
  - [`@mirai-app/domain`](packages/domain/) - **Domain layer** - Entities, value objects, business rules
  - [`@mirai-app/use-cases`](packages/use-cases/) - **Use case layer** - Orchestration and workflows
  - [`@mirai-app/adapters`](packages/adapters/) - **Adapter layer** - Controllers and gateways
  - [`@mirai-app/frameworks`](packages/frameworks/) - **Framework layer** - DI, GraphQL, Drizzle config
  - [`@mirai-app/auth`](packages/auth/) - Authentication logic
  - [`@mirai-app/db`](packages/db/) - Prisma database client
  - [`@mirai-app/supabase`](packages/supabase/) - Supabase client configuration
  - [`@mirai-app/ui`](packages/ui/) - **UI Component Library (Tamagui)**

Run scripts from the project root with `bun run <script>`, or from a specific package with `cd <package> && bun run <script>`:

```bash
cd apps/native && bun run dev
```

---

## UI Component Library

This project uses **Tamagui** for its unified cross-platform UI component system. The `@mirai-app/ui` package provides components that work identically on both web and native platforms.

### Quick Start with UI Components

```tsx
// Import components
import { Button, Card, Input, Text, H1 } from "@mirai-app/ui";

// Use in your component
function MyScreen() {
  return (
    <Card>
      <H1>Welcome</H1>
      <Text color="$colorMuted">Sign in to continue</Text>
      <Input label="Email" placeholder="Enter your email" />
      <Button variant="primary" onPress={handleSignIn}>
        Sign In
      </Button>
    </Card>
  );
}
```

### Provider Setup

Wrap your app with `TamaguiProvider` at the root:

**Native (apps/native):**

```tsx
// app/_layout.tsx
import { TamaguiProvider } from "@mirai-app/ui";
import { config } from "@mirai-app/ui";

export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Stack />
    </TamaguiProvider>
  );
}
```

### Available Components

| Component | Description         | Variants                                    |
| --------- | ------------------- | ------------------------------------------- |
| `Button`  | Action buttons      | `primary`, `secondary`, `ghost`, `danger`   |
| `Card`    | Container component | `size`, `elevation`, `bordered`             |
| `Input`   | Form inputs         | `size`, `variant`, with label/error support |
| `Select`  | Dropdown selection  | Cross-platform dropdown                     |
| `Sheet`   | Modal/overlay       | Cross-platform modal replacement            |
| `Spinner` | Loading indicator   | `size`, `color`                             |
| `Text`    | Typography          | `H1`-`H6`, `Body`, `Caption`, `LabelText`   |

### Styling with Design Tokens

Use theme tokens for consistent styling:

```tsx
// Spacing: $1 (4px), $2 (8px), $3 (12px), $4 (16px), $5 (20px), etc.
<Card p="$4" m="$2">

// Colors: theme-aware, work in light/dark mode
<Text color="$primary">Primary color</Text>
<Text color="$colorMuted">Secondary text</Text>
<Card bg="$surface">Surface background</Card>

// Border radius
<Card br="$4">Rounded corners (16px)</Card>

// Shorthands: px (paddingX), py (paddingY), bg (backgroundColor), etc.
<View px="$4" py="$2" bg="$background">
```

### Documentation

- [UI Package README](packages/ui/README.md) - Complete component documentation
- [Migration Guide](packages/ui/docs/MIGRATION.md) - Migrating from legacy UI
- [Storybook](packages/ui/storybook-static) - Interactive component browser
- [Tamagui Docs](https://tamagui.dev/docs/intro) - Framework documentation

### Storybook

Browse and test components interactively:

```bash
# Start Storybook dev server
cd packages/ui && bun run storybook

# Build static Storybook
cd packages/ui && bun run storybook:build
```

---

## Technical Requirements

Install:

- **Node.js** 18+
- **Bun** (https://bun.sh)
- **Docker** (for Supabase and the development environment)

## How to start?

### 1. Clone the repository

```bash
git clone <repository-url>
cd integral-app
```

### 2. Install dependencies

```bash
bun install

# Build the UI package (required for first setup)
cd packages/ui && bun run build
```

### 3. Start the development environment

Read the [development environment documentation](environment/dev/README.md).

### 4. Prepare the database schema

```bash
# Generate Prisma client
cd packages/seed && bun run db:generate

# Push the schema to the database
cd packages/seed && bun run db:push

# Optional: Open Prisma Studio to view the database
cd packages/seed && bun run db:studio
```

> 📖 **More information about database commands**: See [packages/seed/README.md](packages/seed/README.md)

### 5. Start the application

Before starting, read the [native application](apps/native/README.md) and [backend](apps/backend-server/README.md) documentation.

#### `bun run dev`

Runs all applications simultaneously:

- Backend server at `http://localhost:2022`
- Native app (Expo dev server)
- Notification sender service

#### `bun run dev:backend`

Runs only the backend server (Hono + GraphQL) at port 2022.

#### `bun run dev:native`

Runs only the native application (Expo dev server).

#### `bun run dev:notification-sender`

Runs only the notification sender service for push notifications.

## Testing

### Quick Start

Run all tests:

```bash
bun test
```

Run only unit tests (fast, isolated):

```bash
bun run test:unit
```

Run only integration tests (slower, requires external services):

```bash
bun run test:integration
```

### Test Organization

Tag conventions:

- `[UNIT]` - Pure business logic (fast)
- `[INTEGRATION]` - Tests with external services (database, APIs)

### Running Tests by Package

```bash
# Domain layer (pure unit tests)
cd packages/domain && bun test

# Use cases (pure unit tests)
cd packages/use-cases && bun test

# Adapters (mixed - can run separately)
cd packages/adapters && bun run test:unit
cd packages/adapters && bun run test:integration

# UI components
cd packages/ui && bun test
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

---

## Component Development

### Adding New Components

1. **Create the component** in `packages/ui/src/components/ComponentName.tsx`
2. **Add stories** in `packages/ui/src/components/ComponentName.stories.tsx`
3. **Export from barrel** in `packages/ui/src/components/index.ts`
4. **Write tests** in `packages/ui/test/components/ComponentName.test.tsx`
5. **Build and verify**:
   ```bash
   cd packages/ui
   bun run typecheck
   bun test
   bun run storybook
   ```

### Component Guidelines

- Use Tamagui's `styled()` API for component variants
- Always support both light and dark themes
- Include accessibility attributes (accessibilityRole, accessibilityLabel)
- Support all standard Tamagui props (padding, margin, etc.)
- Add JSDoc comments for props and usage examples

Example:

```tsx
import { styled, View, Text } from "@mirai-app/ui";

/**
 * Custom card component with status variants
 */
export const StatusCard = styled(Card, {
  name: "StatusCard",

  variants: {
    status: {
      active: { borderColor: "$success" },
      pending: { borderColor: "$warning" },
      error: { borderColor: "$danger" },
    },
  },

  defaultVariants: {
    status: "active",
  },
});
```

See [packages/ui/README.md](packages/ui/README.md) for complete component API documentation.
