[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](README_PL.md)<br>
[![AGPLv3](https://img.shields.io/badge/License-AGPLv3-blue)](LICENSE)
<img width="1440" height="565" alt="mirai_app_banner" src="https://github.com/user-attachments/assets/88e9e651-ec6d-458f-b650-4a351b1bb534" />

<div align="center">
<h1>MIRAI</h1>
<b>PJATK Student Government Mobile Application</b>
<p>also known as: Project <code>PJApp</code></p>
<p>A trip application for integration trips.<br>Expanding soon into a general Student Government application for all students.</p>
</div>

<br>

## Want to join?

Read the [collaboration guidelines](CONTRIBUTING.md).

> [!IMPORTANT]
> **Call for Mainteiners**
>
> We are looking for maintainers to take over the project.
> If you are interested, please contact the PJAIT's Student Council.

## Project Structure

This monorepo uses **Turborepo** for builds and **Bun workspaces** for package management.

See [`turbo.json`](turbo.json) and [`bun.lock`](bun.lock) for configuration details.

It contains:

- **Native application** (Expo / React Native) → [`@mirai-app/native`](apps/native/)
- **Backend server** (Fastify + tRPC) → [`@mirai-app/backend-server`](apps/backend-server/)
- **Notification sender** (Expo Push Notifications) → [`@mirai-app/notification-sender`](apps/notification-sender/)
- **Seed CLI** (Database & Storage seeding) → [`@mirai-app/seed`](apps/seed/)
- **Shared packages** → [`packages`](packages/)
  - [`@mirai-app/auth`](packages/auth/) - Authentication logic
  - [`@mirai-app/db`](packages/db/) - Prisma database client
  - [`@mirai-app/shared`](packages/shared/) - Shared utilities
  - [`@mirai-app/supabase`](packages/supabase/) - Supabase client configuration

Run scripts from the project root with `bun run <script>`, or from a specific package with `cd <package> && bun run <script>`:

```bash
cd apps/native && bun run dev
```

## Technical Requirements

Install:

- **Node.js** 18+
- **Bun** (https://bun.sh)
- **Docker** (for Supabase and the development environment)

## How to start?

### 1. Clone the repository

```bash
git clone <repository-url>
cd integral-app
```

### 2. Install dependencies

```bash
bun install
```

### 3. Start the development environment

Read the [development environment documentation](environment/dev/README.md).

### 4. Prepare the database schema

```bash
# Generate Prisma client
cd packages/seed && bun run db:generate

# Push the schema to the database
cd packages/seed && bun run db:push

# Optional: Open Prisma Studio to view the database
cd packages/seed && bun run db:studio
```

> 📖 **More information about database commands**: See [packages/seed/README.md](packages/seed/README.md)

### 5. Start the application

Before starting, read the [native application](apps/native/README.md) and [backend](apps/backend-server/README.md) documentation.

#### `bun run dev`

Runs all applications simultaneously:

- Backend server at `http://localhost:2022`
- Native app (Expo dev server)
- Notification sender service

#### `bun run dev:backend`

Runs only the backend server (Fastify + tRPC) at port 2022.

#### `bun run dev:native`

Runs only the native application (Expo dev server).

#### `bun run dev:notification-sender`

Runs only the notification sender service for push notifications.

## Testing

### Quick Start

Run all tests:

```bash
bun test
```

Run only unit tests (fast, isolated):

```bash
bun run test:unit
```

Run only integration tests (slower, requires external services):

```bash
bun run test:integration
```

### Test Organization

Tag conventions:

- `[UNIT]` - Pure business logic (fast)
- `[INTEGRATION]` - Tests with external services (database, APIs)

### Running Tests by Package

```bash
# Domain layer (pure unit tests)
cd packages/domain && bun test

# Use cases (pure unit tests)
cd packages/use-cases && bun test

# Adapters (mixed - can run separately)
cd packages/adapters && bun run test:unit
cd packages/adapters && bun run test:integration
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.
