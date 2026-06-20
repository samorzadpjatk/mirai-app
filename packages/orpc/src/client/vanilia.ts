import { type ClientContext, DynamicLink, createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin } from "@orpc/client/plugins";
import { RPCLink as WSLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../api/root";
import type { ServiceRouter } from "../api/service-root";

const createWsConnection = (wsUrl: string, authorizationToken?: string, _serviceToken?: string) => {
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
    ws.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      if (authAcknowledged) {
        return originalSend(data);
      }
      messageQueue.push(data);
    };
  }

  return ws;
};

type ClientContextShape = ClientContext;

const STREAMING_PROCEDURES = new Set([
  "location/getFriendsLocationsStream",
  "location/updateLocationStream",
]);

const createBatchPlugin = () =>
  new BatchLinkPlugin<ClientContextShape>({
    groups: [
      {
        condition: () => true,
        context: {},
      },
    ],
    exclude: ({ path }) => STREAMING_PROCEDURES.has(path.join("/")),
  });

const getORPCClient = (httpUrl: string, wsUrl?: string, authorizationToken?: string) => {
  const ws = wsUrl ? createWsConnection(wsUrl, authorizationToken) : null;
  const wsLink = ws ? new WSLink({ websocket: ws }) : null;

  const httpLink = new RPCLink<ClientContextShape>({
    url: httpUrl,
    headers() {
      const headers: Record<string, string> = {};
      if (authorizationToken) {
        headers.Authorization = `Bearer ${authorizationToken}`;
      }
      return headers;
    },
    plugins: [createBatchPlugin()],
  });

  const link = wsLink
    ? new DynamicLink<ClientContextShape>((_options, path) => {
        const pathKey = path.join("/");
        if (STREAMING_PROCEDURES.has(pathKey)) {
          return wsLink;
        }
        return httpLink;
      })
    : httpLink;

  const client: RouterClient<AppRouter> = createORPCClient(link);

  return {
    client,
    cleanup: () => {
      if (ws) {
        ws.close();
      }
      return Promise.resolve();
    },
  };
};

type ClientBundle = {
  client: RouterClient<AppRouter>;
  cleanup: () => Promise<void>;
};

export function createPersistentORPCClient(
  httpUrl: string,
  wsUrl?: string,
  authorizationToken?: string,
): ClientBundle & { reconnect: () => ClientBundle } {
  let current = getORPCClient(httpUrl, wsUrl, authorizationToken);

  const reconnect = () => {
    void current.cleanup();
    current = getORPCClient(httpUrl, wsUrl, authorizationToken);
    return current;
  };

  return {
    ...current,
    reconnect,
  };
}

type SingletonBundle = ClientBundle & {
  httpUrl: string;
  wsUrl: string;
  authorizationToken: string | undefined;
};

let backgroundSingleton: SingletonBundle | null = null;

export function getBackgroundORPCClient(
  httpUrl: string,
  wsUrl: string,
  authorizationToken?: string,
): ClientBundle {
  if (
    backgroundSingleton &&
    backgroundSingleton.httpUrl === httpUrl &&
    backgroundSingleton.wsUrl === wsUrl &&
    backgroundSingleton.authorizationToken === authorizationToken
  ) {
    return backgroundSingleton;
  }

  if (backgroundSingleton) {
    void backgroundSingleton.cleanup();
  }

  const instance = getORPCClient(httpUrl, wsUrl, authorizationToken);
  backgroundSingleton = {
    ...instance,
    httpUrl,
    wsUrl,
    authorizationToken,
  };

  return backgroundSingleton;
}

export async function cleanupBackgroundORPCClient(): Promise<void> {
  if (backgroundSingleton) {
    await backgroundSingleton.cleanup();
    backgroundSingleton = null;
  }
}

const getServiceORPCClient = (httpUrl: string, wsUrl?: string, serviceToken?: string) => {
  const ws = wsUrl ? createWsConnection(wsUrl, undefined, serviceToken) : null;
  const wsLink = ws ? new WSLink({ websocket: ws }) : null;

  const httpLink = new RPCLink<ClientContextShape>({
    url: httpUrl,
    headers() {
      const headers: Record<string, string> = {};
      if (serviceToken) {
        headers["x-service-token"] = serviceToken;
      }
      return headers;
    },
    plugins: [createBatchPlugin()],
  });

  const link = wsLink ? wsLink : httpLink;

  const client: RouterClient<ServiceRouter> = createORPCClient(link);

  return {
    client,
    cleanup: () => {
      if (ws) {
        ws.close();
      }
      return Promise.resolve();
    },
  };
};

export { getORPCClient, getServiceORPCClient };
