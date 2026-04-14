# Layered AGENTS.md Design

Split the 611-line AGENTS.md into a hierarchical structure following OpenAI Codex discovery rules.

## Goals (Priority Order)

1. **Size management**: Keep each file under 32 KiB
2. **Monorepo specialization**: Tailored guidance per package
3. **Reduce duplication**: Reference CLAUDE.md instead of copying

## Architecture

Codex discovers files by walking from root to current directory, concatenating guidance in precedence order. Files closer to the working directory override earlier guidance.

The new structure mirrors your Clean Architecture layers:

```
AGENTS.md                          # Root: Quick start + navigation (~200 lines)
packages/
  domain/AGENTS.md                 # Domain purity rules (~120 lines)
  use-cases/AGENTS.md              # Effect orchestration (~130 lines)
  adapters/AGENTS.md               # DI + controller patterns (~140 lines)
  frameworks/AGENTS.md             # Layer composition (~100 lines)
apps/
  backend-server/AGENTS.md         # tRPC + auth flow (~80 lines)
  native/AGENTS.md                 # Mobile + Jest patterns (~80 lines)
  notification-sender/AGENTS.md    # Background jobs (~60 lines)
  web/AGENTS.md                    # Frontend patterns (~80 lines)
  seed/                            # No override needed (inherits root)
```

### Root AGENTS.md Focus

Transform into a landing page:

- Quick start checklist (5 bullets)
- Layer decision tree (ASCII diagram)
- Navigation section with per-package links
- 3 universal rules (TDD first, Effect-based, branded IDs)
- Condensed skill reference table

### Per-Package AGENTS.md Focus

Each contains practical checklists for the immediate context:

| Package       | Keep from AGENTS.md                        | Add from CLAUDE.md                 |
| ------------- | ------------------------------------------ | ---------------------------------- |
| `domain/`     | Purity rules, entity template, branded IDs | §10.5.1 domain patterns            |
| `use-cases/`  | `Effect.gen` template, port patterns       | §10.4 Context.Tag, §10.5.2 testing |
| `adapters/`   | DI patterns, controller auth               | §10.5.3 gateway patterns           |
| `frameworks/` | Module structure, scope strategy           | §10.4 Layer composition            |
| `apps/*`      | App-specific templates                     | Link to relevant package docs      |

### CLAUDE.md Role

Remains the comprehensive reference. Every per-package AGENTS.md ends with:

```markdown
---

## Deep Reference

For comprehensive patterns, migration guides, and advanced variations, see CLAUDE.md §X.X
```

## Content Mapping

### Root AGENTS.md (~200 lines)

- Header + Quick start checklist (lines 1-28)
- Layer decision tree (lines 31-56)
- Per-pillar summaries reduced to 3 bullets each (lines 60-225 → ~100 lines)
- Navigation section (NEW)
- Condensed skill reference (lines 595-606)
- Footer

### packages/domain/AGENTS.md (~120 lines)

- Domain purity rules (lines 117-123)
- `Effect<T,E,never>` pattern (lines 109-115, 277-331)
- Branded ID factory pattern (lines 505-543)
- Entity template (lines 125-156)
- Common mistakes (lines 158-163)

### packages/use-cases/AGENTS.md (~130 lines)

- `Effect.gen + yield*` patterns (lines 191-199)
- Context.Tag DI (from CLAUDE.md §10.4)
- Use case template (lines 331-366)
- Port definition pattern (lines 495-506)
- Test templates with Layer.provide (lines 369-411)

### packages/adapters/AGENTS.md (~140 lines)

- awilix-modular patterns (lines 228-286)
- Container resolution in routers (lines 246-258)
- `Effect.tryPromise` for gateways (from CLAUDE.md §10.5.3)
- Controller auth patterns (lines 302-325)
- Adapter repository rules (lines 443-450)

### packages/frameworks/AGENTS.md (~100 lines)

- Layer composition (from CLAUDE.md §10.4)
- awilix-modular module structure (lines 260-276)
- Scope strategy table (lines 279-286)

### Apps AGENTS.md Files (~60-80 lines each)

- `backend-server/`: tRPC routers, controllers, auth flow
- `native/`: Mobile-specific patterns, Jest testing, navigation
- `notification-sender/`: Background job patterns, Effect scheduling
- `web/`: Frontend patterns, component structure, API client usage
- `seed/`: No override (inherits root guidance)

## Content Extraction Rules

1. **Deduplicate with CLAUDE.md**: Replace verbatim sections with references
2. **Keep checklists, move encyclopedic content**: AGENTS.md = practical; CLAUDE.md = deep reference
3. **Size enforcement**: Each file ≤ 200 lines pre-split
4. **Mandatory cross-references**: Every file ends with CLAUDE.md §X.X pointer
5. **Test path combinations**: Verify <32 KiB total for each directory stack

## Migration Steps

### Phase 1: Audit (15 minutes)

1. Detect duplicates between AGENTS.md and CLAUDE.md
2. Identify sections existing in both (~40% overlap estimated)
3. Create mapping: AGENTS.md line ranges → destination files

### Phase 2: Create Structure (30 minutes)

Create all files simultaneously:

1. Draft root AGENTS.md (navigation-focused)
2. Draft all per-package AGENTS.md files in parallel
3. Draft all apps/ AGENTS.md files

### Phase 3: Replace Root (5 minutes)

1. Backup: `git mv AGENTS.md AGENTS.md.backup`
2. Move new root file in place

### Phase 4: Validation (10 minutes)

Test Codex discovery from each directory:

```bash
codex --cd packages/domain --ask-for-approval never "List loaded instruction files"
```

Verify concatenated size <32 KiB from each location.

### Phase 5: Cleanup (5 minutes)

1. Delete backup after 1 week, or archive to `.specs/archive/`
2. Update any docs/ links referencing old AGENTS.md sections

## Rollback Plan

Restore from backup if issues arise:

```bash
git mv AGENTS.md.backup AGENTS.md
```

## Success Criteria

- [ ] Each AGENTS.md file <200 lines (<8 KiB)
- [ ] Combined stack <32 KiB from any directory
- [ ] No essential guidance lost
- [ ] All per-package files reference CLAUDE.md
- [ ] Codex discovery works from all package directories
