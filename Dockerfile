# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8

FROM ${NODE_IMAGE} AS build
WORKDIR /usr/src/app

# Install all deps (incl dev) for building
COPY package*.json ./
RUN npm ci

# Build
COPY . .
# If you don't have a build step, remove the next line
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy build output (adjust "dist" to your output dir)
COPY --from=build /usr/src/app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
