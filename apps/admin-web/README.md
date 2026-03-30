# MIRAI Admin Web

Astro-based admin panel using file-based routing with React islands.

## Architecture

- Each admin route is an Astro page in `src/pages/**`.
- Route content is rendered via page-specific React islands (for example `UsersPageContent`, `GroupsPageContent`).
- Shared app shell and providers are centralized in `src/components/providers/GlobalProviders.tsx` and mounted from `src/layouts/AdminLayout.astro`.
- Global providers include auth, tRPC API client context, trip context, header, mobile navigation, and toast UI.
- Shared admin data hooks are imported from `@mirai-app/admin-hooks` to keep web/native business logic aligned.

## Routing and Hydration

- Astro handles routing from file structure; no manual client-side route matcher is used.
- `GlobalProviders` is hydrated with `client:load` and `transition:persist` so auth/trip/tRPC state survives navigation.
- `ClientRouter` from `astro:transitions` is enabled in `src/layouts/Layout.astro` for smooth page transitions.

## Commands

Run from monorepo root:

| Command                                           | Action                        |
| :------------------------------------------------ | :---------------------------- |
| `bun run --filter=@mirai-app/admin-web dev`       | Start local dev server        |
| `bun run --filter=@mirai-app/admin-web build`     | Build production output       |
| `bun run --filter=@mirai-app/admin-web preview`   | Preview build                 |
| `bun run --filter=@mirai-app/admin-web typecheck` | Run Astro + TypeScript checks |
