# Devfile Design for Eclipse Che

## Overview

Custom devfile for the Mirai App monorepo to enable cloud-based development in Eclipse Che with all necessary toolchain pre-configured.

**Goal:** One-click workspace creation with Bun 1.3.6, PostgreSQL 16, and Che-Code editor ready for development.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Eclipse Che Workspace                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │   dev-tools         │  │    postgresql              │  │
│  │   (UBI10 + Bun)     │  │    (PostgreSQL 16)         │  │
│  │                     │  │                             │  │
│  │   - Bun 1.3.6       │  │    - mirai_dev database     │  │
│  │   - git, curl, jq   │  │    - User: mirai            │  │
│  │   - pg client       │  │    - Pass: miraidev         │  │
│  │   - Project code    │◄─┤    - Port 5432              │  │
│  │     mounted at      │  │                             │  │
│  │     /projects       │  │                             │  │
│  │                     │  │                             │  │
│  └──────────┬──────────┘  └─────────────────────────────┘  │
│             │                                                │
│  ┌──────────▼────────────────────────────────────────────┐  │
│  │              Che-Code Editor                          │  │
│  │  - TypeScript support                                 │  │
│  │  - GraphQL extension                                  │  │
│  │  - PostgreSQL tools                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Container Strategy

| Container  | Image                                        | Purpose                 | Memory |
| ---------- | -------------------------------------------- | ----------------------- | ------ |
| dev-tools  | `ghcr.io/samorzadpjatk/mirai-app-dev:latest` | Development environment | 4Gi    |
| postgresql | `postgres:16-alpine`                         | Local database          | 512Mi  |

---

## Components

### 1. dev-tools Container

**Base Image:** `registry.access.redhat.com/ubi10/ubi:latest`  
**Published Image:** `ghcr.io/samorzadpjatk/mirai-app-dev:latest`

**Installed Tools:**

- Bun 1.3.6 (matching `package.json` `packageManager` field)
- git, curl, unzip, jq, which
- PostgreSQL 16 client (`psql`, `pg_dump`)

**Environment Variables:**

```yaml
DATABASE_URL=postgres://mirai:miraidev@postgresql:5432/mirai_dev
```

**Resource Limits:**

- Memory: 2Gi request / 4Gi limit
- CPU: 1000m request / 2000m limit

### 2. PostgreSQL Sidecar

**Image:** `postgres:16-alpine`  
**Purpose:** Local development database isolated from workspace

**Configuration:**

- User: `mirai`
- Password: `miraidev`
- Database: `mirai_dev`
- Port: 5432 (internal)

**Persistence:** Ephemeral volume (data survives workspace restart, not deletion)

### 3. Che-Code Editor

**Plugin:** `che-incubator/che-code/latest`

**Extensions (pre-configured via workspace settings):**

- GraphQL.vscode-graphql
- GraphQL.vscode-graphql-syntax
- ckolkman.vscode-postgres
- oven.bun-vscode

---

## Commands

### Initialization Commands (auto-run on workspace start)

| Command ID       | Description                            | Runs On     |
| ---------------- | -------------------------------------- | ----------- |
| `init-database`  | PostgreSQL container startup message   | `postStart` |
| `install-deps`   | `bun install --frozen-lockfile`        | `postStart` |
| `setup-database` | `bunx drizzle-kit push` to sync schema | `postStart` |

### Development Commands (user-triggered)

| Command ID         | Command                           | Description                |
| ------------------ | --------------------------------- | -------------------------- |
| `dev-backend`      | `bun run dev:backend`             | Start backend server       |
| `dev-web`          | `bun run dev:web`                 | Start web application      |
| `dev-notification` | `bun run dev:notification-sender` | Start notification service |
| `test-unit`        | `bun run test:unit`               | Run unit tests             |
| `test-integration` | `bun run test:integration`        | Run integration tests      |
| `test-coverage`    | `bun run test:coverage`           | Run tests with coverage    |
| `typecheck`        | `bun run typecheck`               | TypeScript type checking   |
| `lint`             | `bun run lint`                    | ESLint linting             |
| `format-check`     | `bun run format:check`            | Prettier format check      |
| `depcruise`        | `bun run depcruise`               | Dependency validation      |

---

## Endpoints

| Name           | Port | Exposure | Purpose                      |
| -------------- | ---- | -------- | ---------------------------- |
| `backend-api`  | 3000 | Public   | Backend GraphQL/tRPC API     |
| `web-app`      | 3001 | Public   | Web application preview      |
| `native-metro` | 8081 | Public   | Metro bundler for native app |
| `postgresql`   | 5432 | None     | Internal database access     |

---

## Files Structure

```
.devfile/
├── devfile.yaml          # Main devfile definition
├── Dockerfile            # Custom UBI10 + Bun image
└── .che/
    └── editor-config.yaml # Che-Code extensions config

.github/
└── workflows/
    └── devfile-image.yml  # CI to build/push image to GHCR
```

---

## Custom Dockerfile

```dockerfile
FROM registry.access.redhat.com/ubi10/ubi:latest

# Install base development tools
RUN dnf install -y \
    git \
    curl \
    unzip \
    jq \
    which \
    postgresql16 \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# Install Bun 1.3.6 (matches monorepo package.json)
ENV BUN_VERSION=1.3.6
ENV BUN_INSTALL=/root/.bun
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}" \
    && ln -s ${BUN_INSTALL}/bin/bun /usr/local/bin/bun

ENV PATH="${BUN_INSTALL}/bin:${PATH}"

# Verify installation
RUN bun --version

# Set working directory for projects
WORKDIR /projects

# Default command
CMD ["tail", "-f", "/dev/null"]
```

---

## GitHub Actions CI

**File:** `.github/workflows/devfile-image.yml`

```yaml
name: Build Devfile Image

on:
  push:
    branches: [main]
    paths:
      - ".devfile/Dockerfile"
      - ".devfile/**"
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}-dev

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest
            type=raw,value=ubi10-bun1.3.6
            type=sha,prefix=ubi10-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .devfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

---

## Usage Instructions

### For Developers

1. **Open Eclipse Che dashboard**
2. **Create Workspace from Devfile:**
   - URL: `https://raw.githubusercontent.com/samorzadpjatk/mirai-app/main/.devfile/devfile.yaml`
   - Or use factory link: `https://che-host.com/f?url=https://github.com/samorzadpjatk/mirai-app`

3. **Wait for initialization** (2-3 minutes):
   - Image pulls
   - Dependencies install (`bun install`)
   - Database schema pushed (`drizzle-kit push`)

4. **Start developing:**
   - Run `dev-backend` command to start API
   - Run `dev-web` command to start web app
   - Click endpoint URLs in Che dashboard for previews

### For Maintainers

**Update dev image:**

```bash
# Edit .devfile/Dockerfile
git add .devfile/
git commit -m "chore: update Bun to 1.3.7"
git push origin main
# CI automatically builds and pushes new image
```

**Manual build:**

```bash
cd .devfile
docker build -t ghcr.io/samorzadpjatk/mirai-app-dev:latest .
docker push ghcr.io/samorzadpjatk/mirai-app-dev:latest
```

---

## Testing Strategy

| Test Level              | Method                | Success Criteria                            |
| ----------------------- | --------------------- | ------------------------------------------- |
| **Image build**         | GitHub Actions        | Dockerfile builds without errors            |
| **Devfile schema**      | `devfile validate`    | Valid devfile v2.2 schema                   |
| **Workspace start**     | Eclipse Che           | All containers start, init commands succeed |
| **Database connection** | Drizzle push          | Schema syncs to PostgreSQL                  |
| **App startup**         | `bun run dev:backend` | Backend API responds on port 3000           |
| **Integration**         | Full workflow         | Can run `bun test:unit` successfully        |

---

## YAGNI Decisions

**NOT included (to keep it simple):**

- ❌ pgAdmin web interface (use `psql` or VS Code extension)
- ❌ Redis (add later if needed)
- ❌ Kubernetes tools (kubectl, helm) - not needed for local dev
- ❌ Docker-in-Docker (complex, rarely needed)
- ❌ Custom VS Code themes (developer preference)
- ❌ Non-root user (can add later if security requires)

**Included (essential only):**

- ✅ Bun 1.3.6 (required by package.json)
- ✅ PostgreSQL 16 (database required for development)
- ✅ Drizzle ORM client (schema management)
- ✅ Basic dev tools (git, curl, jq)
- ✅ TypeScript/GraphQL support in editor

---

## Error Handling

| Scenario             | Behavior                            |
| -------------------- | ----------------------------------- |
| Image pull fails     | Che shows error, user can retry     |
| `bun install` fails  | Command fails visibly in terminal   |
| PostgreSQL not ready | `setup-database` retries connection |
| DATABASE_URL wrong   | Drizzle push fails with clear error |
| Port already in use  | Bun shows error, suggest other port |

---

## References

- **Eclipse Che Devfile Specification:** https://devfile.io/
- **Developer Images Repository:** https://github.com/devfile/developer-images
- **Bun Installation:** https://bun.sh/docs/installation
- **PostgreSQL Docker:** https://hub.docker.com/_/postgres
- **UBI10 Documentation:** https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/10

---

## Design Decisions Log

| Date       | Decision              | Rationale                              |
| ---------- | --------------------- | -------------------------------------- |
| 2026-04-13 | UBI10 base            | Latest CVE patches, future-proof       |
| 2026-04-13 | GHCR for images       | Integrated with GitHub, no extra auth  |
| 2026-04-13 | PostgreSQL sidecar    | Clean separation, easy to manage       |
| 2026-04-13 | 4Gi memory limit      | Enough for Bun + multiple apps + Turbo |
| 2026-04-13 | Frozen lockfile       | Consistent with monorepo CI            |
| 2026-04-13 | Drizzle push auto-run | Database ready on workspace start      |

---

**Status:** Ready for implementation  
**Version:** 1.0.0  
**Author:** AI Assistant (Claude)  
**Reviewed by:** User
