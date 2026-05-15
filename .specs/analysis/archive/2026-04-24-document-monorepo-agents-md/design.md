## Context

The MIRAI project is a monorepo using Turborepo and Bun workspaces. It contains:
- 4 applications: native (Expo), backend-server (Fastify + tRPC), notification-sender, seed CLI
- 5 shared packages: auth, db (Drizzle), shared utilities, supabase client, orpc

Currently, there are no AGENTS.md files or centralized documentation. The codebase relies on README.md files in each package/app for human-readable documentation. This creates friction for AI assistants that need to quickly understand project structure, conventions, and technical requirements.

## Goals / Non-Goals

**Goals:**
- Establish AGENTS.md in root with monorepo overview and conventions as the base instruction layer
- Create AGENTS.md files in all apps/ and packages/ directories following OpenAI's layered discovery pattern
- Implement layered instruction architecture where files closer to working directory override broader guidance
- Support AGENTS.override.md files for temporary team-specific overrides without modifying base files
- Create a docs/ folder with detailed technical documentation
- Define cross-referencing patterns between AGENTS.md and docs/
- Document the monorepo tooling (Turborepo, Bun workspaces)
- Document domain-specific patterns (oRPC, Drizzle, Expo)
- Stay within OpenAI's default 32 KiB combined instruction limit

**Non-Goals:**
- Replace existing README.md files (they serve human contributors)
- Document every function/class (use JSDoc for that)
- Create comprehensive API documentation (outside scope)
- Modify existing code (documentation-only change)
- Configure custom fallback filenames (use standard AGENTS.md naming)

## Decisions

### 1. Layered Instruction Architecture (OpenAI Guidelines)

**Decision:** Following OpenAI's AGENTS.md discovery pattern, implement layered instructions where:

- **Discovery order**: Root AGENTS.md → apps/*/AGENTS.md or packages/*/AGENTS.md → nested directories
- **Merge order**: Files are concatenated from root down, with blank lines between files
- **Override mechanism**: Files closer to the working directory appear later and override earlier guidance
- **Override files**: Support `AGENTS.override.md` for temporary overrides without modifying base `AGENTS.md`

**Layered structure:**
```
Root AGENTS.md                    # Base monorepo conventions
├── apps/native/AGENTS.md         # Native app specific rules
│   └── screens/AGENTS.override.md # Temporary screen-specific rules
├── apps/backend-server/AGENTS.md # Backend specific rules
├── packages/db/AGENTS.md         # Database package rules
└── ...
```

**Rationale:** This follows OpenAI's recommended pattern allowing both shared monorepo conventions and team-specific overrides. Teams can add temporary rules without modifying shared base files, and overrides naturally take precedence due to concatenation order.

### 2. AGENTS.md Structure and Content Guidelines

**Decision:** Each AGENTS.md should follow a consistent structure based on location:

**Root AGENTS.md:**
- Monorepo overview and structure
- Build system (Turborepo, Bun)
- Development environment setup
- References to all app/package AGENTS.md files
- Links to detailed docs in docs/ folder

**App AGENTS.md (apps/*):**
- Application purpose and tech stack
- Key entry points and scripts
- Environment variables and configuration
- Local development commands
- Links to relevant docs/ sections

**Package AGENTS.md (packages/*):**
- Package purpose and exports
- Dependencies and peer dependencies
- Configuration files (if any)
- Usage patterns and examples
- Links to relevant docs/ sections

**Rationale:** This structure allows AI assistants to get context at the right level of detail, with the ability to drill down into specifics via the docs/ folder. Combined with layered discovery, each level can focus on what's relevant while inheriting broader conventions.

### 3. Docs/ Folder Structure

**Decision:** Create a hierarchical docs/ folder:

```
docs/
├── architecture/          # High-level architecture decisions
│   ├── monorepo.md
│   ├── turborepo.md
│   └── bun-workspaces.md
├── development/         # Development guides
│   ├── setup.md
│   ├── environment.md
│   └── scripts.md
├── apps/                # Per-app documentation
│   ├── native/
│   │   ├── setup.md
│   │   ├── navigation.md
│   │   └── deployment.md
│   ├── backend-server/
│   │   ├── setup.md
│   │   ├── tpc.md
│   │   └── api-structure.md
│   └── ...
├── packages/            # Per-package documentation
│   ├── auth/
│   ├── db/
│   │   ├── drizzle.md
│   │   ├── migrations.md
│   │   └── schema.md
│   └── ...
└── conventions/        # Coding conventions
    ├── typescript.md
    ├── testing.md
    └── code-style.md
```

**Rationale:** Hierarchical organization makes it easy to find relevant documentation. Each app/package has its own folder for detailed docs.

### 4. Cross-Referencing Strategy

**Decision:** AGENTS.md files will use relative links to docs/ folder:

```markdown
<!-- In AGENTS.md -->
For detailed setup instructions, see [docs/development/setup.md](../docs/development/setup.md)

For tRPC patterns, see [docs/packages/trpc/router-structure.md](../../docs/packages/trpc/router-structure.md)
```

**Rationale:** Relative links work in all contexts (IDE, GitHub, AI tools) and maintain portability.

### 5. Monorepo Conventions Documentation

**Decision:** Key conventions to document:

**Turborepo:**
- Pipeline configuration in turbo.json
- Task dependencies (build → test → deploy)
- Caching strategies
- Remote caching (if configured)

**Bun Workspaces:**
- Workspace definition in package.json
- Cross-package dependencies using workspace: protocol
- Bun.lock management

**Script Naming:**
- `dev`: Start development servers
- `build`: Production builds
- `test`: Run test suites
- `lint`: Code quality checks
- `db:*`: Database operations

### 6. tRPC Documentation Approach

**Decision:** Document tRPC in layers:

**In packages/trpc AGENTS.md:**
- Router structure overview
- How to create new procedures
- Client initialization patterns

**In docs/packages/trpc/:**
- Detailed router composition
- Middleware patterns
- Error handling
- Type inference examples
- Testing tRPC endpoints

**In apps/backend-server AGENTS.md:**
- Where routers are defined
- How to add new routes
- API versioning strategy

### 7. Drizzle Documentation Approach

**Decision:** Document Drizzle in layers:

**In packages/db AGENTS.md:**
- Schema location
- Migration commands
- Client usage patterns

**In docs/packages/db/:**
- Schema design conventions
- Migration best practices
- Seeding patterns
- Connection pooling
- Database queries and optimization

### 8. Expo/React Native Documentation

**Decision:** Document Expo-specific concerns:

**In apps/native AGENTS.md:**
- EAS configuration
- Native module handling
- Build profiles (development, preview, production)
- OTA updates workflow

**In docs/apps/native/:**
- Navigation structure
- State management
- Native module integration
- Platform-specific considerations (iOS/Android)

## Risks / Trade-offs

**Risk: Instruction Size Limit**
- OpenAI's default limit is 32 KiB for combined AGENTS.md files
- **Mitigation:** Keep each AGENTS.md concise and focused. Root AGENTS.md should be ~5-8 KiB, per-app/package files ~2-4 KiB each. Use docs/ folder for detailed technical content. Monitor total size when adding new AGENTS.md files.

**Risk: Layering Confusion**
- Teams may not understand which guidance applies or how overrides work
- **Mitigation:** Document the layering explicitly in root AGENTS.md with examples. Include a "How AGENTS.md works" section explaining the discovery order and override mechanism.

**Risk: Override File Proliferation**
- Too many AGENTS.override.md files could create confusion about active rules
- **Mitigation:** Document that override files are for temporary use only. Recommend removing overrides after the specific need passes. Keep overrides in git but document their purpose clearly.

**Risk: Documentation Drift**
- As code evolves, docs may become outdated
- **Mitigation:** AGENTS.md files are concise and high-level, referencing docs/ folder for details. Add reminders in AGENTS.md about keeping docs in sync during code changes.

**Risk: Over-documentation**
- Creating too much documentation that no one reads
- **Mitigation:** Focus on critical paths and conventions. AGENTS.md should be scannable in 2-3 minutes. Docs/ folder can be comprehensive.

**Risk: Inconsistent Formatting**
- Different styles across AGENTS.md files
- **Mitigation:** Provide a template in root AGENTS.md for others to follow. Use markdownlint or similar if needed.

## Migration Plan

**Phase 1: Create Root Documentation**
1. Create root AGENTS.md with monorepo overview and layering explanation
2. Include "How AGENTS.md Works" section documenting OpenAI's discovery pattern
3. Create docs/ folder structure
4. Create docs/architecture/ and docs/development/ files

**Phase 2: Create Package Documentation**
1. Create packages/*/AGENTS.md files inheriting root conventions
2. Create docs/packages/*/ files for detailed docs
3. Document any package-specific overrides to root conventions

**Phase 3: Create App Documentation**
1. Create apps/*/AGENTS.md files with app-specific guidance
2. Create docs/apps/*/ files for detailed docs
3. Create example AGENTS.override.md in one nested directory to demonstrate the pattern

**Phase 4: Create Conventions Documentation**
1. Create docs/conventions/ files
2. Link conventions in relevant AGENTS.md files
3. Document override file best practices

**Rollback Strategy:**
- Documentation is additive only
- No code changes, so rollback is simply removing the new files
- Override files can be removed independently of base AGENTS.md files

## Open Questions

1. Should AGENTS.md files include a "Quick Commands" section for common operations in that package/app?
2. Should we include debugging tips in AGENTS.md or keep them strictly in docs/ folder?
3. How detailed should the monorepo task dependency graph be in documentation?
4. Should we document the notification-sender app in the same depth as native and backend-server?
5. Should we establish a convention for when to use AGENTS.override.md vs updating base AGENTS.md?
6. How should we monitor the combined instruction size to stay within the 32 KiB limit?
