FROM oven/bun:1.3.14-slim AS bundler
WORKDIR /app
COPY . .
RUN bun install
RUN bun build --compile --minify --splitting "apps/backend-server/src/index.ts" --outfile ./out/app
RUN chmod +x ./out/app

FROM gcr.io/distroless/base-debian13:nonroot AS runtime
ENV NODE_ENV=production
ENV MIGRATIONS_FOLDER=/drizzle
COPY --from=bundler --chown=nonroot:nonroot /app/out/app ./app
COPY --from=bundler /app/packages/db/drizzle /drizzle
EXPOSE 2022
CMD ["./app"]
