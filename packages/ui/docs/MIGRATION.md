# Tamagui Migration Guide

A comprehensive guide for developers migrating from the legacy custom UI system to the new Tamagui-based unified component library.

---

## Overview

This guide covers the migration from:

- **Web:** Tailwind v4 + custom components → Tamagui
- **Native:** NativeWind + custom styles → Tamagui

To a unified cross-platform component system using `@mirai-app/ui`.

---

## Table of Contents

1. [Why Migrate?](#why-migrate)
2. [Prerequisites](#prerequisites)
3. [Migration Steps](#migration-steps)
4. [Component Mapping](#component-mapping)
5. [Styling Changes](#styling-changes)
6. [Theme Migration](#theme-migration)
7. [Testing Changes](#testing-changes)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Why Migrate?

### Benefits

- **Single API:** Write components once, use on both web and native
- **Type Safety:** Full TypeScript support with IDE autocomplete
- **Theme Consistency:** Automatic light/dark mode across platforms
- **Better DX:** No more `Platform.select()` for styling
- **Performance:** Optimized rendering with CSS variables
- **Maintainability:** One design system to maintain

### Before vs After

```tsx
// BEFORE: Different implementations per platform
// Web (Tailwind)
function WebButton({ children }) {
  return (
    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
      {children}
    </button>
  );
}

// Native (NativeWind)
function NativeButton({ children }) {
  return (
    <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded">
      <Text className="text-white">{children}</Text>
    </TouchableOpacity>
  );
}

// AFTER: Single implementation
import { Button } from "@mirai-app/ui";

function UniversalButton({ children }) {
  return <Button variant="primary">{children}</Button>;
}
```

---

## Prerequisites

### Knowledge Requirements

- Basic understanding of Tamagui (see [Tamagui Docs](https://tamagui.dev/docs/intro))
- Familiarity with styled-components or CSS-in-JS patterns
- Understanding of React Native layout (flexbox)

### Environment Setup

Ensure your development environment is ready:

```bash
# Install dependencies
bun install

# Build the UI package
cd packages/ui && bun run build

# Run Storybook to explore components
bun run storybook
```

---

## Migration Steps

### Step 1: Update Imports

Replace legacy imports with Tamagui imports:

```tsx
// BEFORE
import { CustomButton } from "~/components/ui/Button";
import { colors } from "~/styles/colors";

// AFTER
import { Button } from "@mirai-app/ui";
```

### Step 2: Wrap Your App with Provider

Add `TamaguiProvider` at your app root:

**Web (apps/web):**

```tsx
// src/layouts/Layout.astro or app root
import { TamaguiProvider } from "@mirai-app/ui";
import { config } from "@mirai-app/ui";

<TamaguiProvider config={config} defaultTheme="light">
  <slot />
</TamaguiProvider>;
```

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

### Step 3: Replace Components

Migrate components one by one using the mapping below.

### Step 4: Update Styles

Replace utility classes with Tamagui props:

```tsx
// BEFORE (Tailwind)
<div className="flex flex-col p-4 bg-white rounded-lg shadow">

// AFTER (Tamagui)
<YStack p="$4" bg="$background" br="$4" elevation="sm">
```

### Step 5: Test Thoroughly

Run tests to ensure visual parity:

```bash
# Run component tests
bun test

# Check for visual regressions
bun run storybook
```

---

## Component Mapping

### Button Migration

```tsx
// BEFORE (Web - Tailwind)
<button
  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
  disabled={disabled}
  onClick={onClick}
>
  {children}
</button>

// BEFORE (Native - NativeWind)
<TouchableOpacity
  className={`bg-blue-500 px-4 py-2 rounded ${disabled ? 'opacity-50' : ''}`}
  disabled={disabled}
  onPress={onPress}
>
  <Text className="text-white">{children}</Text>
</TouchableOpacity>

// AFTER (Tamagui - Universal)
import { Button } from '@mirai-app/ui';

<Button
  variant="primary"
  disabled={disabled}
  onPress={onPress}
>
  {children}
</Button>

// Button variants mapping:
// Tailwind bg-blue-500 → variant="primary"
// Tailwind bg-gray-200 → variant="secondary"
// Tailwind bg-transparent → variant="ghost"
// Tailwind bg-red-500 → variant="danger"
```

### Card Migration

```tsx
// BEFORE (Tailwind)
<div className="bg-white rounded-lg shadow p-4">
  {children}
</div>

// AFTER (Tamagui)
import { Card } from '@mirai-app/ui';

<Card>
  {children}
</Card>

// With customization:
<Card
  size="lg"           // sm | md | lg
  elevation="md"      // none | sm | md | lg
  bordered           // adds border
>
  {children}
</Card>
```

### Input Migration

```tsx
// BEFORE (Tailwind)
<div className="space-y-2">
  <label className="text-sm font-medium">Email</label>
  <input
    className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
    value={value}
    onChange={onChange}
  />
  {error && <span className="text-red-500 text-sm">{error}</span>}
</div>;

// AFTER (Tamagui)
import { Input } from "@mirai-app/ui";

<Input
  label="Email"
  value={value}
  onChangeText={onChangeText}
  error={error}
  placeholder="Enter your email"
/>;
```

### Text/Typography Migration

```tsx
// BEFORE (Tailwind)
<h1 className="text-2xl font-bold text-gray-900">Heading</h1>
<p className="text-sm text-gray-600">Body text</p>
<span className="text-xs text-gray-400">Caption</span>

// AFTER (Tamagui)
import { H1, Text, Caption } from '@mirai-app/ui';

<H1>Heading</H1>
<Text color="$colorMuted">Body text</Text>
<Caption>Caption</Caption>

// Or with full control:
<Text fontSize="$2xl" fontWeight="$bold" color="$color">
  Custom heading
</Text>
```

### Modal → Sheet Migration

```tsx
// BEFORE (Custom Modal)
<Modal visible={visible} onDismiss={onDismiss}>
  <View>{content}</View>
</Modal>;

// AFTER (Tamagui Sheet)
import { Sheet } from "@mirai-app/ui";

<Sheet open={open} onOpenChange={setOpen}>
  <Sheet.Frame>
    <Sheet.Handle />
    {content}
  </Sheet.Frame>
</Sheet>;
```

### Layout Migration

```tsx
// BEFORE (Tailwind flexbox)
<div className="flex flex-row items-center justify-between p-4 gap-2">
  <div className="flex-1">Left</div>
  <div>Right</div>
</div>

// AFTER (Tamagui)
import { XStack, YStack } from 'tamagui';

<XStack
  alignItems="center"
  justifyContent="space-between"
  p="$4"
  gap="$2"
>
  <XStack flex={1}>Left</XStack>
  <Text>Right</Text>
</XStack>

// Vertical stack:
<YStack gap="$4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</YStack>
```

---

## Styling Changes

### From Utility Classes to Tokens

| Tailwind Class  | Tamagui Prop          | Token           |
| --------------- | --------------------- | --------------- |
| `p-4`           | `p="$4"`              | 16px            |
| `px-4`          | `px="$4"`             | 16px horizontal |
| `py-2`          | `py="$2"`             | 8px vertical    |
| `m-4`           | `m="$4"`              | 16px margin     |
| `text-sm`       | `fontSize="$sm"`      | 12px            |
| `text-lg`       | `fontSize="$lg"`      | 16px            |
| `font-bold`     | `fontWeight="$bold"`  | 700             |
| `bg-white`      | `bg="$background"`    | Theme-aware     |
| `text-gray-600` | `color="$colorMuted"` | Theme-aware     |
| `rounded-lg`    | `br="$4"`             | 16px radius     |
| `shadow-md`     | `elevation="md"`      | Platform-aware  |

### Common Shorthands

| Shorthand | Full Property       |
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

## Theme Migration

### Color Tokens

Replace hardcoded colors with theme tokens:

```tsx
// BEFORE (hardcoded)
<Text style={{ color: '#9ca3af' }}>Muted text</Text>

// AFTER (theme token)
<Text color="$colorMuted">Muted text</Text>
```

### Theme-Aware Colors

| Old Color | New Token      | Light Mode | Dark Mode   |
| --------- | -------------- | ---------- | ----------- |
| `#ffffff` | `$background`  | White      | Dark        |
| `#111827` | `$color`       | Black      | White       |
| `#9ca3af` | `$colorMuted`  | Gray       | Gray        |
| `#e5e7eb` | `$borderColor` | Light gray | Dark border |
| `#00ced1` | `$primary`     | Cyan       | Cyan        |
| `#ef4444` | `$danger`      | Red        | Red         |
| `#22c55e` | `$success`     | Green      | Green       |

### Dark Mode Support

```tsx
// BEFORE: Manual dark mode handling
const isDark = useColorScheme() === 'dark';
<View style={{ backgroundColor: isDark ? '#000' : '#fff' }} />

// AFTER: Automatic via theme
<View bg="$background" />
// Automatically renders correct color for current theme
```

---

## Testing Changes

### Test Setup

```tsx
// test/setup.tsx
import { TamaguiProvider } from "@mirai-app/ui";
import { config } from "@mirai-app/ui";

export const TestWrapper = ({ children }) => (
  <TamaguiProvider
    config={config}
    defaultTheme="light"
    disableInjectCSS // Important for tests
  >
    {children}
  </TamaguiProvider>
);
```

### Writing Tests

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "./test/setup";
import { Button } from "@mirai-app/ui";

describe("Button", () => {
  it("renders correctly", () => {
    render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>,
    );

    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

---

## Common Patterns

### Form with Validation

```tsx
import { useState } from "react";
import { YStack, Button, Input } from "@mirai-app/ui";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    if (!email.includes("@")) {
      setError("Invalid email address");
      return false;
    }
    setError("");
    return true;
  };

  return (
    <YStack gap="$4">
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={error}
        placeholder="Enter your email"
        keyboardType="email-address"
      />
      <Button onPress={validate}>Submit</Button>
    </YStack>
  );
}
```

### List with Cards

```tsx
import { YStack, Card, Text, Button } from "@mirai-app/ui";

function TripList({ trips }) {
  return (
    <YStack gap="$4" p="$4">
      {trips.map((trip) => (
        <Card key={trip.id} size="md" elevation="sm" bordered>
          <Text fontSize="$xl" fontWeight="$semibold">
            {trip.name}
          </Text>
          <Text color="$colorMuted">{trip.date}</Text>
          <Button variant="secondary" size="sm">
            View Details
          </Button>
        </Card>
      ))}
    </YStack>
  );
}
```

### Custom Styled Component

```tsx
import { styled, Card, Text } from "@mirai-app/ui";

const TripCard = styled(Card, {
  name: "TripCard",

  variants: {
    status: {
      active: {
        borderColor: "$success",
        borderWidth: 2,
      },
      completed: {
        borderColor: "$gray400",
        opacity: 0.7,
      },
      cancelled: {
        borderColor: "$danger",
        backgroundColor: "$dangerOpacity12",
      },
    },
  },

  defaultVariants: {
    status: "active",
  },
});

// Usage
<TripCard status="active">
  <Text>Active Trip</Text>
</TripCard>;
```

### Responsive Design

```tsx
import { styled } from "@mirai-app/ui";

const ResponsiveCard = styled(Card, {
  width: "100%",

  $sm: {
    // Small screens
    padding: "$2",
  },
  $md: {
    // Medium screens
    padding: "$4",
  },
  $lg: {
    // Large screens
    padding: "$6",
  },
});
```

---

## Troubleshooting

### Common Migration Issues

**Issue:** Component looks different after migration

**Solution:** Check theme tokens and compare with old color values. Use Storybook to visually verify.

```tsx
// Debug theme values
import { useTheme } from "@mirai-app/ui";

function DebugTheme() {
  const theme = useTheme();
  console.log("Background:", theme.background);
  console.log("Primary:", theme.primary);
  return null;
}
```

**Issue:** Type errors with Tamagui props

**Solution:** Ensure you're using valid token values. Check available tokens in `src/theme/tokens.ts`.

```tsx
// Valid
<Card p="$4" />  // ✓

// Invalid (will cause type error)
<Card p="16px" />  // ✗ Use tokens instead
```

**Issue:** Animations not working

**Solution:** Ensure you're using Tamagui's animation props or the `styled()` API with animation drivers.

**Issue:** Web-specific styles not applying

**Solution:** Use the `platform` attribute or web-specific styles:

```tsx
styled(View, {
  // Universal styles
  padding: "$4",

  // Web-only
  "@media (hover: hover)": {
    cursor: "pointer",
  },
});
```

---

## Checklist

Before completing your migration:

- [ ] All Tailwind/NativeWind classes removed
- [ ] All imports updated to `@mirai-app/ui`
- [ ] `TamaguiProvider` added to app root
- [ ] Components tested in both light and dark mode
- [ ] Visual regression tests pass
- [ ] Accessibility verified (screen readers, keyboard nav)
- [ ] Performance compared to pre-migration
- [ ] Storybook stories created for new components

---

## Resources

- [Tamagui Documentation](https://tamagui.dev/docs/intro)
- [Tamagui Configuration](https://tamagui.dev/docs/core/configuration)
- [Styling Guide](https://tamagui.dev/docs/intro/styles)
- [Component Docs](../README.md)
- [Project README](../../README.md)

---

## Support

For migration questions:

1. Check this guide first
2. Review the [component documentation](../README.md)
3. Explore [Storybook](http://localhost:6006) for examples
4. Ask in the development channel
