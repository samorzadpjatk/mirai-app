# @mirai-app/shared

Shared utilities and types used across the MIRAI app monorepo.

## Overview

This package contains common functionality that is shared between different applications and packages in the monorepo, including:

- **Storage utilities** - File storage standards and configurations
- **State management** - Zustand stores for shared application state (auth, map, judgement)
- **Trip information** - Types and utilities specific to trip data
- **Shared exports** - Centralized access to all shared functionality

## Structure

```
packages/shared/
├── src/
│   ├── storage/       # Storage-related utilities and standards
│   ├── stores/        # Zustand stores for shared state management
│   ├── tripInfo/      # Trip information types and utilities
│   └── index.ts       # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
bun install
```

## Usage

```typescript
import { sharedUtility, SharedType } from "@mirai-app/shared";

// Example usage
const result = sharedUtility.someFunction();
```

## Development

This package is part of the monorepo and should be developed in conjunction with other packages. Changes here can affect multiple applications.

## More Information

- [Monorepo Documentation](../../README.md)
- [Bun Documentation](https://bun.com)
