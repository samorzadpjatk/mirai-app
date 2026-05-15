FROM oven/bun:1.3.14-slim AS bundler
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun build --compile --minify --splitting "apps/notification-sender/src/index.ts" --outfile ./out/app
RUN chmod +x ./out/app

FROM gcr.io/distroless/base-debian13:nonroot AS runtime
ENV NODE_ENV=production
COPY --from=bundler --chown=nonroot:nonroot /app/out/app ./app
CMD ["./app"]
