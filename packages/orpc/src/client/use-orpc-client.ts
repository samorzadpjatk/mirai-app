import { useMemo, useEffect } from "react";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../api/root";
import { getORPCClient } from "./vanilia";
import { logger } from "../utils/logger";

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
          logger.error(error, "Error cleaning up WebSocket connection");
        });
      }
    };
  }, [cleanup]);

  return { client };
}
