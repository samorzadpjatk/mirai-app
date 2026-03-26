/** @jsxImportSource react */
import { createContext, useContext, type ReactNode } from "react";
import type { SupabaseClient } from "./types";

const SupabaseClientContext = createContext<SupabaseClient | null>(null);

export interface SupabaseProviderProps {
  client: SupabaseClient;
  children: ReactNode;
}

export const SupabaseProvider = ({
  client,
  children,
}: SupabaseProviderProps) => {
  return (
    <SupabaseClientContext.Provider value={client}>
      {children}
    </SupabaseClientContext.Provider>
  );
};

export const useSupabaseClient = (): SupabaseClient => {
  const client = useContext(SupabaseClientContext);

  if (!client) {
    throw new Error("useSupabaseClient must be used within SupabaseProvider");
  }

  return client;
};
