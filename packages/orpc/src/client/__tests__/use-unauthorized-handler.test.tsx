import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "../query-client-factory";
import { isUnauthorizedError, useUnauthorizedHandler } from "../use-unauthorized-handler";

vi.mock("@mirai-app/auth/client", () => {
  const mockSignOut = vi.fn().mockResolvedValue(undefined);
  const mockRefreshSession = vi.fn().mockResolvedValue(undefined);
  return {
    useSession: vi.fn(() => ({ access_token: "test-token" })),
    useAuth: vi.fn(() => ({
      signOut: mockSignOut,
      refreshSession: mockRefreshSession,
    })),
  };
});

describe("isUnauthorizedError", () => {
  it("should return true for error with data.code === UNAUTHORIZED", () => {
    const error = { data: { code: "UNAUTHORIZED" } };
    expect(isUnauthorizedError(error)).toBe(true);
  });

  it("should return false for non-UNAUTHORIZED errors", () => {
    const error = { data: { code: "NOT_FOUND" } };
    expect(isUnauthorizedError(error)).toBe(false);
  });
});

describe("useUnauthorizedHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  function TestComponent() {
    useUnauthorizedHandler();
    return <div>Test</div>;
  }

  it("should trigger refreshSession on error with UNAUTHORIZED data code", async () => {
    const { useAuth } = await import("@mirai-app/auth/client");
    const { refreshSession } = useAuth();

    render(<TestComponent />);

    const unauthorizedError = { data: { code: "UNAUTHORIZED" } };

    queryClient.getQueryCache().notify({
      type: "updated",
      query: {
        queryHash: "test",
        state: { error: unauthorizedError },
      },
    } as Parameters<ReturnType<typeof queryClient.getQueryCache>["notify"]>[0]);

    await waitFor(() => {
      expect(refreshSession).toHaveBeenCalled();
    });
  });

  it("should trigger signOut when refreshSession fails after unauthorized error", async () => {
    const { useAuth } = await import("@mirai-app/auth/client");
    const { refreshSession, signOut } = useAuth();
    vi.mocked(refreshSession).mockRejectedValue(new Error("Refresh failed"));

    render(<TestComponent />);

    const unauthorizedError = { data: { code: "UNAUTHORIZED" } };

    queryClient.getQueryCache().notify({
      type: "updated",
      query: {
        queryHash: "test2",
        state: { error: unauthorizedError },
      },
    } as Parameters<ReturnType<typeof queryClient.getQueryCache>["notify"]>[0]);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it("should not trigger refresh for non-unauthorized errors", async () => {
    const { useAuth } = await import("@mirai-app/auth/client");
    const { refreshSession } = useAuth();

    render(<TestComponent />);

    const notFoundError = { data: { code: "NOT_FOUND" } };

    queryClient.getQueryCache().notify({
      type: "updated",
      query: {
        queryHash: "test3",
        state: { error: notFoundError },
      },
    } as Parameters<ReturnType<typeof queryClient.getQueryCache>["notify"]>[0]);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("should not trigger refresh when no auth token is present", async () => {
    const { useAuth, useSession } = await import("@mirai-app/auth/client");
    vi.mocked(useSession).mockReturnValue({ access_token: null });
    const { refreshSession } = useAuth();

    render(<TestComponent />);

    const unauthorizedError = { data: { code: "UNAUTHORIZED" } };

    queryClient.getQueryCache().notify({
      type: "updated",
      query: {
        queryHash: "test4",
        state: { error: unauthorizedError },
      },
    } as Parameters<ReturnType<typeof queryClient.getQueryCache>["notify"]>[0]);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(refreshSession).not.toHaveBeenCalled();
  });
});
