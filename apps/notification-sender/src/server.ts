import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import type { AppRouter } from "./router";
import { appRouter } from "./router";
import { createContext } from "./trpc";

export async function startWsServer(port = Number(process.env.PORT ?? 3011), host = process.env.HOST ?? "127.0.0.1") {
  const wss = new WebSocketServer({ port, host });

  const handler = applyWSSHandler<AppRouter>({
    wss,
    router: appRouter,
    createContext,
  });

  await new Promise<void>((resolve) => {
    if (wss.address()) return resolve();
    wss.on("listening", () => resolve());
  });

  const address = wss.address();
  const actualPort =
    typeof address === "object" && address !== null ? address.port : port;

  console.log(`tRPC WS server listening on ws://${host}:${actualPort}`);

  process.on("SIGTERM", () => {
    console.log("SIGTERM: closing tRPC WS server");
    handler.broadcastReconnectNotification();
    wss.close();
  });

  return { wss, handler, port: actualPort };
}
