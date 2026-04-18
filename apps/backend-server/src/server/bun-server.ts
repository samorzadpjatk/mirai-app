import { Effect } from "effect";
import type { ServerWebSocket } from "bun";
import type { Hono } from "hono";
import { ServerStartupError } from "../errors";
import { serverState } from "../state";
import { graphqlWSHandler, handleProtocols } from "./websocket";

/**
 * Bun Server Configuration
 */
export interface BunServerConfig {
  port: number;
  app: Hono;
}

/**
 * Create Bun HTTP server with WebSocket support
 */
export const createBunServer = (config: BunServerConfig) =>
  Effect.try({
    try: () => {
      const server = Bun.serve({
        port: config.port,
        fetch(req: Request, server: Bun.Server<undefined>) {
          // Handle WebSocket upgrade requests for GraphQL subscriptions
          const upgradeHeader = req.headers.get("upgrade");
          if (upgradeHeader === "websocket") {
            const url = new URL(req.url);
            if (url.pathname === "/graphql") {
              const protocols = req.headers.get("sec-websocket-protocol") || "";
              if (!handleProtocols(protocols)) {
                return new Response("Bad Request: unsupported WebSocket protocol", { status: 400 });
              }

              const success = server.upgrade(req);
              if (success) {
                return undefined;
              }
              return new Response("WebSocket upgrade failed", { status: 500 });
            }
          }

          // Handle HTTP requests via Hono
          return config.app.fetch(req, server);
        },
        websocket: {
          open(ws: ServerWebSocket<undefined>) {
            serverState.wsConnections.add(ws);
            Effect.runSync(Effect.log("WebSocket connection opened for GraphQL subscriptions"));
            graphqlWSHandler.open(ws);
          },
          message(ws: ServerWebSocket<undefined>, message: string | Buffer) {
            const msgStr = message.toString();
            Effect.runSync(Effect.log("WebSocket message received").pipe(
              Effect.annotateLogs({ message: msgStr.substring(0, 100) })
            ));
            graphqlWSHandler.message(ws, message);
          },
          close(ws: ServerWebSocket<undefined>, code: number, reason: string) {
            serverState.wsConnections.delete(ws);
            Effect.runSync(Effect.log("WebSocket connection closed").pipe(
              Effect.annotateLogs({ code, reason })
            ));
            graphqlWSHandler.close(ws, code, reason);
          },
        },
      });

      return server;
    },
    catch: (error) => new ServerStartupError({ cause: error, phase: "server" }),
  });
