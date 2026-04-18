import { Effect } from "effect";
import { makeHandler, handleProtocols } from "graphql-ws/use/bun";
import { schema } from "@mirai-app/frameworks/graphql";

/**
 * GraphQL WebSocket protocol handler
 * Implements graphql-ws protocol for Bun
 */
export const graphqlWSHandler = makeHandler({
  schema,
  // Context is created per operation from the connection init payload
  context: async (ctx) => {
    const connectionParams = ctx.connectionParams || {};
    return {
      authContext: connectionParams.authContext || undefined,
      extra: ctx.extra,
    };
  },
  // Allow all connections initially; auth is checked per-operation
  onConnect: async () => true,
  // Handle disconnect
  onDisconnect: async () => {
    Effect.runSync(Effect.log("WebSocket client disconnected"));
  },
  // Handle subscription errors
  onError: async (_ctx, message) => {
    Effect.runSync(Effect.logError("WebSocket subscription error").pipe(
      Effect.annotateLogs({ message })
    ));
  },
});

export { handleProtocols };
