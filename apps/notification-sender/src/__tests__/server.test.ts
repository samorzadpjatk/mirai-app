import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startWsServer } from "../server";
import type { AppRouter } from "../router";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import superjson from "superjson";
import WebSocketImpl from "ws";

let stop: (() => Promise<void>) | null = null;
let baseUrl = "";

describe("tRPC WS server", () => {
  beforeAll(async () => {
    const { wss, port } = await startWsServer(0);
    baseUrl = `ws://127.0.0.1:${port}`;
    stop = async () => {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Server close timeout")),
          5000,
        );
        wss.close((err) => {
          clearTimeout(timeout);
          if (err) reject(err);
          else resolve();
        });
      });
    };
  }, 10000);

  afterAll(async () => {
    if (stop) await stop();
  }, 10000);
  it("responds to health query over websocket", async () => {
    const wsClient = createWSClient({
      url: baseUrl,
      WebSocket: WebSocketImpl as unknown as typeof WebSocket,
    });

    const client = createTRPCClient<AppRouter>({
      links: [wsLink({ client: wsClient, transformer: superjson })],
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const res = await client.health.query();
      expect(res).toEqual({ ok: true });
    } finally {
      try {
        await Promise.race([
          wsClient.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Close timeout")), 5000),
          ),
        ]);
      } catch (err) {
        console.warn("WebSocket close warning:", err);
      }
    }
  }, 30000);
});
