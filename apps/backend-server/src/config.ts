import type { ServerOptions } from "./server";

const serverPort = process.env.TRPC_SERVER_PORT;
const serverHost = process.env.TRPC_SERVER_HOST;

if (!serverPort || !serverHost) {
  throw new Error(
    "Missing TRPC_SERVER_PORT or TRPC_SERVER_HOST environment variable.",
  );
}

export const serverConfig: ServerOptions = {
  dev: true,
  port: Number(serverPort),
  // Serve both HTTP and WebSocket oRPC under the same path
  // so that clients can use one base URL.
  prefix: "/api/trpc",
  host: serverHost,
};
