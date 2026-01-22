import ws from "@fastify/websocket";
import cors from "@fastify/cors";
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import fastify, { type FastifyRequest } from "fastify";
import { type AppRouter, appRouter } from "@integral-2025-app/trpc";
import { createTRPCContext } from "@integral-2025-app/trpc";
import { fastifyHeadersToFetchHeaders } from "./utils/headers";

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
  host?: string;
}

export function createServer(opts: ServerOptions) {
  const dev = opts.dev ?? true;
  const port = opts.port ?? 3000;
  const prefix = opts.prefix ?? "/trpc";
  const host = opts.host ?? "127.0.0.1";
  const server = fastify({ logger: dev });

  if (dev) {
    void server.register(cors, {
      origin: true,
      credentials: true,
    });
  }

  void server.register(ws);
  void server.register(fastifyTRPCPlugin, {
    prefix,
    useWSS: true,
    trpcOptions: {
      router: appRouter,
      // For HTTP requests Fastify passes only { req }.
      // For WebSocket connections tRPC additionally forwards `connectionParams`
      // coming from the client-side `createWSClient`.
      createContext: (opts: {
        req: FastifyRequest;
        connectionParams?: unknown;
      }) => {
        const { req, connectionParams } = opts;
        const supabaseUrl =
          process.env.SUPABASE_URL ??
          process.env.EXPO_PUBLIC_SUPABASE_URL ??
          "";
        const supabaseKey =
          process.env.SUPABASE_KEY ??
          process.env.SUPABASE_ANON_KEY ??
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
          "";

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(
            "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_ANON_KEY).",
          );
        }

        // Extract headers and add the original URL for auth token parsing
        const headers = fastifyHeadersToFetchHeaders(req.headers);

        // Add URL to headers for WebSocket auth token extraction from query params
        // This is a workaround for WebSocket connections that can't send custom headers
        if (req.url) {
          headers.set("x-original-url", req.url);
        }

        return createTRPCContext({
          headers,
          supabaseUrl,
          supabaseKey,
          connectionParams,
        });
      },
      onError({ path, error }) {
        // report to error monitoring
        console.error(`Error in tRPC handler on path '${path}':`, error);
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  server.get("/health", () => {
    return "OK";
  });

  const stop = async () => {
    await server.close();
  };
  const start = async () => {
    try {
      await server.listen({ port, host });
      console.log("listening on port", port);
      console.log(`tRPC endpoint ready at http://${host}:${port}${prefix}`);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  return { server, start, stop };
}
