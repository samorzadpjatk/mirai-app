[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](README_PL.md)<br>
[![AGPLv3](https://img.shields.io/badge/License-AGPLv3-blue)](LICENSE)
<img width="1440" height="565" alt="mirai_app_banner" src="https://github.com/user-attachments/assets/88e9e651-ec6d-458f-b650-4a351b1bb534" />
<div align="center">
<h1>MIRAI</h1>
<b>PJATK Student Government Mobile Application</b>
<p>also known as: Project <code>PJApp</code></p>
<p>Currently a trip application prepared for integration trips<br>Will eventually become a general Student Government application for all students</p>
</div>

<br>

## Want to join?

Check out the [collaboration guidelines inside the repo](CONTRIBUTING.md)!

> [!IMPORTANT]
> **Call for Mainteiners**
> 
> We are looking for maintainers to take over the project. 
> If you are interested, please contact the PJAIT's Student Council.

## Project Structure

The repository currently functions as a monorepo implemented using **Turborepo** for code build orchestration and **Bun workspaces** (Bun as package manager) for package management.

Check their configuration details inside [`turbo.json`](turbo.json) and [`bun.lock`](bun.lock)

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

All scripts can be called from the project root using `bun run <script>`. (You can also go to a specific package and run `bun run <script>`).

To run a script assigned to a specific component, use `bun run` (or `cd <package> && bun run <script>`):
```bash
cd apps/native && bun run dev
```

## Technical Requirements

Make sure you have installed:

- **Node.js** (version 18 or higher)
- **Bun** (https://bun.sh)
- **Docker** (for development environment, including Supabase)

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

### 3. Run the development environment

Check its [documentation](environment/dev/README.md)

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

### 5. Run the selected application

Before running:
- check the documentation of the [native application](apps/native/README.md) and [backend](apps/backend-server/README.md)

#### `bun run dev`

Runs all applications in development mode simultaneously:

- Backend server on `http://localhost:2022`
- Native app (Expo dev server)
- Notification sender service

#### `bun run dev:backend`

Runs only the backend server (Fastify + tRPC) in development mode (default port 2022).

#### `bun run dev:native`

Runs only the native application (Expo dev server).

#### `bun run dev:notification-sender`

Runs only the notification sender service for push notifications.