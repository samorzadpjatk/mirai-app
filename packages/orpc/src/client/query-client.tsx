/** @jsxImportSource react */
"use client";

import { useSession } from "@mirai-app/auth/client";
import { QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { AuthTokenProvider } from "./auth-token-provider";
import { queryClient } from "./query-client-factory";
import { useORPCClient } from "./use-orpc-client";
import { useUnauthorizedHandler } from "./use-unauthorized-handler";

export { queryClient } from "./query-client-factory";
export { orpc } from "./use-orpc-client";

export function QueryProvider({
  httpUrl,
  wsUrl,
  children,
}: {
  httpUrl: string;
  wsUrl: string;
  children: React.ReactNode;
}) {
  const session = useSession();
  const authToken = session?.access_token;

  useORPCClient({ httpUrl, wsUrl, authToken });
  useUnauthorizedHandler();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthTokenProvider>{children}</AuthTokenProvider>
    </QueryClientProvider>
  );
}
