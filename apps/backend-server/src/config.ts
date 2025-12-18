import type { ServerOptions } from "./server";

export const serverConfig: ServerOptions = {
  dev: true,
  port: Number(process.env.TRPC_SERVER_PORT ?? 2022),
  // Serve both HTTP and WebSocket tRPC under the same path
  // so that clients can use one base URL.
  prefix: "/api/trpc",
};
