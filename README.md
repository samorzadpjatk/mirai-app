[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](README_PL.md)<br>
[![AGPLv3](https://img.shields.io/badge/License-AGPLv3-blue)](LICENSE)
<img width="1440" height="565" alt="mirai_app_banner" src="https://github.com/user-attachments/assets/88e9e651-ec6d-458f-b650-4a351b1bb534" />
<div align="center">
<h1>MIRAI</h1>
<b>PJAIT Student Government Mobile Application</b>
<p>also known as: Project <code>PJApp</code></p>
<p>Currently a trip application prepared for integration trips<br>Will eventually become a general Student Government application for all students</p>
</div>

> [!NOTE]
> Our app was [nominated](https://projuvenes.psrp.org.pl/wp-content/uploads/2025/09/XIII-Pro-Juvenes-nominowani.pdf) in XIII edition of "Pro Juvenes" Student Community Awards organized by Student Parliament of the Republic of Poland for "Student Council Project of the Year" and "Debut of the Year"
> 
> Previous app iteration demos: https://photos.app.goo.gl/BfrERv3qWQGbxV5T8

<br>

|||||
|---|---|---|---|
|<video src="https://github.com/user-attachments/assets/e0d2a36c-f6f7-4a38-9c8f-f121197ef935" />|<img width="1080" height="2400" alt="Screenshot_1771530366" src="https://github.com/user-attachments/assets/dacca3a4-1231-4d25-aeb9-503ff4ac988a" />|<img width="1080" height="2400" alt="Screenshot_1771530348" src="https://github.com/user-attachments/assets/49bf6280-3afe-44f1-8789-4aa37a5e5923" />|<img width="1170" height="2532" alt="Simulator Screenshot - iPhone 16e - 2026-01-20 at 19 42 14" src="https://github.com/user-attachments/assets/49ba1e4e-f7bf-4ca5-b51a-588c219fd2dd" />|

## Want to join?

Check out the [collaboration guidelines inside the repo](CONTRIBUTING.md)!

> [!IMPORTANT]
> **Call for Mainteiners**
> 
> We are looking for maintainers to take over the project. 
> If you are interested, please contact the PJAIT's Student Council.

## Project Structure

The repository currently functions as a monorepo implemented using **Nx** for task orchestration and **Bun workspaces** (Bun as package manager) for package management.

Check their configuration details inside [`nx.json`](nx.json) and [`bun.lock`](bun.lock)

It contains:

- **Native application** (Expo / React Native) → [`@mirai-app/native`](apps/native/)
- **Backend server** (Hono + oRPC) → [`@mirai-app/backend-server`](apps/backend-server/)
- **Notification sender** (Expo Push Notifications) → [`@mirai-app/notification-sender`](apps/notification-sender/)
- **Seed CLI** (Database & Storage seeding) → [`@mirai-app/seed`](apps/seed/)
- **Shared packages** → [`packages`](packages/)
  - [`@mirai-app/auth`](packages/auth/) - Authentication logic
  - [`@mirai-app/db`](packages/db/) - Drizzle database client
  - [`@mirai-app/orpc`](packages/orpc/) - oRPC routers and client
  - [`@mirai-app/shared`](packages/shared/) - Shared utilities
  - [`@mirai-app/supabase`](packages/supabase/) - Supabase client configuration

📖 **Testing**: See [TESTING.md](TESTING.md) for comprehensive testing documentation. We use Vitest for most packages and Jest for the native app.

All scripts can be called from the project root using `bun run <script>`. These are thin wrappers around Nx — you can also run `nx` commands directly (for example, `nx run @mirai-app/native:dev` or `nx run-many -t build`).

To run a script in a specific package, use `bun run` (or `cd <package> && bun run <script>`):
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
# Generate Drizzle migrations
cd packages/db && bun run db:generate

# Push the schema to the database
cd packages/db && bun run db:push

# Optional: Open Drizzle Studio to view the database
cd packages/db && bun run db:studio
```

> 📖 **More information about database commands**: See [packages/seed/README.md](packages/seed/README.md)

### 5. Run tests (optional)

Verify your setup by running the test suite:

```bash
bun run test
```

> 📖 See [TESTING.md](TESTING.md) for more details about the testing setup.

### 6. Run the selected application

Before running:
- check the documentation of the [native application](apps/native/README.md) and [backend](apps/backend-server/README.md)

#### `bun run dev`

Runs all applications in development mode simultaneously:

- Backend server on `http://localhost:2022`
- Native app (Expo dev server)
- Notification sender service

#### `bun run dev:backend`

Runs only the backend server (Hono + oRPC) in development mode (default port 2022).

#### `bun run dev:native`

Runs only the native application (Expo dev server).

#### `bun run dev:notification-sender`

Runs only the notification sender service for push notifications.
