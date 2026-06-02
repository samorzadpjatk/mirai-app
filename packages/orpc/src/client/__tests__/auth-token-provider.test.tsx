import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AuthTokenProvider } from "../auth-token-provider";

vi.mock("@mirai-app/auth/client", () => {
  const mockRefetchUser = vi.fn();
  return {
    useSession: vi.fn(() => ({ access_token: "test-token" })),
    authStore: {
      getState: vi.fn(() => ({
        session: { user: { id: "user-1" } },
        user: null,
        isLoading: false,
        refetchUser: mockRefetchUser,
      })),
    },
  };
});

describe("AuthTokenProvider", () => {
  it("should render children", () => {
    const { getByText } = render(
      <AuthTokenProvider>
        <div>Test Content</div>
      </AuthTokenProvider>,
    );
    expect(getByText("Test Content")).toBeTruthy();
  });

  it("should call refetchUser when token exists, user is null, and not loading", async () => {
    const { authStore } = await import("@mirai-app/auth/client");
    const { refetchUser } = authStore.getState();

    render(
      <AuthTokenProvider>
        <div>Test</div>
      </AuthTokenProvider>,
    );

    await waitFor(() => {
      expect(refetchUser).toHaveBeenCalled();
    });
  });

  it("should NOT call refetchUser when no auth token", async () => {
    const { useSession, authStore } = await import("@mirai-app/auth/client");
    vi.mocked(useSession).mockReturnValue({ access_token: null });
    const { refetchUser } = authStore.getState();

    render(
      <AuthTokenProvider>
        <div>Test</div>
      </AuthTokenProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(refetchUser).not.toHaveBeenCalled();
  });

  it("should NOT call refetchUser when user already exists", async () => {
    const { authStore } = await import("@mirai-app/auth/client");
    authStore.getState = vi.fn(() => ({
      session: { user: { id: "user-1" } },
      user: { id: "user-1" },
      isLoading: false,
      refetchUser: vi.fn(),
    }));

    const { refetchUser } = authStore.getState();

    render(
      <AuthTokenProvider>
        <div>Test</div>
      </AuthTokenProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(refetchUser).not.toHaveBeenCalled();
  });

  it("should NOT call refetchUser when isLoading is true", async () => {
    const { authStore } = await import("@mirai-app/auth/client");
    authStore.getState = vi.fn(() => ({
      session: { user: { id: "user-1" } },
      user: null,
      isLoading: true,
      refetchUser: vi.fn(),
    }));

    const { refetchUser } = authStore.getState();

    render(
      <AuthTokenProvider>
        <div>Test</div>
      </AuthTokenProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(refetchUser).not.toHaveBeenCalled();
  });
});
