# Shared Utilities

## Overview

The `@mirai-app/shared` package provides common utilities and design tokens used across the MIRAI application.

## Design Tokens

### Colors

```typescript
import { colors } from '@mirai-app/shared/design-tokens';

// Usage
const primaryColor = colors.primary;
const backgroundColor = colors.background;
```

Available tokens:
- `colors.primary` - Primary brand color
- `colors.secondary` - Secondary brand color
- `colors.background` - Background colors
- `colors.text` - Text colors
- `colors.error` - Error state colors
- `colors.success` - Success state colors

### Spacing

```typescript
import { spacing } from '@mirai-app/shared/design-tokens';

// Usage
const padding = spacing.md;  // 16px
const margin = spacing.lg;   // 24px
```

Available tokens:
- `spacing.xs` - 4px
- `spacing.sm` - 8px
- `spacing.md` - 16px
- `spacing.lg` - 24px
- `spacing.xl` - 32px
- `spacing.xxl` - 48px

### Typography

```typescript
import { typography } from '@mirai-app/shared/design-tokens';

// Usage
const headingStyle = typography.h1;
const bodyStyle = typography.body;
```

Available tokens:
- `typography.h1`, `typography.h2`, `typography.h3` - Headings
- `typography.body` - Body text
- `typography.caption` - Caption text
- `typography.button` - Button text

## Utility Functions

### Date Formatting

```typescript
import { formatDate, formatRelativeTime } from '@mirai-app/shared';

formatDate(new Date(), 'short');     // "Jan 1, 2024"
formatDate(new Date(), 'long');      // "January 1, 2024"
formatRelativeTime(new Date());      // "2 hours ago"
```

### String Utilities

```typescript
import { slugify, truncate, capitalize } from '@mirai-app/shared';

slugify('Hello World');       // "hello-world"
truncate('Long text...', 10); // "Long te..."
capitalize('hello');          // "Hello"
```

### Validation

```typescript
import { isValidEmail, isValidUrl } from '@mirai-app/shared';

isValidEmail('user@example.com');  // true
isValidUrl('https://example.com');  // true
```

## State Management Utilities

### Jotai Atoms

```typescript
import { atomWithQuery } from '@mirai-app/shared';

// Create an atom that fetches data
const userAtom = atomWithQuery((get) => ({
  queryKey: ['user', userId],
  queryFn: fetchUser,
}));
```

### Zustand Store Helpers

```typescript
import { createStore } from '@mirai-app/shared';

const useStore = createStore((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

## Constants

### API Endpoints

```typescript
import { API_ENDPOINTS } from '@mirai-app/shared';

// Usage
fetch(API_ENDPOINTS.users);
```

### Error Messages

```typescript
import { ERROR_MESSAGES } from '@mirai-app/shared';

// Usage
showToast(ERROR_MESSAGES.networkError);
```

## Best Practices

1. **Use design tokens** instead of hardcoding values
2. **Import from specific paths** when tree-shaking matters:
   ```typescript
   import { colors } from '@mirai-app/shared/design-tokens/colors';
   ```
3. **Don't add app-specific logic** here - keep it truly shared
4. **Keep functions pure** for easier testing

## Adding New Utilities

1. Add function to appropriate file in `src/utils/`
2. Export from `src/index.ts`
3. Add JSDoc comments
4. Consider if it belongs in a specific app instead

## Further Reading

- [Jotai Documentation](https://jotai.org/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
