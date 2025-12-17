import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import type { AddressInfo } from "net";
import type { AppRouter } from "./router";
import { appRouter } from "./router";
import { createContext } from "./trpc";

export async function startWsServer(port = Number(process.env.PORT ?? 3011)) {
  const wss = new WebSocketServer({ port });

  const handler = applyWSSHandler<AppRouter>({
    wss,
    router: appRouter,
    createContext,
  });

  await new Promise<void>((resolve) => {
    if ((wss as any)._server?.listening) return resolve();
    wss.on("listening", () => resolve());
  });

  const address = wss.address() as AddressInfo | null;
  const actualPort = address?.port ?? port;
  console.log(`tRPC WS server listening on ws://localhost:${actualPort}`);

  process.on("SIGTERM", () => {
    console.log("SIGTERM: closing tRPC WS server");
    handler.broadcastReconnectNotification();
    wss.close();
  });

  return { wss, handler, port: actualPort };
}
