# Build-time args:
# - PACKAGE: the package name to build (eg. backend-server)
#
# Example:
# docker build -t myapp \
#   --build-arg PACKAGE=backend-server .

ARG PACKAGE
ARG PORT
# ---------- PRUNE (keeps only necessary files for the package) ----------
FROM oven/bun:slim AS pruner
ARG PACKAGE
WORKDIR /repo
ENV CI=true
COPY . .
RUN bun install --frozen-lockfile
RUN bun run turbo prune @mirai-app/$PACKAGE --docker

# ---------- BUNDLER (compile single executable from TypeScript sources) ----------
FROM oven/bun:slim AS bundler
ARG PACKAGE
WORKDIR /app
# copy pruned package json (for accurate deps) and package sources
COPY --from=pruner /repo/out/full ./
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
