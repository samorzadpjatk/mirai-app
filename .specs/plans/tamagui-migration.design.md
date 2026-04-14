# Tamagui UI Migration Design

## Overview

Replace all custom UI components in `apps/web` and `apps/native` with a unified Tamagui-based component library. Execute this migration using a **big-bang approach** with a 2-3 week feature freeze.

**Goals:**

- Design consistency across web and native platforms
- Unified developer experience with single component library
- Modern testing with Bun native test runner and Happy DOM
- Component documentation via Storybook

---

## 1. Migration Scope

### Included

| Component Category | Web (8)                                                                                | Native (30+)                                                       |
| ------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Primitives         | Button, Card, Input, Select, Modal, DateInput, TimeInput, LoadingSpinner, ErrorMessage | ChallengeCard, RewardsView, Judgement cards, all screen components |
| Design Tokens      | `design-tokens/` (colors, typography, spacing, radius)                                 | `src/styles/` (colors, spacing, typography, borderRadius)          |
| Dependencies       | Tailwind CSS v4, react-icons                                                           | NativeWind, inline styles                                          |

### Excluded (YAGNI)

- Backend API changes
- Navigation logic (expo-router, React Navigation)
- State management hooks
- GraphQL queries
- Business logic in use cases

---

## 2. Architecture & Package Structure

### New Package: `packages/ui/`

```
packages/ui/
├── src/
│   ├── components/              # Universal components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Text.tsx             # Typography primitive
│   │   ├── Stack.tsx            # Layout primitive
│   │   └── index.ts
│   ├── theme/
│   │   ├── tokens.ts            # Colors, spacing, radius
│   │   ├── fonts.ts             # Inter + IBM Plex Sans
│   │   ├── tamagui.config.ts    # Main config
│   │   └── themes.ts            # Dark theme
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── test-setup/              # Bun test configurations
│   │   ├── happydom.ts          # Web tests
│   │   ├── native.ts            # Native tests
│   │   └── bun-native-adapter.ts # Bun-compatible expo mocks
│   └── index.ts
├── .storybook/                  # Storybook configuration
│   ├── main.ts
│   ├── preview.tsx
│   └── StorybookProvider.tsx
├── package.json
├── tsconfig.json
└── README.md
```

### Key Architectural Decisions

1. **Platform-agnostic base:** Most components use Tamagui primitives that render correctly on web and native without platform checks.

2. **Platform extensions when needed:**

   ```tsx
   // ScrollView.tsx (web)
   export { ScrollView } from "tamagui";

   // ScrollView.native.tsx (native)
   export { ScrollView } from "react-native";
   ```

3. **Theme strategy:**
   - Map current dark theme colors to Tamagui tokens
   - Port `Inter` (web) + `IBM Plex Sans` (native) font stack
   - Maintain semantic naming: `$primary`, `$background`, `$text`, etc.

4. **No platform-specific variants:** Same API across platforms. Tamagui compiler handles differences.

---

## 3. Testing Strategy

### Bun Native Test Runner

Replace Jest with Bun's native test runner for faster execution and simplified configuration.

**Web Test Setup (`test-setup/happydom.ts`):**

```typescript
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

**Native Test Setup (`test-setup/native.ts`):**

```typescript
// Bun-compatible expo/react-native mocks
import "./bun-native-adapter";

// Extend expect with RNTL matchers
import "@testing-library/react-native/extend-expect";
```

### Bun Native Adapter for Expo (`test-setup/bun-native-adapter.ts`)

Adapted from `jest-expo` preset for Bun's test runner:

```typescript
/**
 * Bun-compatible adapter for Expo/React Native testing
 * Adapted from jest-expo/src/preset/setup.js
 */

// Polyfill global objects
globalThis.window = globalThis;
globalThis.window.navigator = { userAgent: "react-native" };

// React DevTools hook
globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  isDisabled: true,
  renderers: { values: () => [] },
  on() {},
  off() {},
};

// Native modules mock
const mockNativeModules = {
  PlatformConstants: {
    forceTouchAvailable: false,
    osVersion: "mock",
    systemVersion: "mock",
    interfaceIdiom: "phone",
  },
  StatusBarManager: {
    HEIGHT: 20,
    setStyle: () => {},
    setHidden: () => {},
  },
  // Add more as needed based on jest-expo's module mocks
};

// Mock expo-modules-core
const mockExpoModules = {
  requireNativeModule: (name: string) => {
    throw new Error(
      `Native module '${name}' not available in test environment`,
    );
  },
  requireOptionalNativeModule: (name: string) => null,
  EventEmitter: class EventEmitter {
    addListener = () => ({ remove: () => {} });
    emit = () => {};
  },
  NativeModule: class NativeModule {},
};

// Install polyfills
(globalThis as any).expo = {
  EventEmitter: mockExpoModules.EventEmitter,
  NativeModule: mockExpoModules.NativeModule,
};

// Export for test usage
export { mockNativeModules, mockExpoModules };
```

### Test Commands

```json
{
  "scripts": {
    "test": "bun test --preload ./src/test-setup/happydom.ts",
    "test:native": "bun test --preload ./src/test-setup/native.ts",
    "test:ui": "bun test --preload ./src/test-setup/happydom.ts 'src/components/**/*.test.tsx'",
    "test:all": "bun test && bun run test:native"
  }
}
```

### Testing Approach

| Test Type         | Tooling                                                          | Purpose            |
| ----------------- | ---------------------------------------------------------------- | ------------------ |
| Unit tests        | Bun + `@testing-library/react` / `@testing-library/react-native` | Component behavior |
| Visual regression | Storybook + Chromatic (future)                                   | UI consistency     |
| Integration       | Bun tests with MSW (web) / mocked GraphQL (native)               | User flows         |
| Theme validation  | Custom script                                                    | Token coverage     |

---

## 4. Storybook Integration

### Setup

```typescript
// .storybook/main.ts
export default {
  stories: ['../src/components/**/*.stories.?(ts|tsx|js|jsx)'],
  addons: ['@storybook/addon-react-native-web'],
  framework: '@storybook/react-vite',
};

// .storybook/preview.tsx
import type { Preview } from '@storybook/react';
import { TamaguiProvider } from 'tamagui';
import config from '../src/theme/tamagui.config';

const preview: Preview = {
  decorators: [
    (Story) => (
      <TamaguiProvider config={config}>
        <Story />
      </TamaguiProvider>
    ),
  ],
};

export default preview;
```

### Component Story Example

```typescript
// src/components/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Click me",
  },
};
```

### Storybook Commands

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

---

## 5. Migration Workflow & Timeline

### Sprint Structure (2-3 Weeks)

| Week       | Focus                   | Deliverable                                                              |
| ---------- | ----------------------- | ------------------------------------------------------------------------ |
| **Week 1** | Foundation + Primitives | `packages/ui` setup; Button, Card, Input, Text, Stack; Storybook running |
| **Week 2** | Complex Components      | Modal, Select, ScrollView variants; 60% screens converted                |
| **Week 3** | Polish + Final Screens  | Judgement flows, edge cases; full regression; documentation              |

### Daily Workflow

1. **Morning:** Pick component from backlog, pair on complex ones
2. **Midday:** Test in web + native simulators
3. **Evening:** Demo progress, commit with conventional messages

### Component Migration Pattern

```tsx
// BEFORE (apps/web/src/components/ui/Button.tsx)
<button className="bg-primary text-background hover:brightness-110...">

// AFTER (packages/ui/src/components/Button.tsx)
import { Button as TamaguiButton, styled } from 'tamagui';

export const Button = styled(TamaguiButton, {
  backgroundColor: '$primary',
  color: '$background',
  // Tamagui handles hover/active via compiler
});
```

---

## 6. Dependencies

### To Add

```json
{
  "dependencies": {
    "tamagui": "^1.125.0",
    "@tamagui/core": "^1.125.0",
    "@tamagui/config": "^1.125.0",
    "@tamagui/lucide-icons": "^1.125.0"
  },
  "devDependencies": {
    "@storybook/react": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/addon-react-native-web": "^0.0.1",
    "happy-dom": "^17.0.0",
    "@happy-dom/global-registrator": "^17.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/react-native": "^13.0.0"
  }
}
```

### To Remove

```json
{
  "apps/web": {
    "remove": ["tailwindcss", "@tailwindcss/vite"]
  },
  "apps/native": {
    "remove": ["nativewind", "react-native-css-interop"]
  }
}
```

---

## 7. Pre-Merge Checklist

- [ ] All 8 web UI primitives migrated to `packages/ui`
- [ ] All native screen components migrated
- [ ] Storybook displays all components correctly
- [ ] Theme tokens match existing dark theme (visual parity)
- [ ] `bun test` passes in `packages/ui`
- [ ] `bun test` passes in `apps/web`
- [ ] `bun test` passes in `apps/native`
- [ ] Manual smoke test: login → challenges → rewards (both platforms)
- [ ] No `tailwind.config.*` or `nativewind` references remaining
- [ ] Documentation updated in component READMEs

---

## 8. Rollback Strategy

Feature flag `ENABLE_TAMAGUI_UI` defaults to `true`. Set to `false` in `.env` to revert to old components if critical issues arise during rollout.

---

## 9. Success Criteria

1. **Developer Experience:** Single import `@mirai-app/ui` works in both web and native
2. **Visual Parity:** No visual regression in dark theme across platforms
3. **Performance:** Bundle size maintained or improved (Tamagui compiler optimization)
4. **Test Coverage:** All components have accompanying tests with Bun runner
5. **Documentation:** Storybook documents all components with usage examples

---

**Next Steps:**

1. Create implementation worktree using `git:create-worktree`
2. Create task spec using `sdd:add-task`
3. Execute Week 1: Foundation sprint

**Version:** 1.0.0  
**Created:** 2026-04-14  
**Approach:** Big-Bang Migration with Bun Test + Storybook
