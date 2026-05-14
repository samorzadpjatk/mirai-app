ARG PACKAGE
ARG PORT

FROM oven/bun:1.3.14-slim AS builder
ARG PACKAGE
WORKDIR /repo
ENV CI=true
COPY . .
RUN bun install --frozen-lockfile
RUN bunx nx build @mirai-app/$PACKAGE

FROM oven/bun:1.3.14-slim AS bundler
ARG PACKAGE
WORKDIR /app
COPY --from=builder /repo ./
RUN --mount=type=cache,id=bun-cache,target=/root/.bun \
    bun install --frozen-lockfile
ENV ENTRY=src/index.ts
RUN bun build --compile --minify --splitting "apps/${PACKAGE}/${ENTRY}" --outfile ./out/app
RUN chmod +x ./out/app

FROM gcr.io/distroless/base-debian13:nonroot AS runtime
ENV NODE_ENV=production
COPY --from=bundler --chown=nonroot:nonroot /app/out/app ./app
EXPOSE ${PORT}
CMD ["./app"]
