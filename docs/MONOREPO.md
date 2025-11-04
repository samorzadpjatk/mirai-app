# Monorepo Structure

This monorepo is implemented using **Turborepo** for build orchestration and **pnpm workspaces** for package management.

Check [`turbo.json`](../turbo.json) and [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) for configuration details.

## Structure

Current monorepo contents:

- **Native App** (Expo) → [`@integral-2025-app/native`](../apps/native/)
- **Web App** (Next.js) → [`@integral-2025-app/web`](../apps/web/)
- **Shared Packages** → [`packages`](../packages/)

## Root Scripts

All scripts can be run from the root directory using `pnpm <script>`.

To run app-specific scripts use `pnpm --filter`. Example:

```
pnpm --filter @integral-2025-app/web db:push
```

### Development Scripts

#### `pnpm dev`

Starts all apps in development mode simultaneously:

- Web app on `http://localhost:11000`
- Native app (Expo dev server)

#### `pnpm dev:web`

Starts only the web app in development mode (port 11000).

#### `pnpm dev:native`

Starts only the native app (Expo dev server).

### Build Scripts

#### `pnpm build`

Builds all apps that have a build script. Uses Turborepo caching:

1. Turbo checks which packages have "build" script
2. Runs build scripts in parallel (respecting dependencies)
3. Caches results for future runs

### Testing Scripts

#### `pnpm test`

Runs Jest tests across all apps that have tests implemented.
