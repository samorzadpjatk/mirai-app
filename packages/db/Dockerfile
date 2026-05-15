FROM oven/bun:1.3.14-slim AS pruner

WORKDIR /repo
ENV CI=true

COPY . .
RUN bun install --frozen-lockfile
RUN bunx nx build @mirai-app/db

FROM oven/bun:1.3.14-slim AS runner

WORKDIR /app
ENV CI=true

COPY --from=pruner /repo/node_modules ./node_modules
COPY --from=pruner /repo/packages/db ./packages/db
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json

WORKDIR /app/packages/db
CMD ["bun", "run", "db:migrate"]
