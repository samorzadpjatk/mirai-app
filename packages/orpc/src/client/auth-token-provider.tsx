/** @jsxImportSource react */
"use client";

import { authStore, useSession } from "@mirai-app/auth/client";
import { useEffect } from "react";
import { queryClient } from "./query-client-factory";

const USER_GET_MY_QUERY_KEY = ["user", "getMy"] as const;

export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const authToken = session?.access_token;

  useEffect(() => {
    const currentState = authStore.getState();
    if (authToken && currentState.session?.user && !currentState.user && !currentState.isLoading) {
      void currentState.refetchUser();
    }

    void queryClient.invalidateQueries({ queryKey: USER_GET_MY_QUERY_KEY });
  }, [authToken]);

  return <>{children}</>;
}
