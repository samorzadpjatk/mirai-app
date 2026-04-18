import type { ServerWebSocket } from "bun";

/**
 * Handler Status Type
 */
export type HandlerStatus = "initializing" | "initialized" | "error" | "cleaned_up";

/**
 * Server State Interface
 */
export interface ServerState {
  handlerStatus: {
    notification: HandlerStatus;
    location: HandlerStatus;
  };
  notificationCleanup: (() => void) | null;
  locationCleanup: (() => void) | null;
  wsConnections: Set<Bun.ServerWebSocket<unknown>>;
  server: Bun.Server<undefined> | null;
}

/**
 * Global server state (mutable for lifecycle management)
 */
export const serverState: ServerState = {
  handlerStatus: {
    notification: "initializing",
    location: "initializing",
  },
  notificationCleanup: null,
  locationCleanup: null,
  wsConnections: new Set(),
  server: null,
};
