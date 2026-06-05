# Skill: Empty State Handling in React Native

## Overview

This skill covers patterns for handling empty, loading, error, and success states in React Native applications. It focuses on crash prevention, consistent UX, testable component design, error boundary protection, and automated code quality enforcement.

**Applies to**: Expo React Native, React Native (non-Expo), React Native Web
**Tech stack context**: React Query / TanStack Query, React Native Testing Library, MSW

---

## 1. The React Native Falsy Value Crash

### The Problem
React Native crashes when `0` or `""` are rendered outside `<Text>` components:

```tsx
// ❌ CRASH: "Text strings must be rendered within a <Text> component"
<View>
  {count && <Badge count={count} />}  {/* crashes if count = 0 */}
  {name && <Text>Hello {name}</Text>}  {/* crashes if name = "" */}
</View>
```

### Why It Happens
React Native's reconciler treats `0` and `""` as text nodes. Unlike web React, which silently ignores them, React Native enforces the `<Text>` wrapper rule.

### Safe Patterns

```tsx
// ✅ Safe: explicit boolean conversion
{!!count && <Badge count={count} />}
{Boolean(name) && <Text>Hello {name}</Text>}

// ✅ Safe: ternary with null fallback
{count ? <Badge count={count} /> : null}
{name ? <Text>Hello {name}</Text> : null}

// ✅ Safe: nullish coalescing for defaults
const items = data ?? [];
const displayName = userName ?? "Anonymous";
const count = rawCount ?? 0;

// ✅ Safe: inside <Text> only
<Text>{subtitle && subtitle}</Text>  {/* empty string is valid text child */}

// ✅ Safe: style arrays (React Native handles this)
style={[styles.base, isActive && styles.active]}
```

### Rule
**Never use `&&` for conditional rendering inside `<View>` or at root JSX level unless the left side is guaranteed boolean.**

---

## 2. The 4-State UI Pattern

Every data-driven screen MUST handle these four states in strict order:

```
1. LOADING    → Skeleton or LoadingScreen (early return)
2. ERROR      → ErrorState with retry action (early return)
3. EMPTY      → EmptyState with contextual guidance (early return or inline)
4. SUCCESS    → Actual content
```

### Implementation Template

```tsx
export function DataScreen() {
  const query = useQuery({ queryKey: ["items"], queryFn: fetchItems });

  // 1. LOADING
  if (query.isLoading) {
    return <ItemsLoadingState />;  // domain-specific skeleton
  }

  // 2. ERROR
  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load items"
        message={query.error?.message ?? "Something went wrong"}
        onRetry={query.refetch}
      />
    );
  }

  // 3. EMPTY
  const items = query.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon="list"
        title="No items yet"
        subtitle="Pull down to refresh or check back later"
      />
    );
  }

  // 4. SUCCESS
  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      ListEmptyComponent={/* fallback, though empty is handled above */}
    />
  );
}
```

### Why This Order
- **Loading first**: Users expect immediate feedback; don't show stale data while loading
- **Error before empty**: An error is not the same as empty data; conflating them confuses users
- **Empty before success**: Prevents rendering blank content areas or broken layouts

---

## 3. EmptyState Component Design

### Reusable EmptyState

```tsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  iconSize?: number;
  iconColor?: string;
  iconOpacity?: number;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  iconSize = 48,
  iconColor = colors.textSecondary,
  iconOpacity = 0.5,
  title,
  subtitle,
  style,
}: EmptyStateProps) {
  return (
    <View testID="empty-state-container" style={[styles.container, style]}>
      {!!icon && (
        <View testID="empty-state-icon-wrapper" style={[styles.icon, { opacity: iconOpacity }]}>
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
```

### Design Principles
- **Icon**: Optional, uses muted opacity (0.5) to avoid visual competition
- **Title**: Bold, white/light, concise (2-4 words)
- **Subtitle**: Muted color, descriptive, suggests next action
- **testID**: `empty-state-container`, `empty-state-icon-wrapper`
- **Safe rendering**: Uses `!!icon` and ternary for `subtitle`

---

## 4. ErrorState Component Design

### Reusable ErrorState

```tsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <View testID="error-state-container" style={styles.container}>
      <Ionicons name="warning-outline" size={48} color={colors.error} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {!!onRetry && (
        <TouchableOpacity
          testID="error-state-retry"
          onPress={onRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Design Principles
- **Icon**: Warning icon in error color
- **Title**: Non-technical, user-friendly
- **Message**: Can include technical detail for debugging or friendly explanation
- **Retry**: Primary CTA button, only shown if `onRetry` is provided
- **testID**: `error-state-container`, `error-state-retry`
- **Safe rendering**: Uses `!!onRetry` for conditional button

---

## 5. ListEmptyComponent for FlatList/SectionList

### Rule
All `FlatList` and `SectionList` MUST have `ListEmptyComponent` to prevent blank screens.

### Pattern

```tsx
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={
    <EmptyState
      icon="list"
      title="No items found"
      subtitle="Pull down to refresh or check back later"
    />
  }
  ListFooterComponent={
    isFetchingNextPage ? (
      <View style={{ alignItems: "center", padding: spacing.md }}>
        <ActivityIndicator size="small" />
        <Text>Loading more...</Text>
      </View>
    ) : null
  }
/>
```

### Exception
Lists inside Modals already guarded by an outer conditional (e.g., modal only opens when `hasData` is true) may skip `ListEmptyComponent` if documented with an inline comment:

```tsx
// ListEmptyComponent omitted: modal only renders when hasAnySubmissions is true
<FlatList data={submissions} renderItem={renderItem} />
```

---

## 6. Skeleton Loading State Patterns

### Why Skeletons Over Spinners
- **Perceived performance**: Skeletons match final content layout, reducing cognitive load
- **Reduced layout shift**: Content "fills in" rather than popping in after spinner disappears
- **Better UX**: Users understand WHERE content will appear

### Skeleton Component Template

```tsx
import { StyleSheet, View } from "react-native";

export function ItemsLoadingState() {
  return (
    <View testID="items-loading-state" style={styles.container}>
      {/* Repeat placeholder rows to match expected content */}
      <PlaceholderCard />
      <PlaceholderCard />
      <PlaceholderCard />
    </View>
  );
}

function PlaceholderCard() {
  return (
    <View style={styles.card}>
      <View style={styles.placeholderTitle} />
      <View style={styles.placeholderLine} />
      <View style={styles.placeholderLineShort} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  placeholderTitle: {
    height: 20,
    width: "60%",
    backgroundColor: colors.placeholder,
    borderRadius: borderRadius.sm,
  },
  placeholderLine: {
    height: 14,
    width: "100%",
    backgroundColor: colors.placeholder,
    borderRadius: borderRadius.sm,
  },
  placeholderLineShort: {
    height: 14,
    width: "40%",
    backgroundColor: colors.placeholder,
    borderRadius: borderRadius.sm,
  },
});
```

### Skeleton Standards
- **testID**: All skeletons MUST have `testID="*-loading-state"`
- **Background**: Use consistent background color (`colors.backgroundDark`)
- **Layout match**: Skeleton structure should mirror actual content structure
- **Shimmer**: Consider `react-native-reanimated` or `react-native-shimmer-placeholder` for shimmer effects
- **No spinners**: Avoid generic `ActivityIndicator` when domain-specific skeleton is possible

---

## 7. Error Boundary Patterns

### The Problem
Without error boundaries, a single component crash can take down an entire screen or tab. React Native shows the red error screen in development and a frozen/broken UI in production.

### Error Boundary Implementation
React still requires class components for error boundaries. There is no hook equivalent.

```tsx
import React, { Component, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to Sentry or other error reporting service
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorState
            title="Something went wrong"
            message={this.state.error?.message}
            onRetry={() => this.setState({ hasError: false })}
          />
        )
      );
    }
    return this.props.children;
  }
}
```

### Usage in Navigation
Wrap each major screen or tab area:

```tsx
// app/(tabs)/trips/_layout.tsx
import { ErrorBoundary } from "~/components/common/ui/ErrorBoundary";

export default function TripsLayout() {
  return (
    <ErrorBoundary>
      <Stack />
    </ErrorBoundary>
  );
}
```

### ErrorState vs ErrorBoundary
| Aspect | ErrorState | ErrorBoundary |
|--------|-----------|---------------|
| Purpose | Expected errors (API, network) | Unexpected errors (runtime crashes) |
| Trigger | Developer explicitly renders | React automatically catches |
| Retry | `query.refetch()` | `setState({ hasError: false })` |
| Example | `query.isError` | Component throws during render |

### Limitations
- Error boundaries do NOT catch:
  - Event handler errors (use try/catch)
  - Async code errors (use try/catch or .catch())
  - Native module errors (use native crash reporters)
  - Errors in the error boundary itself

---

## 8. Testing Strategies for Empty States

### Unit Tests for EmptyState Component

```tsx
import { render, screen } from "@testing-library/react-native";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and subtitle", () => {
    render(<EmptyState title="No items" subtitle="Check back later" />);
    expect(screen.getByText("No items")).toBeOnTheScreen();
    expect(screen.getByText("Check back later")).toBeOnTheScreen();
  });

  it("hides subtitle when not provided", () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByText("Check back later")).not.toBeOnTheScreen();
  });

  it("renders icon when provided", () => {
    render(<EmptyState title="No items" icon="list" />);
    expect(screen.getByTestId("empty-state-icon-wrapper")).toBeOnTheScreen();
  });

  it("does not crash with empty string subtitle", () => {
    render(<EmptyState title="No items" subtitle="" />);
    expect(screen.getByText("No items")).toBeOnTheScreen();
    expect(screen.queryByText("")).not.toBeOnTheScreen();
  });
});
```

### Unit Tests for ErrorState Component

```tsx
describe("ErrorState", () => {
  it("renders with default title and message", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeOnTheScreen();
  });

  it("renders custom title and message", () => {
    render(<ErrorState title="Failed" message="Network error" />);
    expect(screen.getByText("Failed")).toBeOnTheScreen();
    expect(screen.getByText("Network error")).toBeOnTheScreen();
  });

  it("hides retry button when onRetry is undefined", () => {
    render(<ErrorState />);
    expect(screen.queryByTestId("error-state-retry")).not.toBeOnTheScreen();
  });

  it("shows retry button and calls handler on press", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<ErrorState onRetry={onRetry} />);

    await user.press(screen.getByTestId("error-state-retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});
```

### Integration Tests for 4-State Pattern (with MSW)

```tsx
import { server, createORPCHandler, resetHandlers } from "~/test-utils/msw/server";
import { renderHookWithMSW } from "~/test-utils/msw/test-wrapper";
import { DataScreen } from "./DataScreen";

beforeAll(() => server.listen());
afterEach(() => resetHandlers());
afterAll(() => server.close());

describe("DataScreen states", () => {
  it("shows loading state initially", () => {
    render(<DataScreen />);
    expect(screen.getByTestId("items-loading-state")).toBeOnTheScreen();
  });

  it("shows error state on failure", async () => {
    server.use(
      createORPCHandler(["items", "getAll"], () => {
        throw new Error("Network error");
      }),
    );
    render(<DataScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("error-state-container")).toBeOnTheScreen(),
    );
  });

  it("shows empty state when no data", async () => {
    server.use(createORPCHandler(["items", "getAll"], () => []));
    render(<DataScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("empty-state-container")).toBeOnTheScreen(),
    );
  });

  it("shows success state with data", async () => {
    server.use(createORPCHandler(["items", "getAll"], () => [{ id: "1", name: "Item 1" }]));
    render(<DataScreen />);
    await waitFor(() => expect(screen.getByText("Item 1")).toBeOnTheScreen());
  });
});
```

### Crash Regression Tests

```tsx
describe("Crash prevention", () => {
  it("EmptyState with empty string subtitle does not crash", () => {
    render(<EmptyState title="Title" subtitle="" />);
    expect(screen.getByText("Title")).toBeOnTheScreen();
  });

  it("AdminHeader with empty string subtitle does not crash", () => {
    render(<AdminHeader title="Title" subtitle="" />);
    expect(screen.getByText("Title")).toBeOnTheScreen();
  });
});
```

---

## 9. ESLint and Code Quality Rules

### ESLint Rule: `react/jsx-no-leaked-render`

The `eslint-plugin-react` package provides `jsx-no-leaked-render`, which automatically catches risky `&&` patterns:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config(
  // ... existing config ...
  {
    files: ["apps/native/src/**/*.tsx"],
    plugins: { react },
    rules: {
      "react/jsx-no-leaked-render": [
        "error",
        { validStrategies: ["ternary", "coerce"] },
      ],
    },
  },
);
```

### What It Catches
```tsx
// ❌ Flagged by eslint
{count && <Badge />}
{items.length && <List />}
{name && <Text>{name}</Text>}

// ✅ Passes eslint
{!!count && <Badge />}
{items.length > 0 && <List />}
{name ? <Text>{name}</Text> : null}
```

### Code Review Checklist

- [ ] No `&&` conditional rendering inside `<View>` or at root JSX level
- [ ] All `FlatList`/`SectionList` have `ListEmptyComponent`
- [ ] All data-driven screens handle 4 states: Loading, Error, Empty, Success
- [ ] All skeletons have `testID="*-loading-state"`
- [ ] All error states have `testID="error-state-container"`
- [ ] All empty states have `testID="empty-state-container"`
- [ ] `null` and `undefined` never rendered directly outside `<Text>`
- [ ] Array data uses `data ?? []` coalescing
- [ ] Primitive data uses `value ?? default` coalescing
- [ ] Major screen areas wrapped in `ErrorBoundary`

### Documentation Rule

Add to project code quality guidelines:

> **Rule: No `&&` in JSX outside `<Text>`**
> Always use `!!value && <Component />` or `value ? <Component /> : null` when conditionally rendering inside `<View>` or at the root JSX level. The `&&` operator leaks empty strings and `0`, which crash React Native.

---

## 10. Quick Reference: Safe vs Unsafe Patterns

| Pattern | Safe? | Context |
|---------|-------|---------|
| `{value && <Component />}` | ❌ No | Inside `<View>` or root JSX |
| `{!!value && <Component />}` | ✅ Yes | Anywhere |
| `{Boolean(value) && <Component />}` | ✅ Yes | Anywhere |
| `{value ? <Component /> : null}` | ✅ Yes | Anywhere |
| `<Text>{value && "suffix"}</Text>` | ✅ Yes | Inside `<Text>` only |
| `style={[base, condition && active]}` | ✅ Yes | Style arrays only |
| `const items = data ?? []` | ✅ Yes | Default values |
| `{count > 0 && <Component />}` | ✅ Yes | Comparison yields boolean |
| `{items.length && <Component />}` | ❌ No | `.length` can be `0` |
| `{items.length > 0 && <Component />}` | ✅ Yes | Comparison yields boolean |

---

## 11. Related Skills

- **React Query Patterns**: Caching, invalidation, infinite query handling
- **React Native Testing**: Component testing with React Native Testing Library
- **MSW API Mocking**: Simulating API states for integration tests
- **Design System Components**: Building reusable UI component libraries
- **Error Reporting**: Sentry integration for production crash tracking

---

*Skill version: 1.1*
*Created: 2026-06-04*
*Updated: 2026-06-04*
*Applies to: React Native 0.70+, Expo SDK 50+*
