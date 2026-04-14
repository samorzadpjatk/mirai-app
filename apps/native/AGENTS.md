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
└── __tests__/    # Jest test files
```

### Platform-Specific Files

```ts
// Component.ios.tsx - iOS specific
// Component.android.tsx - Android specific
// Component.tsx - Shared fallback
```

---

## Jest Testing Setup

### Test Commands

```bash
cd apps/native && npm test       # Run all tests
npm test -- --coverage         # With coverage
npm test -- --testPathPattern  # Specific file
npm run test:watch             # Watch mode
```

### Test File Locations

| Type      | Pattern      | Example                           |
| --------- | ------------ | --------------------------------- |
| Unit      | `*.test.ts`  | `utils/helpers.test.ts`           |
| Component | `*.test.tsx` | `components/Button.test.tsx`      |
| Screen    | `*.test.tsx` | `__tests__/screens/Home.test.tsx` |

### Component Testing

```tsx
import { render, fireEvent } from "@testing-library/react-native";
describe("[UNIT] Button", () => {
  it("handles press", () => {
    const onPress = jest.fn();
    render(<Button title="Tap" onPress={onPress} />);
    fireEvent.press(screen.getByText("Tap"));
    expect(onPress).toHaveBeenCalled();
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
