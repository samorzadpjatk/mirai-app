# Testing Guidelines

## Overview

This project uses Jest with `jest-expo` configuration and React Native Testing Library for testing React Native components. This guide establishes best practices for writing maintainable, accessible, and robust tests.

## Test Configuration

### Technology Stack

- **Jest**: Test runner with `jest-expo` preset
- **React Native Testing Library**: Component testing utilities
- **jest-expo**: Expo-specific Jest configuration
- **Location**: `apps/native/src/**/__tests__/**/*.test.tsx`

### Key Configuration Files

- `jest.config.cjs`: Main Jest configuration with Expo-compliant `transformIgnorePatterns`
- `jest.setup.js`: Global mocks for Expo modules and React Native components
- `jest.setup.console.js`: Console suppression for known warnings

## Writing Tests

### Test File Structure

```typescript
import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeTruthy();
  });
});
```

### Query Priority (Follow This Order)

1. **getByText**: For visible text content
2. **getByPlaceholderText**: For TextInput elements
3. **getByDisplayValue**: For form elements with values
4. **getByRole**: For semantic elements (buttons, headers, etc.)
5. **getByTestId**: Last resort for elements without semantic meaning

### Preferred Patterns

#### ✅ DO: Use screen.* queries

```typescript
// GOOD
renderWithProviders(<Component />);
expect(screen.getByText("Hello")).toBeTruthy();

// BAD
const { getByText } = renderWithProviders(<Component />);
expect(getByText("Hello")).toBeTruthy();
```

#### ✅ DO: Use semantic queries for interactive elements

```typescript
// Component with accessibility props
<TouchableOpacity
  role="button"
  aria-label="Submit form"
  testID="submit-button"
>
  <Text>Submit</Text>
</TouchableOpacity>

// Test using semantic queries
expect(screen.getByRole("button", { name: "Submit form" })).toBeTruthy();
// OR
expect(screen.getByText("Submit")).toBeTruthy();
```

#### ✅ DO: Use getByPlaceholderText for inputs

```typescript
// Component
<TextInput placeholder="Enter your name" />

// Test
expect(screen.getByPlaceholderText("Enter your name")).toBeTruthy();
```

#### ⚠️ ACCEPTABLE: Use testID when no semantic alternative exists

```typescript
// For structural elements without text or semantic meaning
<View testID="progress-fill" style={{ width: '50%' }} />

// Test
expect(screen.getByTestId("progress-fill")).toBeTruthy();
```

### Handling Async Operations

```typescript
it("loads data and displays", async () => {
  renderWithProviders(<DataComponent />);
  
  // Use findBy* for async elements
  const data = await screen.findByText("Loaded Data");
  expect(data).toBeTruthy();
});
```

### Event Handling

```typescript
it("handles button press", () => {
  const onPress = jest.fn();
  renderWithProviders(<Button onPress={onPress} title="Click me" />);
  
  fireEvent.press(screen.getByText("Click me"));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

## Component Accessibility

### Add Accessibility Props to Components

Make components testable and accessible by adding semantic props:

```typescript
// Button component
<TouchableOpacity
  role="button"
  aria-label={label}
  accessibilityState={{ disabled: isDisabled }}
  testID={testID}
  onPress={onPress}
>
  <Text>{label}</Text>
</TouchableOpacity>

// Input component
<TextInput
  placeholder="Search..."
  aria-label="Search field"
  value={value}
  onChangeText={onChange}
/>
```

### Benefits

1. **Better Tests**: Can use semantic queries instead of testIDs
2. **Screen Reader Support**: Improves accessibility for users
3. **Self-Documenting**: Components describe their purpose

## Test Organization

### File Location

Place tests alongside the code they test:

```
src/components/
├── MyComponent.tsx
└── __tests__/
    └── MyComponent.test.tsx
```

### Test Descriptions

Use descriptive test names that explain behavior:

```typescript
describe("UserProfile", () => {
  it("displays user name when user is logged in", () => {});
  it("shows login prompt when user is not authenticated", () => {});
  it("navigates to edit screen when edit button is pressed", () => {});
});
```

## Mocking

### Global Mocks (jest.setup.js)

The following are automatically mocked:

- Expo modules (expo-image, expo-location, etc.)
- React Native components (FlatList, Animated, etc.)
- Third-party libraries (react-native-reanimated, react-native-gesture-handler)

### Component-Specific Mocks

Mock dependencies in your test file:

```typescript
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));
```

## Common Patterns

### Testing with Providers

Always use `renderWithProviders` which wraps components with necessary context:

```typescript
import { renderWithProviders } from "../helpers/renderWithProviders";

// This automatically provides:
// - QueryClientProvider for React Query
// - SafeAreaProvider for safe area insets
renderWithProviders(<MyComponent />);
```

### Testing Rerender

```typescript
it("updates when props change", () => {
  const view = renderWithProviders(<Component value="initial" />);
  expect(screen.getByText("initial")).toBeTruthy();
  
  view.rerender(<Component value="updated" />);
  expect(screen.getByText("updated")).toBeTruthy();
});
```

## Running Tests

```bash
# Run all tests
cd apps/native && bun run test

# Run tests in CI mode (no watch)
cd apps/native && bun run test:ci

# Run specific test file
cd apps/native && bunx jest --testPathPatterns="MyComponent.test.tsx"

# Run with coverage
cd apps/native && bun run test:coverage
```

## Resources

- [Expo Testing Documentation](https://docs.expo.dev/develop/unit-testing/)
- [Expo Router Testing](https://docs.expo.dev/router/reference/testing/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/)

## Migration Notes

Recent improvements to test compliance:

1. ✅ Updated Jest configuration with Expo-compliant patterns
2. ✅ Removed react-test-renderer dependencies
3. ✅ Migrated 25+ files to use `screen.*` queries
4. ✅ Added accessibility props to components (AdminTile, GroupCard)
5. ✅ Created Expo Router testing infrastructure

## Questions?

Refer to existing tests in `src/components/__tests__` for examples of established patterns.
