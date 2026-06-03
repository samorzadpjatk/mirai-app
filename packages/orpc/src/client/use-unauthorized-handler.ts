import { useAuth, useSession } from "@mirai-app/auth/client";
import { ORPCError } from "@orpc/client";
import type { MutationCacheNotifyEvent, QueryCacheNotifyEvent } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { logger } from "../utils/logger";
import { queryClient } from "./query-client-factory";

export const isUnauthorizedError = (error: unknown) => {
  if (error instanceof ORPCError) {
    return error.code === "UNAUTHORIZED";
  }
  const anyError = error as {
    data?: { code?: string };
    shape?: { data?: { code?: string } };
  };
  const code = anyError?.data?.code ?? anyError?.shape?.data?.code;
  return code === "UNAUTHORIZED";
};

export function useUnauthorizedHandler() {
  const session = useSession();
  const { signOut, refreshSession } = useAuth();
  const authToken = session?.access_token;
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();

    const handleUnauthorized = async () => {
      if (!authToken) {
        return;
      }

      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;
      try {
        await refreshSession();
      } catch (error) {
        logger.warn(
          error,
          "[QueryProvider] Refresh session failed after unauthorized, signing out",
        );
        await signOut();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const handleError = (error: unknown) => {
      if (isUnauthorizedError(error)) {
        void handleUnauthorized();
      }
    };

    const unsubscribeQuery = queryCache.subscribe((event: QueryCacheNotifyEvent | undefined) => {
      const error: unknown = event?.query?.state?.error;
      if (error) {
        handleError(error);
      }
    });

    const unsubscribeMutation = mutationCache.subscribe(
      (event: MutationCacheNotifyEvent | undefined) => {
        const error: unknown = event?.mutation?.state?.error;
        if (error) {
          handleError(error);
        }
      },
    );

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
    };
  }, [authToken, signOut, refreshSession]);
}
