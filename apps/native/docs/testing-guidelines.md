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

- `jest.config.cjs`: Main Jest configuration with Expo-compliant `transformIgnorePatterns` and ESM support for Jest 30+
- `jest.setup.js`: Minimal setup with `@testing-library/jest-native` extensions
- `babel.config.cjs`: Babel configuration with test environment preset for module transformation

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

### Component-Specific Mocks

Mock dependencies in your test file as needed:

```typescript
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();

jest.mock("expo-secure-store", () => ({
  getItemAsync: (...args: [string]) => mockGetItemAsync(...args),
  setItemAsync: (...args: [string, string]) => mockSetItemAsync(...args),
  deleteItemAsync: jest.fn(),
}));

describe("MyComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use secure storage", async () => {
    mockGetItemAsync.mockResolvedValue("stored-value");
    // Test code...
  });
});
```

For router mocks:

```typescript
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));
```

> **Note**: The native app uses Jest (`jest.mock`, `jest.fn()`). Other packages in the monorepo use Vitest (`vi.mock`, `vi.fn()`).

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

### Adding testIDs for Reliable Queries

When components use nested `Pressable` elements or when `UNSAFE_getByType` fails, add `testID` attributes:

```typescript
// Component implementation
<Pressable testID="modal-overlay" onPress={onClose}>
  <Pressable testID="modal-content" onPress={stopPropagation}>
    {children}
  </Pressable>
</Pressable>

// Test
fireEvent.press(screen.getByTestId("modal-overlay"));
expect(screen.getByTestId("modal-content")).toBeTruthy();
```

**Components with added testIDs:**
- `DateTimePickerModal` - `datetime-picker-overlay`, `datetime-picker-card`
- `FullScreenModal` - `fullscreen-modal-close`
- `AppModalShell` - `app-modal-overlay`, `app-modal-content`
- `ThemedListItem` - `themed-list-item-pressable`

### Mocking Alert.alert with Callbacks

When testing components that show Alert dialogs with buttons:

```typescript
const mockAlert = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // Connect mockAlert to the spy
  jest.spyOn(Alert, 'alert').mockImplementation(mockAlert);
});

// For testing Alert button callbacks
jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
  const destructiveButton = buttons?.find((b) => b.style === "destructive");
  if (destructiveButton?.onPress) {
    destructiveButton.onPress();
  }
});
```

> **Note**: The native app uses Jest (`jest.spyOn`, `jest.clearAllMocks()`). Other packages use Vitest (`vi.spyOn`, `vi.clearAllMocks()`).

### Testing Philosophy: Behavior Over Implementation

**❌ Don't test implementation details:**
```typescript
// BAD - Tests internal props that can change
expect(button.props.activeOpacity).toBe(0.7);
expect(pressable.props.style[1].opacity).toBe(0.5);
```

**✅ Do test user-facing behavior:**
```typescript
// GOOD - Tests what users see and do
await user.press(button);
expect(onPress).toHaveBeenCalledTimes(1);
expect(screen.getByText("Success")).toBeTruthy();
```

When you find yourself checking internal props, reconsider: "What is the user trying to accomplish?" Test that instead.

### Handling Style Assertions

Styles in React Native can be arrays or objects. Use flexible matchers:

```typescript
// Flexible - works with both arrays and objects
expect(element.props.style).toMatchObject({
  backgroundColor: "red",
});
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

## Configuration Notes

### Jest 30+ Compatibility

The Jest configuration has been updated for Jest 30+ compatibility with Bun's `.bun/` cache structure:

1. **transformIgnorePatterns**: Uses pattern matching that works with nested node_modules paths
2. **babel.config.cjs**: Test environment preset properly transforms ES modules to CommonJS
3. **react-test-renderer**: Version aligned with React version (19.2.0)

### Troubleshooting

For common test issues, see the comprehensive [Common Test Failure Patterns and Solutions section in TESTING.md](../../../TESTING.md), which includes:

- `UNSAFE_getByType(Pressable)` returning "No instances found"
- `Alert.alert` mocks not being called
- Testing implementation details vs. behavior
- Data attributes in React Native mocks
- Style assertion issues with arrays vs objects

## Questions?

Refer to existing tests in `src/components/__tests__` for examples of established patterns.
