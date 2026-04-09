import ws from "@fastify/websocket";
import cors from "@fastify/cors";
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import fastify, { type FastifyRequest } from "fastify";
import { type AppRouter, appRouter, createTRPCContext } from "@mirai-app/adapters";
import { createDb } from "@mirai-app/frameworks/prisma";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import { fastifyHeadersToFetchHeaders } from "./utils/headers";
import { initializeContainer, AppModule } from "@mirai-app/frameworks/di";

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

  // =============================================================================
  // Initialize Dependency Injection Container
  // =============================================================================
  // Initialize the awilix-modular container with AppModule before setting up
  // tRPC routes. This makes all registered services (repositories, use cases,
  // controllers) available for request-scoped resolution.
  try {
    initializeContainer([AppModule]);
    console.log("[DI] Container initialized successfully with AppModule");
  } catch (error) {
    console.error("[DI] Failed to initialize container:", error);
    throw new Error(
      "Container initialization failed. Ensure AppModule is properly configured.",
    );
  }

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
        connectionParams?: Record<string, string>;
      }) => {
        const { req, connectionParams } = opts;

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const databaseUrl = process.env.DATABASE_URL;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(
            "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
          );
        }

        if (!databaseUrl) {
          throw new Error("Missing database credentials. Set DATABASE_URL.");
        }

        // Extract headers and add the original URL for auth token parsing
        const headers = fastifyHeadersToFetchHeaders(req.headers);

        // Add URL to headers for WebSocket auth token extraction from query params
        // This is a workaround for WebSocket connections that can't send custom headers
        if (req.url) {
          headers.set("x-original-url", req.url);
        }

        // Create database instance in the framework layer and pass to context
        // This removes the cyclic dependency between adapters and frameworks
        const db = createDb(databaseUrl);

        // Create Supabase client in the framework layer and pass to context
        // This maintains Clean Architecture by avoiding runtime imports in adapters
        const supabase = createSupabaseClient(
          supabaseUrl,
          supabaseKey,
          undefined,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        console.log("[Supabase] Created server client using SERVICE_ROLE key");

        return createTRPCContext({
          headers,
          db,
          supabase,
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
