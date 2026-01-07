# @integral-2025-app/common-utils

Common utility functions shared across the Integral 2025 App monorepo.

## Features

### Resilience Utilities

#### `executeWithRetry`

A utility function for executing asynchronous operations with automatic retry logic and exponential backoff.

**Usage:**

```typescript
import { executeWithRetry } from "@integral-2025-app/common-utils";

// Basic usage
const result = await executeWithRetry(async () => {
  // Your async operation
  return await fetchData();
});

// With error handling
const result = await executeWithRetry(
  async () => await fetchData(),
  (error, retryAttempt) => {
    console.error(`Attempt ${retryAttempt + 1} failed:`, error);
  },
);

// With custom retry configuration
const result = await executeWithRetry(
  async () => await fetchData(),
  (error, attempt) => console.error(`Error on attempt ${attempt}:`, error),
  undefined, // Result validation function (optional)
  3, // Max retries (default: 5)
  500, // Initial delay in ms (default: 1000)
);
```

**Parameters:**

- `toExecute`: The async function to execute
- `onError`: Optional callback invoked on each error with (error, retryAttempt)
- `isValidResult`: Optional validation function to check if result is acceptable
- `maxRetriesCount`: Maximum number of retry attempts (default: 5)
- `delayInMs`: Initial delay between retries in milliseconds (default: 1000)

**Features:**

- Exponential backoff with jitter to prevent thundering herd
- Configurable via environment variables:
  - `DEFAULT_MAX_RETRIES_COUNT`: Default maximum retries
  - `DEFAULT_DELAY_MS`: Default initial delay
- Error callbacks for logging and monitoring
- Result validation for custom success criteria

**Example in notification-sender:**

```typescript
import { executeWithRetry } from "@integral-2025-app/common-utils";

const tickets = await executeWithRetry(
  () => expo.sendPushNotificationsAsync(chunk),
  (err, retryAttempt) => {
    console.error(
      `Error sending push notification chunk (attempt ${retryAttempt + 1}):`,
      err,
    );
  },
  undefined,
  3, // Max 3 retries for push notifications
  500, // Start with 500ms delay
);
```

## Installation

This package is part of the monorepo and uses workspace dependencies:

```json
{
  "dependencies": {
    "@integral-2025-app/common-utils": "workspace:*"
  }
}
```

## Development

```bash
# Type checking
pnpm typecheck

# Build
pnpm build

# Lint
pnpm lint
```
