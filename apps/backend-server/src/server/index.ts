import { Effect } from "effect";
import { createHonoApp } from "./hono";
import { createYogaServer, mountGraphQLEndpoint } from "./graphql";
import { createBunServer } from "./bun-server";
import { serverState } from "../state";

/**
 * Start the server on the given port
 */
export const startServer = (port: number) =>
  Effect.gen(function* () {
    const app = yield* createHonoApp();
    const yoga = yield* createYogaServer();
    yield* mountGraphQLEndpoint(app, yoga);

    const server = yield* createBunServer({ port, app });
    serverState.server = server;

    yield* Effect.log(`Server listening on port ${port}`);
    yield* Effect.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
    yield* Effect.log(`Health check: http://localhost:${port}/health`);
    yield* Effect.log(`GraphQL WebSocket: ws://localhost:${port}/graphql`);

    return server;
  });
