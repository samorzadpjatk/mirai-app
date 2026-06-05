import { requireEnv } from "@mirai-app/shared/utils";
import type { ServerOptions } from "./server";

const serverPort = requireEnv("TRPC_SERVER_PORT");
const serverHost = requireEnv("TRPC_SERVER_HOST");

export const serverConfig: ServerOptions = {
  dev: true,
  port: Number(serverPort),
  // Serve both HTTP and WebSocket oRPC under the same path
  // so that clients can use one base URL.
  prefix: "/api/trpc",
  host: serverHost,
};
