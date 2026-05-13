# Development Scripts

## Overview

This document lists all available development scripts across the monorepo.

## Root Scripts

Run from the repository root:

```bash
# Development
turbo run dev              # Start all dev servers
turbo run dev:backend      # Start backend server only
turbo run dev:native       # Start native app only
turbo run dev:notification-sender  # Start notification sender

# Building
turbo run build            # Build all packages and apps
turbo run build:packages   # Build packages only

# Code Quality
turbo run lint             # Lint all packages
turbo run typecheck        # Type-check all packages
turbo run format:check     # Check code formatting
turbo run format:write     # Fix code formatting

# Cleanup
turbo run clean            # Clean build artifacts and node_modules
```

## Package-Level Scripts

### Common Scripts (All Packages)

| Script | Purpose |
|--------|---------|
| `dev` | Start development mode |
| `build` | Production build |
| `lint` | Run ESLint |
| `lint:fix` | Fix ESLint issues |
| `typecheck` | TypeScript validation |
| `test` | Run tests |
| `test:watch` | Run tests in watch mode |
| `clean` | Remove build artifacts |

### Native App (@mirai-app/native)

| Script | Purpose |
|--------|---------|
| `dev` | Start Expo development server |
| `android` | Run on Android emulator |
| `ios` | Run on iOS simulator |
| `web` | Run in web browser |
| `build` | Export for production |
| `release:android:*` | Android release via Fastlane |
| `release:ios:*` | iOS release via Fastlane |

### Backend Server (@mirai-app/backend-server)

| Script | Purpose |
|--------|---------|
| `dev` | Start dev server with hot reload |
| `start` | Start production server |
| `check` | Run lint + typecheck |
| `test` | Run test suite |
| `test:watch` | Run tests in watch mode |

### Seed App (@mirai-app/seed)

| Script | Purpose |
|--------|---------|
| `db:seed:dev` | Seed dev database |
| `db:seed:prod` | Seed prod database |
| `db:generate` | Generate Drizzle migrations |
| `db:migrate` | Run migrations |
| `db:migrate:dev` | Run dev migrations |
| `db:migrate:prod` | Run prod migrations |
| `db:push:dev` | Push schema to dev database |
| `db:push:prod` | Push schema to prod database |
| `db:reset:dev` | Reset dev database |
| `db:reset:prod` | Reset prod database |
| `db:studio:dev` | Open Drizzle Studio (dev) |
| `db:studio:prod` | Open Drizzle Studio (prod) |
| `db:format` | Format Drizzle schema |

## Database Scripts

Database operations are managed through the seed app:

```bash
cd apps/seed

# Migrations
bun run db:migrate:dev     # Run dev migrations
bun run db:migrate:prod    # Run prod migrations
bun run db:migrate:deploy  # Deploy pending migrations

# Schema changes
bun run db:push:dev        # Push schema to dev (for prototyping)
bun run db:push:prod       # Push schema to prod

# Database management
bun run db:reset:dev       # Reset dev database
bun run db:seed:dev        # Seed dev database
bun run db:studio:dev      # Open Drizzle Studio

# Client generation
bun run db:generate        # Generate Drizzle migrations
```

## Linting and Formatting

```bash
# Check all files
turbo run lint
turbo run format:check

# Fix all files
turbo run lint:fix
turbo run format:write

# Check specific package
turbo run lint --filter=@mirai-app/orpc
```

## Testing

```bash
# Run all tests
turbo run test

# Run tests for specific package
turbo run test --filter=@mirai-app/orpc

# Watch mode
cd packages/trpc && bun run test:watch
```

## Building

```bash
# Build everything
turbo run build

# Build specific package with dependencies
turbo run build --filter=@mirai-app/orpc...

# Build packages only
turbo run build --filter='./packages/*'
```

## Script Patterns

### Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `dev` | Development mode | `bun run dev` |
| `build` | Production build | `bun run build` |
| `db:*` | Database operations | `bun run db:migrate` |
| `release:*` | Release operations | `bun run release:android:build` |
| `*:*:dev` | Dev environment | `bun run db:seed:dev` |
| `*:*:prod` | Prod environment | `bun run db:seed:prod` |

### Environment Suffixes

Many scripts have environment-specific versions:

- `:dev` - Development environment
- `:prod` - Production environment

## Turbo Filters

Use `--filter` to target specific packages:

```bash
# Run script in specific package
turbo run dev --filter=@mirai-app/native

# Run script in package and its dependencies
turbo run build --filter=@mirai-app/native...

# Run script in package and its dependents
turbo run build --filter=@mirai-app/orpc^

# Run script in packages only
turbo run lint --filter='./packages/*'
```

## Troubleshooting

### Script Not Found

If a script is not found:
1. Check you're in the right directory
2. Verify the script exists in `package.json`
3. Run `bun install` to ensure dependencies are available

### Turbo Cache Issues

```bash
# Clear turbo cache
rm -rf .turbo

# Run without cache
turbo run build --force
```
