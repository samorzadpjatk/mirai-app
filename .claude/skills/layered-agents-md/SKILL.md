# Implement Layered AGENTS.md Structure

Split a monolithic AGENTS.md into a hierarchical structure following OpenAI Codex's discovery guidelines, with per-package instructions tailored to Clean Architecture layers.

## Overview

Codex discovers AGENTS.md files by walking from root to current directory, concatenating guidance with later files overriding earlier ones. This skill helps you split a large AGENTS.md into focused, per-directory instruction files.

## When to use

- AGENTS.md exceeds 300 lines or 10 KiB
- Working in a monorepo with distinct package responsibilities
- Different teams/workers need different guidance per directory
- Want to reduce cognitive load by showing only relevant instructions

## Prerequisites

- Existing AGENTS.md file at repository root
- Clean Architecture-style package structure (recommended)
- Understanding of Codex discovery rules (see Resources)

## How it works

### Discovery hierarchy

```
~/.codex/AGENTS.md          ← Global defaults (optional)
      │
      ▼
/AGENTS.md                  ← Root: Quick start + navigation
      │
      ▼
packages/domain/AGENTS.md   ← Domain-specific rules
packages/use-cases/AGENTS.md
packages/adapters/AGENTS.md
apps/backend-server/AGENTS.md
```

### Size budget

- Each file: < 200 lines (target: < 8 KiB)
- Combined stack: < 32 KiB (Codex default limit)

## Step-by-step

### Step 1: Analyze current structure

Read your existing AGENTS.md and identify sections:

```bash
# Count lines per section
wc -l AGENTS.md
grep -n "^## " AGENTS.md  # Major sections
grep -n "^### " AGENTS.md # Subsections
```

### Step 2: Plan the split

Map sections to destination files:

| Current Section     | Destination                  | Rationale             |
| ------------------- | ---------------------------- | --------------------- |
| Quick start         | Root AGENTS.md               | Universal entry point |
| Layer decision tree | Root AGENTS.md               | Navigation aid        |
| Domain patterns     | packages/domain/AGENTS.md    | Context-specific      |
| Use case templates  | packages/use-cases/AGENTS.md | Context-specific      |
| DI patterns         | packages/adapters/AGENTS.md  | Context-specific      |
| App-specific guides | apps/\*/AGENTS.md            | Framework-specific    |

### Step 3: Create package directories

```bash
# Create package-level AGENTS.md files
touch packages/domain/AGENTS.md
touch packages/use-cases/AGENTS.md
touch packages/adapters/AGENTS.md
touch packages/frameworks/AGENTS.md

# Create app-level AGENTS.md files
for app in apps/*/; do
  touch "${app}AGENTS.md"
done
```

### Step 4: Draft root AGENTS.md (navigation hub)

Structure:

```markdown
# AGENTS.md — Quick Reference

## Quick Start

- Check `.specs/tasks/in-progress/` for active work
- Run `bun test` before changing anything
- Write failing test first (TDD)

## Layer Decision Tree
```

Is it pure business logic?
├─ YES → Domain Layer (packages/domain/)
└─ NO → ... (condensed)

```

## Per-Package Guidance

| Working in... | See... |
|---------------|--------|
| Domain entities | [packages/domain/AGENTS.md](packages/domain/AGENTS.md) |
| Use cases | [packages/use-cases/AGENTS.md](packages/use-cases/AGENTS.md) |
| Adapters | [packages/adapters/AGENTS.md](packages/adapters/AGENTS.md) |

## Deep Reference

For comprehensive patterns: see CLAUDE.md
```

### Step 5: Draft per-package files

Each package AGENTS.md should contain:

1. **Header**: Context identification
2. **Quick checklist**: 3-5 must-follow rules
3. **Code templates**: Copy-pasteable patterns
4. **Cross-reference**: Link to CLAUDE.md section

Example for `packages/domain/AGENTS.md`:

````markdown
# Domain Layer — Quick Reference

## Checklist

- [ ] Entity has ZERO external dependencies
- [ ] Using `Effect<T,E,never>` (not async/await)
- [ ] IDs are branded types
- [ ] No `Date.now()` or `Math.random()` in domain

## Entity Template

```typescript
export class MyEntity {
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}

  static create(props): Effect.Effect<MyEntity, ValidationError, never> {
    // Validation logic
  }
}
```
````

## Deep Reference

See CLAUDE.md §2, §10.5.1 for comprehensive patterns.

````

### Step 6: Validate discovery

Test from each directory:

```bash
# From root
codex --ask-for-approval never "List loaded instruction files"

# From domain package
codex --cd packages/domain --ask-for-approval never "List loaded instruction files"

# From apps
codex --cd apps/backend-server --ask-for-approval never "List loaded instruction files"
````

Expected output shows:

- Global file (if exists)
- Root AGENTS.md
- Per-directory AGENTS.md (if exists)

### Step 7: Measure combined size

Ensure stack stays under 32 KiB:

```bash
# Simulate concatenation
cat ~/.codex/AGENTS.md 2>/dev/null \
    AGENTS.md \
    packages/domain/AGENTS.md 2>/dev/null \
    | wc -c
```

## Common patterns

### Pattern 1: Quick checklist format

```markdown
## Checklist

- [ ] Rule one
- [ ] Rule two
- [ ] Rule three
```

### Pattern 2: Decision tree (ASCII)

```markdown
## Where to put code?
```

Needs persistence?
├─ YES → Gateway in adapters/
└─ NO → Keep in use-cases/

```

```

### Pattern 3: Template with placeholders

````markdown
## Use Case Template

```typescript
export class {Name}UseCase {
  execute(input: {Name}Input): Effect.Effect<
    {Name}Result,
    {Name}Error,
    {Dependency}
  > {
    return Effect.gen(function* () {
      // Implementation
    });
  }
}
```
````

````

### Pattern 4: Cross-reference footer

Every per-package file ends with:

```markdown
---

## Deep Reference

For comprehensive patterns: CLAUDE.md §X.X
````

## Troubleshooting

### Nothing loads from subdirectory

**Symptom:** Codex only shows root AGENTS.md when run from `packages/domain/`

**Check:** File exists and has content?

```bash
ls -la packages/domain/AGENTS.md
wc -l packages/domain/AGENTS.md
```

**Fix:** Create file or add content.

### Instructions truncated

**Symptom:** Combined size exceeds 32 KiB

**Check:** Total bytes

```bash
find . -name "AGENTS.md" -o -name "AGENTS.override.md" 2>/dev/null \
  | xargs cat | wc -c
```

**Fix:** Raise `project_doc_max_bytes` in `~/.codex/config.toml` or split further.

### Wrong guidance from subdirectory

**Symptom:** Package-level guidance not appearing

**Check:** Working directory

```bash
pwd
ls AGENTS.md  # Should find the file
```

**Fix:** Ensure `codex --cd` points to the right directory.

## Best practices

1. **Keep root file small:** Under 200 lines, navigation-focused
2. **One concern per file:** Don't mix domain + adapter guidance
3. **Always cross-reference:** Link to CLAUDE.md for deep dives
4. **Test discovery paths:** Verify from every package directory
5. **Size audit quarterly:** Check combined size hasn't grown

## Resources

- **OpenAI Codex AGENTS.md Guide:** https://developers.openai.com/codex/guides/agents-md
- **Divio Documentation System:** https://documentation.divio.com/
- **Clean Architecture:** CLAUDE.md §2

## Related skills

- `sdd:add-task` — Create specifications for this work
- `sdd:plan` — Refine implementation plan
- `sdd:implement` — Execute the migration

---

**Version:** 1.0.0  
**Last updated:** 2026-04-14
