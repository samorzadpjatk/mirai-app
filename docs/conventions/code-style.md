# Code Style Guidelines

## Overview

Code formatting and style conventions for the MIRAI monorepo.

## Tools

- **Linter**: ESLint
- **Formatter**: Prettier
- **Git Hooks**: Husky + lint-staged

## ESLint Configuration

Base configuration at root:

```javascript
// eslint.config.base.js
export default {
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      project: './tsconfig.json',
    },
  },
  plugins: {
    '@typescript-eslint': typescriptPlugin,
  },
  rules: {
    // Error prevention
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Best practices
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Style
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
};
```

## Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## Code Formatting Rules

### Spacing

```typescript
// Good
function greet(name: string): string {
  return `Hello, ${name}`;
}

if (condition) {
  doSomething();
}

// Avoid
function greet(name:string):string{
  return `Hello, ${name}`;
}
```

### Line Length

Maximum 100 characters:

```typescript
// Good
const result = await fetchUser({
  id: userId,
  includeProfile: true,
});

// Break long lines
const message = 'This is a very long message that needs ' +
  'to be broken across multiple lines';
```

### Quotes

Use single quotes:

```typescript
const name = 'John';
const template = `Hello, ${name}`;
```

### Semicolons

Always use semicolons:

```typescript
const x = 1;
const y = 2;
```

### Trailing Commas

Use trailing commas in multi-line:

```typescript
const obj = {
  a: 1,
  b: 2,  // <- trailing comma
};

const arr = [
  1,
  2,  // <- trailing comma
];
```

## Formatting Commands

```bash
# Check formatting
nx run-many -t format:check

# Fix formatting
nx run-many -t format:write

# Lint
nx run-many -t lint

# Fix lint issues
nx run-many -t lint:fix
```

## Git Hooks

Pre-commit automatically runs linting and formatting:

```bash
# .husky/pre-commit
bun run format:write
bun run lint
```

## Organizing Imports

### Group Order

```typescript
// 1. React and external
import React from 'react';
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal packages
import { orpc } from '@mirai-app/orpc/client';
import { colors } from '@mirai-app/shared/design-tokens';

// 3. Relative imports
import { Button } from './components/Button';
import { useAuth } from './hooks/useAuth';

// 4. Types
import type { User } from './types';
```

### Remove Unused

```typescript
// Good
import { useState } from 'react';

// Avoid
import { useState, useEffect } from 'react';  // useEffect not used
```

## Comments

### Use JSDoc for Exports

```typescript
/**
 * Calculates the total price including tax
 * @param price - Base price
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns Total price with tax
 */
function calculateTotal(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
```

### Inline Comments

```typescript
// Good - explains why, not what
// Apply discount for premium users
const finalPrice = isPremium ? price * 0.9 : price;

// Avoid - states the obvious
// Multiply price by 0.9
const discounted = price * 0.9;
```

## Best Practices

1. **Run lint before committing**
2. **Use editor integration** for real-time feedback
3. **Don't disable rules** without good reason
4. **Keep code readable** over clever optimizations
5. **Consistent formatting** across all files

## VS Code Settings

Recommended settings in `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Troubleshooting

### ESLint Errors

```bash
# Clear ESLint cache
rm -rf .eslintcache

# Re-run
bun run lint
```

### Prettier Not Formatting

Check `.prettierignore` and ensure file isn't excluded.

## Further Reading

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
