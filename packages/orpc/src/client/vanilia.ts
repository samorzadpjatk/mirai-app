import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WSLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../api/root";

const createWsConnection = (wsUrl: string, authorizationToken?: string) => {
  console.log(
    "[WS Client] Creating WebSocket client with token:",
    authorizationToken ? "YES" : "NO",
  );
  if (authorizationToken) {
    console.log(
      "[WS Client] Token preview:",
      authorizationToken.substring(0, 20) + "...",
    );
  }

  const wsUrlWithAuth = authorizationToken
    ? `${wsUrl}?authorization=${encodeURIComponent(`Bearer ${authorizationToken}`)}`
    : wsUrl;

  return new WebSocket(wsUrlWithAuth);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const wsLink = new WSLink({ websocket: ws });

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
