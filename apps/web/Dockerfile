# Dockerfile for web (Astro SSR on Bun runtime)
#
# Unlike the root Dockerfile which compiles to a single binary,
# Astro SSR requires node_modules at runtime.
#
# Example:
#   docker build -t web -f apps/web/Dockerfile \
#     --build-arg PUBLIC_SUPABASE_URL=http://localhost:8000 \
#     --build-arg PUBLIC_SUPABASE_ANON_KEY=<key> \
#     --build-arg PUBLIC_TRPC_API_URL=http://localhost:2022/api/trpc \
#     --build-arg PUBLIC_TRPC_WS_URL=ws://localhost:2022/api/trpc .

# ---------- PRUNE (keeps only necessary files for the package) ----------
FROM oven/bun:1.3.6-slim AS pruner
WORKDIR /repo
ENV CI=true
COPY . .
RUN bun install --frozen-lockfile
RUN bun run turbo prune @mirai-app/web --docker

# ---------- BUILDER (install deps + build Astro SSR) ----------
FROM oven/bun:1.3.6-slim AS builder
# Public env vars are inlined into client-side JS at build time
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_TRPC_API_URL
ARG PUBLIC_TRPC_WS_URL
WORKDIR /app
COPY --from=pruner /repo/out/full ./
COPY --from=pruner /repo/tsconfig.base.json ./
RUN --mount=type=cache,id=bun-cache,target=/root/.bun \
    bun install --frozen-lockfile
RUN bun run turbo run build --filter=@mirai-app/web

# ---------- RUNTIME (Distroless) ----------
FROM gcr.io/distroless/cc-debian12:nonroot AS runtime
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun
COPY --from=builder /app /app
USER nonroot:nonroot
EXPOSE 4321
CMD ["/usr/local/bin/bun", "run", "dist/server/entry.mjs"]
