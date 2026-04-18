import { Effect, type Layer } from "effect";
import { createHonoApp } from "./hono";
import { createYogaServer, mountGraphQLEndpoint } from "./graphql";
import { createBunServer } from "./bun-server";
import { serverState } from "../state";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { BetterAuthInstance } from "@mirai-app/frameworks/better-auth";

/**
 * Server configuration
 */
export interface ServerConfig {
  port: number;
  appLayer: Layer.Layer<never>;
  db: DrizzleDb;
  betterAuth: BetterAuthInstance;
}

/**
 * Start the server on the given port
 */
export const startServer = (config: ServerConfig) =>
  Effect.gen(function* () {
    const app = yield* createHonoApp({ betterAuth: config.betterAuth });
    const yoga = yield* createYogaServer({
      appLayer: config.appLayer,
      db: config.db,
      betterAuth: config.betterAuth,
    });
    yield* mountGraphQLEndpoint(app, yoga);

    const server = yield* createBunServer({ port: config.port, app });
    serverState.server = server;

    yield* Effect.log(`Server listening on port ${config.port}`);
    yield* Effect.log(`GraphQL endpoint: http://localhost:${config.port}/api/graphql`);
    yield* Effect.log(`Health check: http://localhost:${config.port}/health`);
    yield* Effect.log(`GraphQL WebSocket: ws://localhost:${config.port}/api/graphql`);
    if (config.betterAuth) {
      yield* Effect.log(`Better Auth endpoints: http://localhost:${config.port}/api/auth/*`);
    }

    return server;
  });
