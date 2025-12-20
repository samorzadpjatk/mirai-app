import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startWsServer } from "../../src/server";
import type { AppRouter } from "../../src/router";
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
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    };
  });

  afterAll(async () => {
    if (stop) await stop();
  });

  it("responds to health query over websocket", async () => {
    const wsClient = createWSClient({
      url: baseUrl,
      WebSocket: WebSocketImpl as unknown as typeof WebSocket,
    });
    const client = createTRPCClient<AppRouter>({
      links: [wsLink({ client: wsClient, transformer: superjson })],
    });

    const res = await client.health.query();
    expect(res).toEqual({ ok: true });

    await wsClient.close();
  });
});
