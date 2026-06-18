import { os } from "@orpc/server";

// Minimal real oRPC router used to drive the HTTP handler in server tests.
// Built with the genuine `os` builder so RPCHandler routes, serializes and runs
// these procedures for real — this is a fake (real behavior), not a mock.
export const appRouter = {
  ping: os.handler(() => ({ ok: true })),
  boom: os.handler(() => {
    throw new Error("kaboom");
  }),
};
