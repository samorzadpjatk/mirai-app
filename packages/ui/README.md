# @mirai-app/ui

Shared Tamagui UI component library for web and native applications.

## Overview

This package provides a **unified cross-platform component library** built on [Tamagui](https://tamagui.dev/), enabling consistent UI across web (React) and native (React Native) platforms.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Available Components](#available-components)
- [Theme System](#theme-system)
- [Customization](#customization)
- [Storybook](#storybook)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

```bash
# From the monorepo root
bun install

# Build the package
cd packages/ui
bun run build
```

### Basic Usage

```tsx
// Import components
import { Button, Card, Input, Text } from "@mirai-app/ui";

// Use in your app
function MyComponent() {
  return (
    <Card>
      <Text>Hello World</Text>
      <Button onPress={handlePress}>Click me</Button>
    </Card>
  );
}
```

### Provider Setup

Wrap your app with `TamaguiProvider`:

```tsx
import { TamaguiProvider } from "@mirai-app/ui";
import { config } from "@mirai-app/ui";

function App() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <YourApp />
    </TamaguiProvider>
  );
}
```

---

## Available Components

### Tier 1: Base Primitives

These are the foundational components that power the entire UI system:

#### Button

Multi-variant button with loading and icon support.

```tsx
import { Button } from '@mirai-app/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading state
<Button isLoading onPress={handlePress}>Loading...</Button>

// With icons
<Button leftIcon={<Icon />}>With Icon</Button>
<Button rightIcon={<Icon />}>With Icon</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

**Props:**

| Prop        | Type                                              | Default     | Description          |
| ----------- | ------------------------------------------------- | ----------- | -------------------- |
| `variant`   | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size`      | `'sm' \| 'md' \| 'lg'`                            | `'md'`      | Button size          |
| `disabled`  | `boolean`                                         | `false`     | Disable interaction  |
| `isLoading` | `boolean`                                         | `false`     | Show loading spinner |
| `fullWidth` | `boolean`                                         | `false`     | Full width button    |
| `leftIcon`  | `ReactNode`                                       | -           | Icon before text     |
| `rightIcon` | `ReactNode`                                       | -           | Icon after text      |
| `onPress`   | `() => void`                                      | -           | Click handler        |

---

#### Card

Container component with theme-aware styling and elevation.

```tsx
import { Card, Text } from '@mirai-app/ui';

// Basic usage
<Card>
  <Text>Card content</Text>
</Card>

// With size variants
<Card size="sm">Small padding</Card>
<Card size="md">Medium padding (default)</Card>
<Card size="lg">Large padding</Card>

// With elevation
<Card elevation="none">No shadow</Card>
<Card elevation="sm">Small shadow (default)</Card>
<Card elevation="md">Medium shadow</Card>
<Card elevation="lg">Large shadow</Card>

// With border
<Card bordered>With border</Card>

// Full width
<Card fullWidth>Full width card</Card>

// Custom styling with Tamagui props
<Card p="$6" br="$2" backgroundColor="$surface">
  Custom styled card
</Card>
```

**Props:**

| Prop        | Type                             | Default | Description  |
| ----------- | -------------------------------- | ------- | ------------ |
| `size`      | `'sm' \| 'md' \| 'lg'`           | `'md'`  | Padding size |
| `elevation` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'sm'`  | Shadow depth |
| `bordered`  | `boolean`                        | `false` | Show border  |
| `fullWidth` | `boolean`                        | `false` | Full width   |

---

#### Input

Form input with integrated label, error, and helper text support.

```tsx
import { Input } from '@mirai-app/ui';

// Basic usage
<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>

// With validation
<Input
  label="Password"
  type="password"
  error={passwordError}
  helperText="Must be at least 8 characters"
/>

// Required field
<Input
  label="Username"
  required
/>

// Disabled state
<Input
  label="Email"
  disabled
  value="user@example.com"
/>

// Size variants
<Input size="sm" label="Small" />
<Input size="md" label="Medium (default)" />
<Input size="lg" label="Large" />

// Visual variants
<Input variant="outline" label="Outline (default)" />
<Input variant="filled" label="Filled" />
<Input variant="underlined" label="Underlined" />
```

**Props:**

| Prop         | Type                                    | Default     | Description              |
| ------------ | --------------------------------------- | ----------- | ------------------------ |
| `label`      | `string`                                | -           | Label text               |
| `error`      | `string`                                | -           | Error message            |
| `helperText` | `string`                                | -           | Helper text              |
| `required`   | `boolean`                               | `false`     | Required field indicator |
| `disabled`   | `boolean`                               | `false`     | Disable input            |
| `size`       | `'sm' \| 'md' \| 'lg'`                  | `'md'`      | Input size               |
| `variant`    | `'outline' \| 'filled' \| 'underlined'` | `'outline'` | Visual style             |

---

#### Text

Typography component with semantic variants.

```tsx
import { Text, H1, H2, H3, Body, Caption, LabelText } from '@mirai-app/ui';

// Heading shortcuts
<H1>Heading 1</H1>
<H2>Heading 2</H2>
<H3>Heading 3</H3>

// Body text
<Body>Body text content</Body>

// Caption/Label
<Caption>Small caption text</Caption>
<LabelText>Label text</LabelText>

// Full control with Text component
<Text fontSize="$xl" fontWeight="$bold" color="$primary">
  Custom styled text
</Text>

// Theme-aware colors
<Text color="$color">Primary text color</Text>
<Text color="$colorMuted">Muted text</Text>
<Text color="$colorTertiary">Tertiary text</Text>
```

**Props:**

| Prop         | Type                            | Default | Description |
| ------------ | ------------------------------- | ------- | ----------- |
| `fontSize`   | `FontSizeTokens`                | -       | Text size   |
| `fontWeight` | `FontWeightTokens`              | -       | Text weight |
| `color`      | `ColorTokens`                   | -       | Text color  |
| `textAlign`  | `'left' \| 'center' \| 'right'` | -       | Alignment   |

---

#### Select

Dropdown/select component for choosing from options.

```tsx
import { Select } from "@mirai-app/ui";

<Select
  label="Choose an option"
  value={selectedValue}
  onValueChange={setSelectedValue}
>
  <Select.Item value="option1" label="Option 1" />
  <Select.Item value="option2" label="Option 2" />
  <Select.Item value="option3" label="Option 3" />
</Select>;
```

---

#### Sheet

Modal/sheet component for overlays and dialogs (cross-platform).

```tsx
import { Sheet } from "@mirai-app/ui";

const [open, setOpen] = useState(false);

<Sheet open={open} onOpenChange={setOpen}>
  <Sheet.Frame>
    <Sheet.Handle />
    <Text>Sheet content here</Text>
  </Sheet.Frame>
</Sheet>;
```

---

#### Spinner

Loading indicator component.

```tsx
import { Spinner } from '@mirai-app/ui';

// Default spinner
<Spinner />

// Size variants
<Spinner size="small" />
<Spinner size="large" />

// Custom color
<Spinner color="$primary" />
```

---

## Theme System

### Overview

The theme system is built on Tamagui's powerful token and theme architecture. It provides:

- **Consistent tokens** across web and native
- **Automatic dark mode** support
- **Type-safe** theme values with IDE autocomplete
- **Runtime CSS variable** injection

### Theme Structure

```
tamagui.config.ts
├── tokens (colors, spacing, sizing, z-index)
├── themes (light, dark, variants)
├── fonts (Space Grotesk, Inter, Mono)
├── animations
└── media queries
```

### Available Themes

| Theme         | Description                         |
| ------------- | ----------------------------------- |
| `light`       | Default light theme                 |
| `dark`        | Dark mode theme                     |
| `light-hc`    | High contrast light (accessibility) |
| `dark-hc`     | High contrast dark (accessibility)  |
| `light-brand` | Brand-emphasis light variant        |
| `dark-brand`  | Brand-emphasis dark variant         |

### Using Themes

```tsx
import { TamaguiProvider, useTheme } from "@mirai-app/ui";

// Set default theme
<TamaguiProvider defaultTheme="dark">
  <App />
</TamaguiProvider>;

// Access current theme
function MyComponent() {
  const theme = useTheme();
  return <Text color={theme.color}>Themed text</Text>;
}

// Theme-aware props
<Button theme="light">Light button in dark mode</Button>;
```

---

## Customization

### Creating Custom Components

Use Tamagui's `styled()` API to create themed components:

```tsx
import { styled, View, Text } from '@mirai-app/ui';

// Create a custom card variant
const TripCard = styled(Card, {
  name: 'TripCard',

  // Base styles
  backgroundColor: '$surface',
  borderWidth: 1,
  borderColor: '$borderColor',

  // Variants
  variants: {
    status: {
      active: {
        borderColor: '$success',
        backgroundColor: '$successOpacity08'
      },
      completed: {
        borderColor: '$gray400',
        backgroundColor: '$gray100'
      },
      cancelled: {
        borderColor: '$danger',
        backgroundColor: '$dangerOpacity12'
      },
    },
  },

  defaultVariants: {
    status: 'active',
  },
});

// Usage
<TripCard status="active">Active Trip</TripCard>
<TripCard status="completed">Completed Trip</TripCard>
```

### Custom Theme Tokens

Add custom tokens to the theme:

```tsx
// In tamagui.config.ts
export const config = createTamagui({
  tokens: {
    color: {
      ...colorTokens,
      brandPrimary: "#00FF00",
      brandSecondary: "#FF00FF",
    },
    space: {
      ...tokens.space,
      $custom: 42,
    },
  },
  // ... rest of config
});
```

### Platform-Specific Styles

For platform-specific needs, use file extensions:

```
MyComponent.tsx      # Shared (default)
MyComponent.web.tsx  # Web-only
MyComponent.native.tsx # Native-only
```

Or use Tamagui's platform helpers:

```tsx
import { Platform } from "react-native";

const styles = {
  ...Platform.select({
    web: { cursor: "pointer" },
    native: { activeOpacity: 0.7 },
  }),
};
```

---

## Storybook

### Development Server

```bash
# Start Storybook dev server on port 6006
bun run storybook
```

### Static Build

```bash
# Build static Storybook to storybook-static/
bun run storybook:build

# Serve the static build locally
bun run storybook:serve
```

### Deployment

#### Static Hosting

Deploy the `storybook-static/` directory to any static hosting:

**Netlify:**

```bash
netlify deploy --dir=storybook-static --prod
```

**Vercel:**

```bash
vercel --cwd storybook-static
```

**GitHub Pages:**

```bash
gh-pages -d storybook-static
```

#### CI/CD Integration

```yaml
# .github/workflows/storybook.yml
name: Deploy Storybook

on:
  push:
    branches: [main]
    paths:
      - "packages/ui/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: cd packages/ui && bun run storybook:build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/ui/storybook-static
```

---

## Testing

### Unit Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Test Environment

Tests use Bun's built-in test runner with Happy DOM:

```tsx
// test/setup.tsx
import { TamaguiProvider } from "@mirai-app/ui";
import { config } from "@mirai-app/ui";

export const TestWrapper = ({ children }) => (
  <TamaguiProvider
    config={config}
    defaultTheme="light"
    disableInjectCSS // Critical for test environment
  >
    {children}
  </TamaguiProvider>
);
```

### Writing Component Tests

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "../test/setup";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>,
    );
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const handlePress = mock();
    render(
      <TestWrapper>
        <Button onPress={handlePress}>Click me</Button>
      </TestWrapper>,
    );
    await userEvent.click(screen.getByText("Click me"));
    expect(handlePress).toHaveBeenCalled();
  });
});
```

---

## API Reference

### Design Tokens

#### Spacing Tokens

| Token | Value | Semantic |
| ----- | ----- | -------- |
| `$0`  | 0     | -        |
| `$1`  | 4px   | `xs`     |
| `$2`  | 8px   | `sm`     |
| `$3`  | 12px  | `md`     |
| `$4`  | 16px  | `lg`     |
| `$5`  | 20px  | `xl`     |
| `$6`  | 24px  | `xxl`    |
| `$8`  | 32px  | `xxxl`   |
| `$10` | 48px  | `huge`   |
| `$12` | 80px  | -        |

#### Border Radius Tokens

| Token   | Value  | Semantic |
| ------- | ------ | -------- |
| `$0`    | 0      | -        |
| `$1`    | 4px    | -        |
| `$2`    | 8px    | `sm`     |
| `$3`    | 12px   | `md`     |
| `$4`    | 16px   | `lg`     |
| `$5`    | 20px   | `xl`     |
| `$full` | 9999px | Circle   |

#### Color Tokens

**Primary Colors:**

| Token            | Value     | Description   |
| ---------------- | --------- | ------------- |
| `$primary`       | `#00ced1` | Brand primary |
| `$accentMagenta` | `#E533FF` | Accent color  |

**Theme-Aware Colors:**

| Token          | Light     | Dark      | Description     |
| -------------- | --------- | --------- | --------------- |
| `$background`  | `#f1f1f4` | `#17181c` | Page background |
| `$surface`     | `#ffffff` | `#1b2828` | Card/surface    |
| `$color`       | `#111827` | `#ffffff` | Primary text    |
| `$colorMuted`  | `#9ca3af` | `#9ca3af` | Secondary text  |
| `$borderColor` | `#e5e7eb` | `#395556` | Borders         |

See [src/theme/colors.ts](./src/theme/colors.ts) for complete color palette.

### Style Shorthands

| Shorthand | Property            |
| --------- | ------------------- |
| `p`       | `padding`           |
| `px`      | `paddingHorizontal` |
| `py`      | `paddingVertical`   |
| `m`       | `margin`            |
| `mx`      | `marginHorizontal`  |
| `my`      | `marginVertical`    |
| `bg`      | `backgroundColor`   |
| `c`       | `color`             |
| `fs`      | `fontSize`          |
| `fw`      | `fontWeight`        |
| `br`      | `borderRadius`      |
| `bc`      | `borderColor`       |
| `bw`      | `borderWidth`       |
| `w`       | `width`             |
| `h`       | `height`            |

---

## Architecture

### Package Structure

```
packages/ui/
├── src/
│   ├── components/          # UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Sheet.tsx
│   │   ├── Spinner.tsx
│   │   ├── Text.tsx
│   │   └── index.ts         # Barrel export
│   ├── theme/               # Theme configuration
│   │   ├── tokens.ts        # Spacing, sizing, z-index
│   │   ├── colors.ts        # Color palette
│   │   ├── fonts.ts         # Font definitions
│   │   ├── themes.ts        # Light/dark themes
│   │   └── animations.ts    # Animation configs
│   ├── hooks/               # React hooks
│   └── utils/               # Utility functions
├── test/                    # Test setup and utilities
│   ├── setup.ts
│   └── TestWrapper.tsx
├── .storybook/              # Storybook configuration
│   ├── main.js
│   ├── preview.tsx
│   └── preview-head.html
├── tamagui.config.ts        # Main configuration
├── tamagui.build.ts         # Build options
└── vite.config.ts           # Build configuration
```

### Build Outputs

The package generates four output formats:

1. **ESM** (`dist/esm/`) - Modern bundlers (Vite, Webpack 5+)
2. **CJS** (`dist/cjs/`) - Node.js and older bundlers
3. **JSX** (`dist/jsx/`) - React Native (Metro bundler)
4. **Types** (`dist/types/`) - TypeScript declarations

### Dual Platform Support

```json
{
  "exports": {
    ".": {
      "react-native": "./dist/jsx/index.jsx",
      "import": "./dist/esm/index.mjs",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue:** Components not rendering with correct theme

**Solution:** Ensure `TamaguiProvider` is at the root of your app:

```tsx
<TamaguiProvider config={config} defaultTheme="light">
  <App />
</TamaguiProvider>
```

**Issue:** CSS not loading in tests

**Solution:** Use `disableInjectCSS` in test environment:

```tsx
<TamaguiProvider disableInjectCSS>{children}</TamaguiProvider>
```

**Issue:** Metro bundler errors in native app

**Solution:** Ensure `@tamagui/metro-plugin` is configured:

```js
// metro.config.js
const { withTamagui } = require("@tamagui/metro-plugin");

module.exports = withTamagui(config, {
  components: ["tamagui"],
  config: "./tamagui.config.ts",
});
```

**Issue:** Font not loading

**Solution:** Ensure fonts are properly loaded in your app entry point:

```tsx
import { useFonts } from "expo-font";

function App() {
  const [loaded] = useFonts({
    "SpaceGrotesk-Regular": require("./assets/fonts/SpaceGrotesk-Regular.ttf"),
    // ... other fonts
  });

  if (!loaded) return null;
  return <AppContent />;
}
```

---

## Migration from Legacy UI

If you're migrating from the old custom UI system:

### Before (Tailwind/NativeWind)

```tsx
// Web (Tailwind)
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>

// Native (NativeWind)
<TouchableOpacity className="bg-blue-500 px-4 py-2 rounded">
  <Text className="text-white">Click me</Text>
</TouchableOpacity>
```

### After (Tamagui)

```tsx
// Both web and native
<Button variant="primary" onPress={handlePress}>
  Click me
</Button>
```

See the [Migration Guide](./docs/MIGRATION.md) for detailed instructions.

---

## Contributing

### Component Development Workflow

1. Create component in `src/components/ComponentName.tsx`
2. Add stories in `src/components/ComponentName.stories.tsx`
3. Export from `src/components/index.ts`
4. Write tests in `test/components/ComponentName.test.tsx`
5. Run `bun run typecheck` to verify types
6. Run `bun test` to verify tests pass
7. Run `bun run storybook` to verify stories render

### Story Guidelines

- Include all component variants in stories
- Use Controls panel for interactive prop testing
- Add JSDoc comments for prop documentation
- Use the `meta` export for component metadata

---

## License

AGPL-3.0 - See LICENSE file for details.

## Links

- [Tamagui Documentation](https://tamagui.dev/docs/intro)
- [Storybook Documentation](https://storybook.js.org/docs)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Project README](../../README.md)
