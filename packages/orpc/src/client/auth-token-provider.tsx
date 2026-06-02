/** @jsxImportSource react */
"use client";

import { useEffect } from "react";
import { useSession, authStore } from "@mirai-app/auth/client";

export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const authToken = session?.access_token;

  useEffect(() => {
    const currentState = authStore.getState();
    if (authToken && currentState.session?.user && !currentState.user && !currentState.isLoading) {
      void currentState.refetchUser();
    }
  }, [authToken]);

  return <>{children}</>;
}
