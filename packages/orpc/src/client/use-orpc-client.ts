import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterUtils } from "@orpc/tanstack-query";
import { useEffect, useMemo } from "react";
import type { AppRouter } from "../api/root";
import { clientLogger } from "./logger";
import { getORPCClient } from "./vanilia";

export let orpc: RouterUtils<RouterClient<AppRouter>>;

export function useORPCClient({
  httpUrl,
  wsUrl,
  authToken,
}: {
  httpUrl: string;
  wsUrl?: string;
  authToken?: string;
}) {
  const { client, cleanup } = useMemo(
    () => getORPCClient(httpUrl, wsUrl, authToken),
    [authToken, httpUrl, wsUrl],
  );

  const orpcUtils = useMemo(() => createTanstackQueryUtils(client), [client]);
  orpc = orpcUtils;

  useEffect(() => {
    return () => {
      if (cleanup) {
        cleanup().catch((error) => {
          clientLogger.error("Error cleaning up WebSocket connection", error);
        });
      }
    };
  }, [cleanup]);

  return { client };
}
