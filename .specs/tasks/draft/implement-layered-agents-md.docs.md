---
title: Implement layered AGENTS.md structure
depends_on:
  - .specs/plans/layered-agents-md.design.md
---

## Initial User Prompt

Split AGENTS.md and nest it in folders according to OpenAI Codex guidelines: https://developers.openai.com/codex/guides/agents-md#layer-project-instructions

## Description

Split the existing 611-line AGENTS.md file into a hierarchical, layered structure following OpenAI Codex discovery rules. The new structure will mirror the Clean Architecture layers, creating per-package AGENTS.md files with specialized guidance while transforming the root AGENTS.md into a navigation-focused landing page.

### Goals (Priority Order)

1. **Size management:** Keep each file under 200 lines (<8 KiB) and combined stack under 32 KiB
2. **Monorepo specialization:** Provide tailored guidance per package based on Clean Architecture
3. **Reduce duplication:** Reference CLAUDE.md instead of copying encyclopedic content

### Architecture

Codex discovers files by walking from root to current directory, concatenating guidance where files closer to the working directory override earlier guidance.

**Target structure:**

```
AGENTS.md                          # Root: Quick start + navigation (~200 lines)
packages/
  domain/AGENTS.md                 # Domain purity rules
  use-cases/AGENTS.md              # Effect orchestration patterns
  adapters/AGENTS.md               # DI + controller patterns
  frameworks/AGENTS.md             # Layer composition + DI wiring
apps/
  backend-server/AGENTS.md         # tRPC routes + auth flow
  native/AGENTS.md                 # Mobile patterns + Jest testing
  notification-sender/AGENTS.md    # Background job patterns
  web/AGENTS.md                    # Frontend patterns
```

### Migration Approach

1. **Phase 1 - Audit:** Map content from current AGENTS.md to destination files
2. **Phase 2 - Create:** Draft all per-package AGENTS.md files in parallel
3. **Phase 3 - Replace:** Backup and replace root AGENTS.md
4. **Phase 4 - Validate:** Verify file sizes and Codex discovery from each directory
5. **Phase 5 - Cleanup:** Archive backup after verification period

## Acceptance Criteria

### File Structure

**AC-001:** Given the repository root, when Codex discovers instructions, then it loads root AGENTS.md containing quick start checklist, layer decision tree, and navigation links to all package-specific files.

**AC-002:** Given the `packages/domain/` directory, when Codex discovers instructions, then it loads domain-specific AGENTS.md containing: entity creation template, branded ID pattern, purity rules, domain testing patterns, and common mistakes section.

**AC-003:** Given the `packages/use-cases/` directory, when Codex discovers instructions, then it loads use-case-specific AGENTS.md containing: Effect.gen patterns, Context.Tag DI, use case template, port definitions, and test templates with Layer.provide.

**AC-004:** Given the `packages/adapters/` directory, when Codex discovers instructions, then it loads adapter-specific AGENTS.md containing: awilix-modular DI patterns, controller auth helpers, Effect.tryPromise for gateways, and BasePrismaRepository rules.

**AC-005:** Given the `packages/frameworks/` directory, when Codex discovers instructions, then it loads framework-specific AGENTS.md containing: Layer composition patterns, awilix-modular module structure, and scope strategy table.

**AC-006:** Given the `apps/backend-server/` directory, when Codex discovers instructions, then it loads backend-server-specific AGENTS.md containing: tRPC router patterns, controller resolution, and auth flow examples.

**AC-007:** Given the `apps/native/` directory, when Codex discovers instructions, then it loads native-specific AGENTS.md containing: mobile development patterns, Jest testing setup, and navigation patterns.

**AC-008:** Given the `apps/notification-sender/` directory, when Codex discovers instructions, then it loads notification-sender-specific AGENTS.md containing: background job patterns and Effect scheduling guidance.

**AC-009:** Given the `apps/web/` directory, when Codex discovers instructions, then it loads web-specific AGENTS.md containing: frontend component patterns and API client usage.

### Content Quality

**AC-010:** Given any AGENTS.md file, when reviewing its content, then it ends with a "Deep Reference" section linking to the relevant CLAUDE.md section(s).

**AC-011:** Given any package directory, when measuring the combined size of all discovered AGENTS.md files from root to that directory, then the total is under 32 KiB.

**AC-012:** Given the migration is complete, when verifying against the original AGENTS.md content mapping, then 100% of essential guidance is preserved (no loss of critical patterns, templates, or rules).

## Scope

### In-Scope

- ✅ Creating 9 new AGENTS.md files per design specification
- ✅ Rewriting root AGENTS.md as navigation landing page
- ✅ Extracting and distributing content to appropriate package files
- ✅ Adding CLAUDE.md cross-references to every file
- ✅ Validating file size compliance (each <200 lines, combined <32 KiB)
- ✅ Testing Codex discovery from all package directories
- ✅ Creating backup of original AGENTS.md

### Out-of-Scope

- ❌ Modifying CLAUDE.md content
- ❌ Changing any source code in packages/
- ❌ Updating docs/ folder content
- ❌ Creating the seed/ package AGENTS.md (inherits root, no override needed)
- ❌ Deleting backup file (cleanup deferred to future task)

## User Scenarios

### Scenario 1: New AI Agent Onboarding

**Given** a new AI agent starts working on a feature in `packages/domain/`
**When** the agent opens the directory
**Then** Codex discovers root AGENTS.md (navigation) and domain/AGENTS.md (specialized guidance)
**And** the agent sees domain purity rules, entity templates, and branded ID patterns immediately relevant to their work.

### Scenario 2: Backend Developer Working on tRPC Router

**Given** a developer is implementing a new tRPC endpoint in `apps/backend-server/`
**When** the agent opens the directory
**Then** Codex discovers root AGENTS.md and backend-server/AGENTS.md
**And** the agent sees controller resolution patterns, auth flow examples, and router templates specific to backend work.

### Scenario 3: Cross-Package Feature Development

**Given** a developer needs to create a feature spanning Domain → Use Case → Adapter
**When** the agent moves between `packages/domain/`, `packages/use-cases/`, `packages/adapters/`
**Then** Codex discovers the appropriate specialized AGENTS.md at each location
**And** the agent receives layer-specific guidance (entity patterns, Effect orchestration, DI wiring) for each phase.

### Scenario 4: Documentation Reference

**Given** an agent needs deep details about Effect patterns
**When** the agent reads any AGENTS.md file
**Then** the file ends with a "Deep Reference" section
**And** the agent can navigate to CLAUDE.md §X.X for comprehensive patterns and advanced variations.

## Definition of Done

- [ ] All 9 AGENTS.md files created per design specification
- [ ] Root AGENTS.md contains: quick start (5 bullets), layer decision tree (ASCII), navigation section, 3 universal rules, condensed skill reference
- [ ] Each per-package AGENTS.md contains specialized checklists and templates for its layer
- [ ] Every file ends with "Deep Reference" section linking to CLAUDE.md
- [ ] Size validation passed: each file <200 lines, combined stack from any directory <32 KiB
- [ ] Content verification passed: all essential guidance from original AGENTS.md preserved
- [ ] Original AGENTS.md backed up as AGENTS.md.backup
- [ ] Codex discovery tested from each package directory (verified concatenation order)
- [ ] No duplicate or overlapping content between files
- [ ] All cross-references use correct CLAUDE.md section numbers
