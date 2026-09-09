import { describe, expect, it } from "vitest";
import { hasActiveSession, resolveRootGate } from "../authGate";
import type { SupabaseSession } from "../authStore";

const session: SupabaseSession = {
  user: { id: "auth-1", email: "test@example.com" },
  access_token: "token-123",
  refresh_token: "refresh-456",
};

describe("hasActiveSession", () => {
  it("is true only when an access token is present", () => {
    expect(hasActiveSession({ session })).toBe(true);
  });

  it("is false without a session", () => {
    expect(hasActiveSession({ session: null })).toBe(false);
  });

  it("is false for a session that carries no access token", () => {
    expect(hasActiveSession({ session: { user: { id: "auth-1" } } })).toBe(false);
  });
});

describe("resolveRootGate", () => {
  it("blocks on the session read only", () => {
    expect(resolveRootGate({ session: null, isSessionLoading: true })).toBe("loading");
    expect(resolveRootGate({ session, isSessionLoading: true })).toBe("loading");
  });

  it("mounts the protected routes as soon as the session is known", () => {
    expect(resolveRootGate({ session, isSessionLoading: false })).toBe("authenticated");
  });

  it("mounts the public routes when the session read finds nothing", () => {
    expect(resolveRootGate({ session: null, isSessionLoading: false })).toBe("unauthenticated");
  });

  it("treats a token-less session as unauthenticated rather than loading", () => {
    expect(resolveRootGate({ session: { user: { id: "auth-1" } }, isSessionLoading: false })).toBe(
      "unauthenticated",
    );
  });

  it("does not depend on the user profile — the gate is decided without it", () => {
    // Regression guard for the cold-start regression: the root navigator used to wait
    // for `user !== null`, i.e. for a completed `user.getMy()` round trip, and rendered
    // nothing until then. `RootGateInput` deliberately has no `user` field, so a gate
    // that needs one cannot type-check.
    expect(resolveRootGate({ session, isSessionLoading: false })).toBe("authenticated");
  });
});
