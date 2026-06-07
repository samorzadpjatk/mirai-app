import { QueryProvider as BaseQueryProvider } from "@mirai-app/orpc/client";
import { queryClient } from "@mirai-app/orpc/client";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type React from "react";
import { persister, shouldDehydrateQuery } from "~/services/offline/persister";

export function QueryProvider({
  httpUrl,
  wsUrl,
  children,
}: {
  httpUrl: string;
  wsUrl: string;
  children: React.ReactNode;
}) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          shouldDehydrateQuery,
        },
      }}
    >
      <BaseQueryProvider httpUrl={httpUrl} wsUrl={wsUrl}>
        {children}
      </BaseQueryProvider>
    </PersistQueryClientProvider>
  );
}
