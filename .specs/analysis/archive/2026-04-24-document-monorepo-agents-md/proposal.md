## Why

This monorepo (MIRAI / PJApp) currently lacks structured agent-facing documentation. Without AGENTS.md files, AI assistants working on this codebase struggle to understand the architecture, conventions, and technical requirements across the multiple applications and packages. Creating comprehensive AGENTS.md documentation following OpenAI's established guidelines will improve development velocity and ensure consistent coding practices.

Following OpenAI's guidance, AGENTS.md files will be layered from the repository root down through nested directories. Files closer to the working directory override earlier guidance by appearing later in the combined prompt, enabling both shared monorepo conventions and team-specific overrides.

## What Changes

- Create a root `AGENTS.md` file documenting overall monorepo structure and conventions
- Create individual `AGENTS.md` files in each app directory (`apps/native`, `apps/backend-server`, `apps/notification-sender`, `apps/seed`)
- Create individual `AGENTS.md` files in each package directory (`packages/auth`, `packages/db`, `packages/common`, `packages/supabase`, `packages/orpc`)
- Support `AGENTS.override.md` files in nested directories for temporary team-specific overrides without modifying base files
- Create a `docs/` folder with structured documentation referenced by all AGENTS.md files
- Establish cross-references between AGENTS.md files and the docs folder
- Document Turborepo and Bun workspace configuration
- Document the tRPC API structure and usage patterns
- Document Drizzle database schema conventions
- Document Expo/React Native specific guidelines

## Capabilities

### New Capabilities
- `agents-md-structure`: Define the structure and content guidelines for all AGENTS.md files in the monorepo, following OpenAI's layered instruction pattern
- `agents-md-layering`: Implement layered AGENTS.md discovery (root → apps/packages → nested), where closer files override earlier guidance
- `agents-md-overrides`: Support `AGENTS.override.md` files for temporary team-specific overrides without modifying base AGENTS.md files
- `docs-folder`: Create centralized documentation structure in `docs/` folder
- `monorepo-conventions`: Document Turborepo task dependencies, Bun workspace configuration, and shared build scripts
- `trpc-api-docs`: Document tRPC router structure, procedures, and client usage patterns
- `drizzle-schema-docs`: Document database schema conventions, migration procedures, and Drizzle client usage
- `expo-native-docs`: Document Expo/React Native specific development guidelines, including EAS builds and native modules

### Modified Capabilities
<!-- No existing specs are being modified - this is a documentation-only change -->

## Impact

- **Apps**: All apps in `apps/` will have dedicated AGENTS.md files, with support for nested overrides
- **Packages**: All packages in `packages/` will have dedicated AGENTS.md files
- **Root level**: New `AGENTS.md` and `docs/` folder will be created as the base instruction layer
- **Layering**: Instructions will be concatenated from root down, with closer files overriding broader guidance
- **No breaking changes**: This is a documentation-only change
- **References**: All AGENTS.md files will reference documentation in `docs/` folder for detailed technical information
