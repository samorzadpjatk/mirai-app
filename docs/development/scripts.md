# Development Scripts

## Overview

This document lists all available development scripts across the monorepo.

## Root Scripts

Run from the repository root:

```bash
# Development
nx run-many -t dev              # Start all dev servers
nx run-many -t dev --projects='apps/backend-server'  # Start backend server only
nx run-many -t dev --projects='apps/native'             # Start native app only
nx run-many -t dev --projects='apps/notification-sender'  # Start notification sender

# Building
nx run-many -t build            # Build all packages and apps
nx run-many -t build --projects='packages/*'          # Build packages only

# Code Quality
nx run-many -t lint             # Lint all packages
nx run-many -t typecheck      # Type-check all packages
nx run-many -t format:check   # Check code formatting
nx run-many -t format:write   # Fix code formatting

# Unused Dependencies
nx run-many -t knip             # Detect unused dependencies

# Docker Containers
nx run-many -t container        # Build all Docker containers

# Cleanup
nx run-many -t clean            # Clean build artifacts and node_modules
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
nx run-many -t lint
nx run-many -t format:check

# Fix all files
nx run-many -t lint:fix
nx run-many -t format:write

# Check specific package
nx run @mirai-app/orpc:lint
```

## Testing

```bash
# Run all tests
nx run-many -t test

# Run tests for specific package
nx run @mirai-app/orpc:test

# Watch mode
cd packages/orpc && bun run test:watch
```

## Building

```bash
# Build everything
nx run-many -t build

# Build specific package with dependencies
nx run @mirai-app/orpc:build

# Build packages only
nx run-many -t build --projects='packages/*'
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

## Nx Project Targeting

Use `nx run` for single projects and `nx run-many` with `--projects` for groups:

```bash
# Run script in specific package
nx run @mirai-app/native:dev

# Run script in package and its dependencies
nx run @mirai-app/native:build

# Run script in package and its dependents
nx run @mirai-app/orpc:build

# Run script in packages only
nx run-many -t lint --projects='packages/*'
```

## Nx Graph and Project Inspection

```bash
# Show dependency graph
nx graph

# Show project details
nx show project @mirai-app/native

# Show all projects
nx show projects

# Run on changed projects (CI)
nx affected -t build
```

## Troubleshooting

### Script Not Found

If a script is not found:
1. Check you're in the right directory
2. Verify the script exists in `package.json`
3. Run `bun install` to ensure dependencies are available

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset

# Run without cache
nx run-many -t build --skip-nx-cache
```
