# Development Setup

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Bun 1.3.6+** - Package manager and runtime
- **Node.js 24+** - For tooling compatibility
- **Git** - Version control

### Optional

- **Docker** - For local PostgreSQL database
- **Xcode** (macOS) - For iOS development
- **Android Studio** - For Android development

## Installing Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pjapp
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
bun install
```

### 3. Set Up Environment Variables

```bash
# Copy environment templates
cp environment/.env.dev.example environment/.env.dev
cp environment/.env.prod.example environment/.env.prod

# Edit the files with your configuration
```

### 4. Set Up Database (Optional)

Using Docker:

```bash
# Start PostgreSQL
docker run -d \
  --name mirai-postgres \
  -e POSTGRES_USER=mirai \
  -e POSTGRES_PASSWORD=mirai \
  -e POSTGRES_DB=mirai \
  -p 5432:5432 \
  postgres:15
```

Or use your local PostgreSQL installation.

### 5. Run Database Migrations

```bash
# Navigate to seed app
cd apps/seed

# Run migrations
bun run db:migrate:dev

# Seed the database (optional)
bun run db:seed:dev
```

## Development Workflows

### Start All Apps

```bash
nx run-many -t dev
```

This starts all development servers in parallel.

### Start Specific Apps

```bash
# Backend server only
nx run @mirai-app/backend-server:dev

# Native app only
nx run @mirai-app/native:dev

```

### Development URLs

| App | URL |
|-----|-----|
| Backend Server | http://localhost:3000 |
| Native App | Use Expo Go app on device |

## Nx Graph and Project Inspection

```bash
# Show dependency graph
nx graph

# Show project details
nx show project @mirai-app/native

# Show all projects
nx show projects

# Run on changed projects (CI)
nx affected -t build
```

## IDE Setup

### VS Code

The project includes VS Code settings in `.vscode/`:

- **TypeScript**: Configured for monorepo
- **ESLint**: Enabled for all packages
- **Prettier**: Enabled for consistent formatting

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Drizzle ORM (optional, for schema editing)

## Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Bun Install Fails

```bash
# Clear cache
bun pm cache rm

# Reinstall
bun install
```

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset

# Run without cache
nx run-many -t build --skip-nx-cache
```

### Type Errors

```bash
# Run typecheck on all packages
nx run-many -t typecheck

# Check specific package
nx run @mirai-app/orpc:typecheck
```

## Next Steps

- See [Environment Variables](./environment.md) for configuration details
- See [Scripts Guide](./scripts.md) for available commands
- See [AGENTS.md Guide](./agents-md-guide.md) for working with AGENTS.md files
