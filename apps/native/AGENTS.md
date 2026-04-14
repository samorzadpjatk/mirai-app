# Native App — Quick Reference

> **React Native mobile development guide**
> See root `AGENTS.md` for universal conventions.

---

## Mobile Development Patterns

### Component Structure

```
src/
├── components/   # Reusable UI components
├── screens/      # Screen-level components
├── navigation/   # Navigation configuration
└── test/         # Bun test files
```

### Platform-Specific Files

```ts
// Component.ios.tsx - iOS specific
// Component.android.tsx - Android specific
// Component.tsx - Shared fallback
```

---

## Bun Testing Setup

### Test Commands

```bash
bun test                       # Run all tests
bun test:unit                  # Run unit tests only
bun test --coverage            # With coverage
bun test --watch               # Watch mode
```

### Test File Locations

| Type      | Pattern      | Example                           |
| --------- | ------------ | --------------------------------- |
| Unit      | `*.test.ts`  | `test/smoke.test.ts`              |
| Component | `*.test.tsx` | `test/components/Button.test.tsx` |

### Test Infrastructure

Tests use **Bun** test runner with **Happy DOM** for browser-like environment:

- **Setup**: `test/setup.ts` - Happy DOM registration and globals
- **TestWrapper**: `test/TestWrapper.tsx` (re-exports from `@mirai-app/ui/test`)

### Component Testing

```tsx
import { describe, it, expect } from "bun:test";
import { TestWrapper } from "@mirai-app/ui/test";
import { Button } from "@mirai-app/ui";

describe("[UNIT] Button", () => {
  it("renders with TamaguiProvider", () => {
    const { container } = render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });
});
```

---

## Navigation Patterns

```tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
const Stack = createNativeStackNavigator<RootStackParamList>();
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};
```

---

## Platform Considerations

| Platform    | Key Points                                         |
| ----------- | -------------------------------------------------- |
| **iOS**     | Use `SafeAreaView`; test on SE/Pro Max             |
| **Android** | Handle back via `BackHandler`; request permissions |

---

## Deep Reference

- **CLAUDE.md §4**: TDD Conventions — Testing patterns
- **CLAUDE.md §8.2**: Exploratory/Spike Test Files — Cleanup patterns
- **Root AGENTS.md**: Universal conventions, SDD/TDD checklists
- **React Navigation docs**: `reactnavigation.org`

---

**Last Updated:** 2026-04-14  
**Version:** 1.0.0
