# @mirai-app/shared

Utilities and types for the MIRAI app monorepo.

## Overview

This package provides:

- **Storage utilities** - File storage standards and configurations
- **State management** - Zustand stores for auth, map, and judgement state
- **Trip information** - Trip data types and utilities
- **Shared exports** - Centralized access to all shared functionality

## Structure

```
packages/shared/
├── src/
│   ├── storage/       # Storage utilities and standards
│   ├── stores/        # Zustand stores for shared state
│   ├── tripInfo/      # Trip data types and utilities
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

const result = sharedUtility.someFunction();
```

## Development

Develop this package alongside others in the monorepo. Changes affect all applications.

## Documentation

- [Monorepo Documentation](../../README.md)
- [Bun Documentation](https://bun.com)
