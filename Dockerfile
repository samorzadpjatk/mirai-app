FROM node:24-alpine AS base

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

COPY apps/web/package.json ./apps/web/
COPY apps/web/prisma/ ./apps/web/prisma/

RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY apps/web/ ./apps/web/

WORKDIR /usr/src/app/apps/web
RUN pnpm build

CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]