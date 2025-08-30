FROM node:24-alpine AS base

WORKDIR /usr/src/app

COPY package.json package-lock.json prisma/ ./

RUN npm ci

COPY . .

CMD ["sh", "-c", "npm run db:migrate && npm run start"]