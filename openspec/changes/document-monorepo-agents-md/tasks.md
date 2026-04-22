## 1. Create Root Documentation

- [x] 1.1 Create root `AGENTS.md` with monorepo overview, structure diagram, and build system documentation
- [x] 1.2 Add "How AGENTS.md Works" section to root AGENTS.md explaining OpenAI's layered discovery pattern
- [x] 1.3 Add instruction size guidelines to root AGENTS.md (keep under 32 KiB combined limit)
- [x] 1.4 Create `docs/` folder with hierarchical structure (architecture/, development/, apps/, packages/, conventions/)
- [x] 1.5 Create `docs/architecture/monorepo.md` documenting overall monorepo architecture
- [x] 1.6 Create `docs/architecture/turborepo.md` documenting Turborepo configuration and task dependencies
- [x] 1.7 Create `docs/architecture/bun-workspaces.md` documenting Bun workspace configuration
- [x] 1.8 Create `docs/development/setup.md` with development environment setup instructions
- [x] 1.9 Create `docs/development/environment.md` documenting environment variables and configuration
- [x] 1.10 Create `docs/development/scripts.md` documenting available development scripts and commands
- [x] 1.11 Document override file usage and best practices in docs/development/agents-md-guide.md

## 2. Create Package Documentation

- [x] 2.1 Create `packages/auth/AGENTS.md` documenting auth package purpose, exports, and usage
- [x] 2.2 Add "Inherited Conventions" section to packages/auth/AGENTS.md referencing root AGENTS.md
- [x] 2.3 Create `docs/packages/auth/setup.md` with detailed auth package documentation
- [x] 2.4 Create `packages/db/AGENTS.md` documenting db package, Prisma client, and database operations
- [x] 2.5 Add "Inherited Conventions" section to packages/db/AGENTS.md referencing root AGENTS.md
- [x] 2.6 Create `docs/packages/db/prisma.md` documenting Prisma schema and client usage
- [x] 2.7 Create `docs/packages/db/migrations.md` documenting migration workflows and best practices
- [x] 2.8 Create `docs/packages/db/schema.md` documenting schema design conventions
- [x] 2.9 Create `packages/shared/AGENTS.md` documenting shared utilities package
- [x] 2.10 Add "Inherited Conventions" section to packages/shared/AGENTS.md referencing root AGENTS.md
- [x] 2.11 Create `docs/packages/shared/utilities.md` documenting shared utility functions
- [x] 2.12 Create `packages/supabase/AGENTS.md` documenting Supabase client configuration
- [x] 2.13 Add "Inherited Conventions" section to packages/supabase/AGENTS.md referencing root AGENTS.md
- [x] 2.14 Create `docs/packages/supabase/client.md` documenting Supabase client setup and usage
- [x] 2.15 Create `packages/trpc/AGENTS.md` documenting tRPC router structure and client usage
- [x] 2.16 Add "Inherited Conventions" section to packages/trpc/AGENTS.md referencing root AGENTS.md
- [x] 2.17 Create `docs/packages/trpc/router-structure.md` documenting router composition patterns
- [x] 2.18 Create `docs/packages/trpc/procedures.md` documenting query and mutation patterns
- [x] 2.19 Create `docs/packages/trpc/middleware.md` documenting middleware patterns
- [x] 2.20 Create `docs/packages/trpc/error-handling.md` documenting error handling patterns

## 3. Create App Documentation

- [x] 3.1 Create `apps/native/AGENTS.md` documenting Expo app structure, tech stack, and development commands
- [x] 3.2 Add "Inherited Conventions" and any overrides section to apps/native/AGENTS.md
- [x] 3.3 Create `docs/apps/native/setup.md` with detailed native app setup instructions
- [x] 3.4 Create `docs/apps/native/navigation.md` documenting navigation structure and patterns
- [x] 3.5 Create `docs/apps/native/deployment.md` documenting EAS configuration and build profiles
- [x] 3.6 Create `docs/apps/native/ota-updates.md` documenting OTA updates workflow
- [x] 3.7 Create `docs/apps/native/state-management.md` documenting state management patterns
- [x] 3.8 Create `apps/backend-server/AGENTS.md` documenting Fastify + tRPC server structure
- [x] 3.9 Add "Inherited Conventions" and any overrides section to apps/backend-server/AGENTS.md
- [x] 3.10 Create `docs/apps/backend-server/setup.md` with detailed backend server setup
- [x] 3.11 Create `docs/apps/backend-server/trpc.md` documenting tRPC integration with Fastify
- [x] 3.12 Create `docs/apps/backend-server/api-structure.md` documenting API organization
- [x] 3.13 Create `apps/notification-sender/AGENTS.md` documenting notification sender app
- [x] 3.14 Add "Inherited Conventions" section to apps/notification-sender/AGENTS.md referencing root
- [x] 3.15 Create `docs/apps/notification-sender/setup.md` documenting notification service setup
- [x] 3.16 Create `apps/seed/AGENTS.md` documenting seed CLI app
- [x] 3.17 Add "Inherited Conventions" section to apps/seed/AGENTS.md referencing root AGENTS.md
- [x] 3.18 Create `docs/apps/seed/database-seeding.md` documenting database seeding procedures
- [x] 3.19 Create example `AGENTS.override.md` in one nested directory to demonstrate the override pattern
- [x] 3.20 Create `apps/web/AGENTS.md` documenting Astro web app (bonus)

## 4. Create Conventions Documentation

- [x] 4.1 Create `docs/conventions/typescript.md` documenting TypeScript coding standards
- [x] 4.2 Create `docs/conventions/testing.md` documenting testing conventions and patterns
- [x] 4.3 Create `docs/conventions/code-style.md` documenting code formatting and style guidelines
- [x] 4.4 Create `docs/conventions/agents-md.md` documenting AGENTS.md structure and best practices

## 5. Cross-Reference and Verify

- [x] 5.1 Add relative links from root `AGENTS.md` to all app and package `AGENTS.md` files
- [x] 5.2 Add relative links from each app `AGENTS.md` to relevant `docs/` sections
- [x] 5.3 Add relative links from each package `AGENTS.md` to relevant `docs/` sections
- [x] 5.4 Verify all links are working and point to correct relative paths
- [x] 5.5 Create template section in root `AGENTS.md` for consistent formatting across files
- [x] 5.6 Calculate total size of all AGENTS.md files to ensure under 32 KiB limit
- [x] 5.7 Verify concatenation order works correctly (root → apps/packages → overrides)
- [x] 5.8 Document the instruction chain discovery order in root AGENTS.md
