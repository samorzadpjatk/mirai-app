import { Effect, type Layer } from "effect";
import { createHonoApp } from "./hono";
import { createYogaServer, mountGraphQLEndpoint } from "./graphql";
import { createBunServer } from "./bun-server";
import { serverState } from "../state";

/**
 * Server configuration
 */
export interface ServerConfig {
  port: number;
  appLayer: Layer.Layer<unknown, never, never>;
}

/**
 * Start the server on the given port
 */
export const startServer = (config: ServerConfig) =>
  Effect.gen(function* () {
    const app = yield* createHonoApp();
    const yoga = yield* createYogaServer({ appLayer: config.appLayer });
    yield* mountGraphQLEndpoint(app, yoga);

    const server = yield* createBunServer({ port: config.port, app });
    serverState.server = server;

    yield* Effect.log(`Server listening on port ${config.port}`);
    yield* Effect.log(`GraphQL endpoint: http://localhost:${config.port}/graphql`);
    yield* Effect.log(`Health check: http://localhost:${config.port}/health`);
    yield* Effect.log(`GraphQL WebSocket: ws://localhost:${config.port}/graphql`);

    return server;
  });
