import ws from "@fastify/websocket";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify, { type FastifyRequest } from "fastify";
import { appRouter } from "@integral-2025-app/trpc";
import { createTRPCContext } from "@integral-2025-app/trpc";
import { fastifyHeadersToFetchHeaders } from "./utils/headers";

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
}

export function createServer(opts: ServerOptions) {
  const dev = opts.dev ?? true;
  const port = opts.port ?? 3000;
  const prefix = opts.prefix ?? "/trpc";
  const server = fastify({ logger: dev });

  void server.register(ws);
  void server.register(fastifyTRPCPlugin, {
    prefix,
    useWSS: true,
    trpcOptions: {
      router: appRouter,
      createContext: async ({ req }: { req: FastifyRequest }) => {
        return createTRPCContext({
          headers: fastifyHeadersToFetchHeaders(req.headers),
          supabaseUrl: process.env.SUPABASE_URL ?? "",
          supabaseKey: process.env.SUPABASE_KEY ?? "",
        });
      },
    },
  });

  server.get("/health", async () => {
    return "OK";
  });

  const stop = async () => {
    await server.close();
  };
  const start = async () => {
    try {
      await server.listen({ port });
      console.log("listening on port", port);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  return { server, start, stop };
}
