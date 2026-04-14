# Tamagui Migration Skill

> Reusable skill for migrating from Tailwind/NativeWind to Tamagui

## Overview

Tamagui is a universal styling library for React Native and Web that replaces Tailwind + NativeWind with a unified, type-safe, token-based styling system. It offers 100% feature parity between platforms and an optional compiler for performance optimization.

### Why Migrate?

- Single codebase for web and native (no NativeWind needed)
- Type-safe styling with excellent IDE support
- Token-based design system (no arbitrary values chaos)
- Optional compiler for 15%+ performance gains
- Sub-theming and component themes
- Shorthands aligned with Tailwind for easier migration

## Installation

### Step 1: Install Dependencies

```bash
# Core library
bun add @tamagui/core

# Or full UI kit (recommended)
bun add tamagui

# Preset configuration with Tailwind-aligned shorthands
bun add @tamagui/config
```

### Step 2: Create Configuration

Create `tamagui.config.ts`:

```typescript
import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

export const config = createTamagui(defaultConfig);
type Conf = typeof config;

// Type augmentation for IDE support
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}

export default config;
```

### Step 3: Add Provider

Wrap your app with `TamaguiProvider`:

```typescript
import { TamaguiProvider } from 'tamagui'
import config from './tamagui.config'

export default function App() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <YourApp />
    </TamaguiProvider>
  )
}
```

### Step 4: Remove NativeWind (Expo)

Update `app.json` to `app.config.ts`:

```typescript
export default {
  expo: {
    userInterfaceStyle: "automatic", // For dark mode support
    // ... rest of config
  },
};
```

## Key Concepts

### Tokens vs Themes

| Concept    | Description                        | Example                         |
| ---------- | ---------------------------------- | ------------------------------- |
| **Tokens** | Global CSS variables (static)      | `color: { white: '#fff' }`      |
| **Themes** | Contextual CSS variables (dynamic) | `light: { background: '#fff' }` |

### Shorthands (Tailwind-Aligned)

```typescript
// @tamagui/config/v5 includes these shorthands:
px → paddingHorizontal
py → paddingVertical
mx → marginHorizontal
my → marginVertical
bg → backgroundColor
br → borderRadius
// ... and many more
```

### styled() Function

Create reusable, themeable components:

```typescript
import { styled, View, GetProps } from 'tamagui'

const Card = styled(View, {
  backgroundColor: '$background',
  borderRadius: '$4',
  padding: '$4',

  variants: {
    size: {
      small: { padding: '$2' },
      large: { padding: '$6' },
    },
  } as const,
})

// Get typed props
type CardProps = GetProps<typeof Card>

// Usage
<Card size="large" />
```

### Theme Nesting

```typescript
// Define sub-themes: parentName_subName
const dark_alert = {
  background: '#e6ebbd',
}

// Usage
<Theme name="dark">
  <Button theme="alert">Warning</Button>
</Theme>
```

## Common Patterns

### Pattern 1: Tailwind Class → Tamagui Prop

| Tailwind                      | Tamagui                                   |
| ----------------------------- | ----------------------------------------- |
| `className="p-4"`             | `padding="$4"` or `p="$4"`                |
| `className="px-4"`            | `paddingHorizontal="$4"` or `px="$4"`     |
| `className="bg-red-500"`      | `backgroundColor="$red5"` or `bg="$red5"` |
| `className="flex-row"`        | `flexDirection="row"`                     |
| `className="items-center"`    | `alignItems="center"`                     |
| `className="justify-between"` | `justifyContent="space-between"`          |

### Pattern 2: Responsive Styles

```typescript
// Media queries in config
const config = createTamagui({
  ...defaultConfig,
  media: {
    sm: { maxWidth: 860 },
    gtSm: { minWidth: 860 },
  },
})

// Usage
<View
  width={200}
  $sm={{ width: '100%' }}  // Apply on small screens
/>
```

### Pattern 3: Component Themes

```typescript
const ButtonFrame = styled(View, {
  name: 'Button',  // Enables component-specific themes
  backgroundColor: '$background',
})

// Create theme
themes: {
  dark_Button: {
    background: '#333',
    color: '#fff',
  }
}
```

### Pattern 4: Font Configuration

```typescript
import { createFont } from "tamagui";

const interFont = createFont({
  family: "Inter",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    true: 16, // Default size
  },
  lineHeight: {
    /* ... */
  },
  weight: {
    /* ... */
  },
});
```

### Pattern 5: Platform-Specific Files

The compiler handles platform-specific extensions:

- `.web.tsx` - Web only
- `.native.tsx` - Native only
- `.ios.tsx` / `.android.tsx` - Platform-specific

## Monorepo Setup

### Package Structure

```json
{
  "name": "@yourorg/ui",
  "main": "dist/cjs",
  "module": "dist/esm",
  "module:jsx": "dist/jsx",
  "files": ["types", "src", "dist"],
  "sideEffects": ["*.css"],
  "dependencies": {
    "tamagui": "*"
  },
  "scripts": {
    "build": "tamagui-build",
    "watch": "tamagui-build --watch"
  }
}
```

### Build Configuration

Create `tamagui.build.ts`:

```typescript
import type { TamaguiBuildOptions } from "tamagui";

export default {
  config: "./tamagui.config.ts",
  components: ["tamagui", "@yourorg/ui"],
  outputCSS: "./tamagui.generated.css",
} satisfies TamaguiBuildOptions;
```

## Expo Integration

### Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withTamagui } = require("@tamagui/metro-plugin");

const config = getDefaultConfig(__dirname);
module.exports = withTamagui(config);
```

### Babel Configuration

```javascript
// babel.config.js
module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    "@tamagui/babel-plugin", // Optional compiler
  ],
};
```

### First-Time Cache Clear

```bash
bun dlx expo start -c
```

## Testing with Bun + Happy DOM

### Test Setup

```typescript
// test/setup.ts
import { TamaguiProvider } from 'tamagui'
import config from '../tamagui.config'

export const TestWrapper = ({ children }) => (
  <TamaguiProvider
    config={config}
    defaultTheme="light"
    disableInjectCSS  // Disable auto CSS injection in tests
  >
    {children}
  </TamaguiProvider>
)
```

### Component Test Example

```typescript
import { render } from '@testing-library/react'
import { TestWrapper } from './test/setup'
import { Button } from './Button'

test('Button renders with correct styles', () => {
  const { getByText } = render(
    <TestWrapper>
      <Button>Click me</Button>
    </TestWrapper>
  )

  expect(getByText('Click me')).toBeInTheDocument()
})
```

## Storybook Integration

### Global Decorator

```typescript
// .storybook/preview.tsx
import { TamaguiProvider } from 'tamagui'
import config from '../tamagui.config'

export const decorators = [
  (Story) => (
    <TamaguiProvider config={config} defaultTheme="light">
      <Story />
    </TamaguiProvider>
  ),
]
```

### CSS Output

Include generated CSS in `.storybook/preview-head.html`:

```html
<link rel="stylesheet" href="/tamagui.generated.css" />
```

## Troubleshooting

### Issue: Styles Not Applying

**Symptoms**: Components render but styles don't appear

**Solutions**:

1. Check `TamaguiProvider` is at app root
2. Verify config is exported correctly
3. Clear Metro cache: `expo start -c`

### Issue: Type Errors on Theme Props

**Symptoms**: TypeScript errors like `Property 'background' does not exist`

**Solutions**:

```typescript
// Ensure module augmentation is present
type Conf = typeof config;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
```

### Issue: NativeWind Conflicts

**Symptoms**: Mixed styling behavior, inconsistent results

**Solutions**:

- Remove NativeWind completely before adding Tamagui
- Don't use both in the same project

### Issue: Pressable Not Working

**Symptoms**: React Native Pressable/TouchableOpacity not behaving correctly

**Solutions**:

- Use Tamagui's built-in pressable features
- Wrap with `styled(View)` and add press handlers

### Issue: Font Weights Not Applying (Android)

**Symptoms**: Font looks same on Android regardless of weight prop

**Solutions**:

```typescript
const font = createFont({
  face: {
    400: { normal: "Inter", italic: "InterItalic" },
    600: { normal: "InterBold" },
  },
});
```

### Issue: Compiler Not Optimizing

**Symptoms**: No compiler output, no optimization logs

**Solutions**:

1. Verify `tamagui.build.ts` exists and is correct
2. Check components array includes your packages
3. Add `// debug` pragma to file
4. Enable `logTimings: true`

### Issue: CSS Injection in SSR

**Symptoms**: Hydration mismatches, flash of unstyled content

**Solutions**:

```typescript
// Use disableInjectCSS for SSR
<TamaguiProvider config={config} disableInjectCSS>
  {/* Render inline CSS on server */}
  <style dangerouslySetInnerHTML={{ __html: config.getCSS() }} />
</TamaguiProvider>
```

## Compiler Setup (Optional)

The compiler is optional but recommended for production.

### Metro/Expo

```javascript
// babel.config.js
module.exports = {
  plugins: ["@tamagui/babel-plugin"],
};
```

### CLI Approach (Any Bundler)

```json
{
  "scripts": {
    "build": "tamagui build --target web ./src -- next build"
  }
}
```

### Debugging

```typescript
// Add at top of file
// debug

// Or verbose
// debug-verbose
```

## Migration Checklist

- [ ] Remove NativeWind/Tailwind dependencies
- [ ] Install `tamagui` and `@tamagui/config`
- [ ] Create `tamagui.config.ts` with `@tamagui/config/v5`
- [ ] Add `TamaguiProvider` to app root
- [ ] Map existing design tokens to Tamagui tokens
- [ ] Replace `className` with style props
- [ ] Update components to use `styled()`
- [ ] Configure Metro/Vite/Next.js plugin
- [ ] Set up tests with `disableInjectCSS`
- [ ] Add compiler for production (optional)
- [ ] Clear cache and test both platforms

## Resources

### Official Documentation

- [Tamagui Docs](https://tamagui.dev/docs)
- [Configuration Guide](https://tamagui.dev/docs/core/configuration)
- [Expo Guide](https://tamagui.dev/docs/guides/expo)
- [Compiler Installation](https://tamagui.dev/docs/intro/compiler-install)
- [styled() Function](https://tamagui.dev/docs/core/styled)
- [Themes](https://tamagui.dev/docs/intro/themes)
- [Design Systems](https://tamagui.dev/docs/guides/design-systems)
- [CLI Guide](https://tamagui.dev/docs/guides/cli)
- [Metro Guide](https://tamagui.dev/docs/guides/metro)

### Community

- [GitHub Repository](https://github.com/tamagui/tamagui)
- [Discord](https://discord.gg/4qh6tdcVDa)
- [Figma Design File](https://www.figma.com/community/file/1326593766534421119)

### Key Packages

| Package                 | Purpose                   |
| ----------------------- | ------------------------- |
| `tamagui`               | Full UI kit               |
| `@tamagui/core`         | Core style library        |
| `@tamagui/config`       | Preset configurations     |
| `@tamagui/cli`          | Build optimization CLI    |
| `@tamagui/vite-plugin`  | Vite integration          |
| `@tamagui/next-plugin`  | Next.js integration       |
| `@tamagui/metro-plugin` | Metro/Expo integration    |
| `@tamagui/babel-plugin` | Compiler for Metro        |
| `@tamagui/font-inter`   | Pre-configured Inter font |

## Key Recommendation

Start with `@tamagui/config/v5` preset which includes Tailwind-aligned shorthands. This makes migration significantly easier as many prop names will feel familiar (e.g., `px`, `py`, `bg`, `br`). Gradually migrate components one at a time, and add the compiler only after the basic migration is stable.
