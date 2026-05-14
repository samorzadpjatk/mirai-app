# Build-time args:
# - PACKAGE: the package name to build (eg. backend-server)
#
# Example:
# docker build -t myapp \
#   --build-arg PACKAGE=backend-server .

ARG PACKAGE
ARG PORT
# ---------- PRUNE (keeps only necessary files for the package) ----------
FROM oven/bun:1.3.14-slim AS pruner
ARG PACKAGE
WORKDIR /repo
ENV CI=true
# Install npm so turbo's fallback binary installer works when cross-platform
# optional dependencies are missing from the lockfile.
RUN apt-get update && apt-get install -y npm && rm -rf /var/lib/apt/lists/*
COPY . .
# Re-resolve platform-specific optional deps (esbuild, turbo) for Linux
RUN bun install
RUN bun run turbo prune @mirai-app/$PACKAGE --docker

# ---------- BUNDLER (compile single executable from TypeScript sources) ----------
FROM oven/bun:1.3.14-slim AS bundler
ARG PACKAGE
WORKDIR /app
# copy pruned package json (for accurate deps) and package sources
COPY --from=pruner /repo/out/full ./
# turbo prune strips root-level files; tsconfig.base.json is required
# by every workspace package ("extends": "../../tsconfig.base.json")
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json
# install dependencies inside bundler (use bun cache)
RUN --mount=type=cache,id=bun-cache,target=/root/.bun \
    bun install --frozen-lockfile
# fixed entry and use bun exec to build single executable under ./out/app
ENV ENTRY=src/index.ts
RUN bun build --compile --minify --splitting "apps/${PACKAGE}/${ENTRY}" --outfile ./out/app
RUN chmod +x ./out/app

# ---------- DISTROLESS RUNTIME (single, tiny image) ----------
FROM gcr.io/distroless/base-debian13:nonroot AS runtime
ENV NODE_ENV=production
# Copy the single executable from bundler and ensure correct mode
COPY --from=bundler --chown=nonroot:nonroot /app/out/app ./app
EXPOSE ${PORT}
CMD ["./app"]
