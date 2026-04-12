---
title: "Astro Web Skeleton"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-migrate-admin-panel-to-astro-web/specs/astro-web-skeleton/spec.md"
parent_design: ".specs/plans/migrate-admin-panel-to-astro-web.design.md"
---

## ADDED Requirements

### Requirement: Astro project initialization

The system SHALL create a new Astro project at `apps/admin-web` with TypeScript support and file-based routing configured.

#### Scenario: Project structure created

- **WHEN** Astro project is initialized
- **THEN** directory structure includes `src/pages/`, `src/components/`, `src/layouts/`, and `src/lib/` directories

#### Scenario: TypeScript configuration

- **WHEN** project is initialized
- **THEN** `tsconfig.json` extends `../../tsconfig.base.json` from monorepo root

#### Scenario: Package.json created

- **WHEN** project is initialized
- **THEN** `package.json` includes dev, build, and preview scripts

### Requirement: Monorepo integration

The system SHALL integrate the Astro admin web app into the Turborepo monorepo with proper workspace configuration.

#### Scenario: Workspace configuration

- **WHEN** admin-web is added to monorepo
- **THEN** root `package.json` workspaces array includes `apps/admin-web`

#### Scenario: Turborepo tasks

- **WHEN** turbo.json is updated
- **THEN** build, dev, lint, and typecheck tasks are configured for admin-web

#### Scenario: Root npm scripts

- **WHEN** root package.json is updated
- **THEN** `dev:admin-web` script is available to run the admin web app

### Requirement: Shared package dependencies

The system SHALL configure dependencies on shared monorepo packages with proper module resolution.

#### Scenario: Package dependencies declared

- **WHEN** package.json is created
- **THEN** dependencies include `@mirai-app/auth`, `@mirai-app/trpc`, `@mirai-app/db`, `@mirai-app/supabase`, and `@mirai-app/shared` as workspace dependencies

#### Scenario: Module resolution

- **WHEN** Astro build runs
- **THEN** workspace packages are resolved correctly without errors

#### Scenario: TypeScript paths

- **WHEN** TypeScript compilation runs
- **THEN** imports from `@mirai-app/*` packages resolve to source files

### Requirement: Astro configuration

The system SHALL configure Astro with React integration and output mode suitable for SSR deployment.

#### Scenario: React integration enabled

- **WHEN** astro.config.mjs is created
- **THEN** React integration is enabled for island components

#### Scenario: Output mode configured

- **WHEN** astro.config.mjs is created
- **THEN** output mode is set to `server` or `hybrid` for SSR support

#### Scenario: Server rendering works

- **WHEN** development server starts
- **THEN** pages render on server and hydrate React components on client

### Requirement: Development environment

The system SHALL provide local development environment with hot module replacement and proper error reporting.

#### Scenario: Dev server starts

- **WHEN** `bun run dev` is executed in admin-web directory
- **THEN** Astro dev server starts on localhost with HMR enabled

#### Scenario: File changes trigger rebuild

- **WHEN** source file is modified during dev
- **THEN** browser automatically reloads with updated content

#### Scenario: Build succeeds

- **WHEN** `bun run build` is executed
- **THEN** production build completes without TypeScript or bundling errors

### Requirement: Base layout structure

The system SHALL provide base HTML layout with proper meta tags, styles, and global scripts.

#### Scenario: Layout file exists

- **WHEN** project is set up
- **THEN** `src/layouts/Layout.astro` exists with HTML boilerplate

#### Scenario: Meta tags included

- **WHEN** layout is rendered
- **THEN** viewport, charset, and description meta tags are present

#### Scenario: Global styles loaded

- **WHEN** page loads
- **THEN** base CSS styles are applied to all pages
