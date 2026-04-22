# AGENTS.md Conventions

## Overview

Best practices for creating and maintaining AGENTS.md files in the MIRAI monorepo.

## File Structure

### Root AGENTS.md

```markdown
# [Project] - Agent Guide

> **AI Assistant Context:** Brief description

## Project Overview
High-level description

## Monorepo Structure
Directory tree

## Build System
Commands and tools

## Development Environment
Setup instructions

## How AGENTS.md Works
Discovery pattern explanation

## App & Package AGENTS.md Files
Links to child AGENTS.md

## Documentation Structure
Links to docs/
```

### App/Package AGENTS.md

```markdown
# [Package/App] - Agent Guide

> **Inherited Conventions:** Link to parent
> 
> **Overrides:** List any overrides

## Purpose
What this does

## Tech Stack
Tools used

## Key Files
Important files

## Development Commands
Scripts

## Environment Variables
Required config

## Dependencies
Internal and external

## Overrides to Root Conventions
What's different

## Links
Relevant documentation
```

## Writing Style

### Be Concise

- Keep sentences short
- Use bullet points
- Avoid unnecessary words

### Be Specific

```markdown
<!-- Good -->
Start dev server: `bun run dev`

<!-- Avoid -->
To start the development server, you should run the appropriate command.
```

### Use Imperative

```markdown
<!-- Good -->
Install dependencies: `bun install`

<!-- Avoid -->
You should install the dependencies.
```

## Required Sections

### All AGENTS.md Files

- [ ] **Inherited Conventions** - Link to parent AGENTS.md
- [ ] **Purpose** - What this package/app does
- [ ] **Development Commands** - Key scripts

### Root Only

- [ ] **How AGENTS.md Works** - Discovery pattern
- [ ] **Instruction Size Guidelines** - Size limits
- [ ] **Links to all child** AGENTS.md files

## Relative Links

Always use relative paths:

```markdown
<!-- Good -->
[Root AGENTS.md](../../AGENTS.md)
[Setup guide](../../docs/development/setup.md)

<!-- Avoid -->
[Root](/AGENTS.md)
[Setup](https://github.com/.../setup.md)
```

## Size Guidelines

| File Type | Target Size | Max Size |
|-----------|-------------|----------|
| Root AGENTS.md | 5-8 KiB | 10 KiB |
| App/Package | 2-4 KiB | 5 KiB |
| Override | < 1 KiB | 2 KiB |

### Checking Size

```bash
# Check file size
ls -lh AGENTS.md

# Check all AGENTS.md files
cat AGENTS.md apps/*/AGENTS.md packages/*/AGENTS.md | wc -c
```

## Common Mistakes

### Too Much Detail

```markdown
<!-- Avoid - too detailed -->
## API

### User.create
Parameters:
- email (string, required) - User's email address
- name (string, optional) - User's full name
- role (enum: 'user'|'admin', default: 'user') - User role

Returns: User object with id, email, name, role, createdAt, updatedAt
```

```markdown
<!-- Good - concise -->
## API

See [tRPC documentation](../../docs/packages/trpc/procedures.md)
```

### Missing Links

```markdown
<!-- Avoid - no links -->
## Dependencies
- @mirai-app/db
- @mirai-app/auth
```

```markdown
<!-- Good - with links -->
## Dependencies
- [@mirai-app/db](../../packages/db/AGENTS.md)
- [@mirai-app/auth](../../packages/auth/AGENTS.md)
```

### No Context

```markdown
<!-- Avoid -->
# Auth Package

This is the auth package.
```

```markdown
<!-- Good -->
# @mirai-app/auth - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md)

## Purpose
Authentication utilities and state management for the MIRAI application.
```

## Override Files

### When to Create

- Temporary team-specific rules
- Experimental patterns
- Feature branch conventions

### Template

```markdown
# Temporary Override: [Purpose]

> **Status**: [In Progress/Complete]  
> **Scope**: [Directory path]  
> **Created**: [Date]  
> **Remove when**: [Condition]

## Temporary Conventions

### [Rule Name]
- What to do
- What to avoid

## Context

Brief explanation of why this override exists.
```

## Maintenance

### Update When

- Adding new apps/packages
- Changing build scripts
- Updating dependencies
- Modifying architecture

### Review Schedule

- Monthly: Check for outdated information
- Quarterly: Review all AGENTS.md files
- Before releases: Update any changed conventions

## Template for New Files

Copy and adapt:

```markdown
# @mirai-app/[name] - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md)

## Purpose

Brief description.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | Main exports |

## Tech Stack

- Tool 1
- Tool 2

## Key Files

```
packages/[name]/
├── src/
│   └── index.ts
└── AGENTS.md
```

## Development Commands

```bash
bun run dev
bun run build
bun run test
```

## Dependencies

### Internal

- Package 1

### External

- Dependency 1

## Links

- [Root AGENTS.md](../../AGENTS.md)
```

## Further Reading

- [Root AGENTS.md](../../AGENTS.md)
- [AGENTS.md Guide](../../docs/development/agents-md-guide.md)
