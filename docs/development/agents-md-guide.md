# AGENTS.md Guide

## Overview

This document explains how AGENTS.md files work in the MIRAI monorepo and best practices for using them.

## What is AGENTS.md?

AGENTS.md files provide context to AI assistants (like Claude, ChatGPT, etc.) working on the codebase. They follow OpenAI's recommended layered instruction pattern, where files closer to the working directory override earlier guidance.

## The Layered Discovery Pattern

### Discovery Order

Files are discovered in this order:

1. **Root AGENTS.md** - Base monorepo conventions
2. **App/Package AGENTS.md** - Specific to the working directory
3. **AGENTS.override.md** - Temporary team-specific overrides

### Merge Order

Files are concatenated from root down, separated by blank lines:

```
[Root AGENTS.md content]

[App AGENTS.md content]

[Override content]
```

### Override Mechanism

Files closer to the working directory appear **later** in the combined prompt, so their guidance naturally overrides earlier guidance.

## File Types

### Root AGENTS.md

Located at repository root. Contains:
- Monorepo overview
- Build system documentation
- Development environment setup
- Links to all app/package AGENTS.md files
- How AGENTS.md works explanation

### App AGENTS.md (apps/*/AGENTS.md)

One per application. Contains:
- Application purpose and tech stack
- Key entry points and scripts
- Environment variables
- Local development commands
- Links to relevant docs/

### Package AGENTS.md (packages/*/AGENTS.md)

One per package. Contains:
- Package purpose and exports
- Dependencies and peer dependencies
- Configuration files
- Usage patterns
- Links to relevant docs/

### AGENTS.override.md

Temporary override files for team-specific needs. Created in any directory.

## Creating an Override File

When you need to temporarily modify conventions:

```bash
# Create override in your working directory
touch AGENTS.override.md
```

Example content:

```markdown
# Temporary Override: Feature Branch X

> This file contains temporary guidance for the feature-X branch.
> Remove this file when the feature is complete.

## Additional Context

While working on feature-X, use these additional conventions:

- Always run tests before committing: `turbo run test`
- Use the experimental API pattern in `packages/trpc/src/experimental/`
```

## Best Practices

### Keep Files Concise

| File Type | Target Size |
|-----------|-------------|
| Root AGENTS.md | 5-8 KiB |
| Per-app/package | 2-4 KiB |
| Override files | < 1 KiB |

**Why**: OpenAI's default instruction limit is 32 KiB combined.

### Focus on High-Level Guidance

- **Do**: Document conventions, architecture, and workflow
- **Don't**: Document every function or class (use JSDoc)
- **Do**: Link to detailed docs in `docs/` folder
- **Don't**: Duplicate content from docs/

### Use Consistent Structure

**Root AGENTS.md structure:**
```markdown
# Project Name - Agent Guide

## Project Overview
## Monorepo Structure
## Build System
## Development Environment
## How AGENTS.md Works
## App & Package AGENTS.md Files
## Documentation Structure
```

**App/Package AGENTS.md structure:**
```markdown
# App/Package Name - Agent Guide

> Inherited Conventions: [link to parent AGENTS.md]

## Purpose
## Tech Stack
## Key Files
## Development Commands
## Environment Variables
## Overrides to Root Conventions
```

### Cross-Reference with Docs/

Use relative links to connect AGENTS.md to detailed documentation:

```markdown
For detailed setup instructions, see [docs/development/setup.md](../docs/development/setup.md)
```

### Remove Temporary Overrides

When the specific need passes:

```bash
# Remove override file
git rm AGENTS.override.md
git commit -m "Remove temporary override for feature-X"
```

## When to Update AGENTS.md

### Update When

- Adding new apps or packages
- Changing build system or scripts
- Updating development workflow
- Changing architectural patterns
- Adding new conventions

### Don't Update When

- Changing implementation details (use code comments)
- Adding new functions (use JSDoc)
- Fixing bugs (document in commit message)

## Size Monitoring

Check the combined size:

```bash
# Calculate total size
cat AGENTS.md apps/*/AGENTS.md packages/*/AGENTS.md | wc -c

# Convert to KiB
cat AGENTS.md apps/*/AGENTS.md packages/*/AGENTS.md | wc -c | awk '{print $1/1024 " KiB"}'
```

Target: Under 32 KiB combined.

## Example: Adding a New Package

1. Create `packages/my-package/AGENTS.md`:

```markdown
# @mirai-app/my-package - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md)

## Purpose

Brief description of what this package does.

## Exports

- `main` - Main functionality
- `utils` - Utility functions

## Dependencies

- `@mirai-app/shared` - Shared utilities

## Development Commands

```bash
bun run build     # Build package
bun run test      # Run tests
```

## Links

- [Detailed docs](../../docs/packages/my-package/README.md)
```

2. Add link in root AGENTS.md:

```markdown
## Package AGENTS.md Files

- [packages/my-package/AGENTS.md](./packages/my-package/AGENTS.md)
```

3. Create docs/ if needed:

```bash
mkdir -p docs/packages/my-package
# Add detailed documentation
```

## Further Reading

- [OpenAI's AGENTS.md Guidelines](https://platform.openai.com/docs/guides/agents)
- [Root AGENTS.md](../../AGENTS.md)
- [Architecture Overview](../architecture/monorepo.md)
