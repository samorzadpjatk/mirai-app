import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WSLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../api/root";

const createWsConnection = (wsUrl: string, authorizationToken?: string) => {
  const ws = new WebSocket(wsUrl) as WebSocket & {
    addEventListener?: typeof WebSocket.prototype.addEventListener;
    send?: typeof WebSocket.prototype.send;
  };

  if (typeof ws.addEventListener === "function" && typeof ws.send === "function") {
    let authAcknowledged = !authorizationToken;
    const messageQueue: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = [];

    ws.addEventListener("open", () => {
      if (authorizationToken) {
        ws.send(
          JSON.stringify({
            type: "connection_init",
            payload: { authorization: `Bearer ${authorizationToken}` },
          }),
        );
      }
    });

    ws.addEventListener("message", (event: MessageEvent) => {
      const data = typeof event.data === "string" ? event.data : "";
      if (!data.startsWith("{")) return;
      const msg = JSON.parse(data) as { type?: string } | undefined;
      if (msg?.type === "connection_ack") {
        authAcknowledged = true;
        for (const queued of messageQueue) {
          ws.send(queued);
        }
        messageQueue.length = 0;
      }
    });

    const originalSend = ws.send.bind(ws);
    ws.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
      if (authAcknowledged) {
        return originalSend(data);
      }
      messageQueue.push(data);
    };
  }

  return ws;
};

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ORPCError) {
    return error.status >= 500;
  }
  if (error instanceof Error) {
    return error.name === "FetchError" || error.name === "TypeError";
  }
  return false;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getORPCClient = (
  httpUrl: string,
  wsUrl: string,
  authorizationToken?: string,
) => {
  const ws = createWsConnection(wsUrl, authorizationToken);
  new WSLink({ websocket: ws });

  const httpLink = new RPCLink({
    url: httpUrl,
    headers() {
      const headers: Record<string, string> = {};
      if (authorizationToken) {
        headers.Authorization = `Bearer ${authorizationToken}`;
      }
      return headers;
    },
    interceptors: [
      async (ctx) => {
        let attempts = 0;
        while (true) {
          try {
            return await ctx.next(ctx);
          } catch (error) {
            attempts++;
            if (attempts >= 5 || !isRetryableError(error)) throw error;
            await delay(Math.min(1000 * 2 ** attempts, 30_000));
          }
        }
      },
    ],
  });

  const client: RouterClient<AppRouter> = createORPCClient(httpLink);

  return {
    client,
    cleanup: () => {
      ws.close();
      return Promise.resolve();
    },
  };
};

export { getORPCClient };
export type { RouterClient, AppRouter };
