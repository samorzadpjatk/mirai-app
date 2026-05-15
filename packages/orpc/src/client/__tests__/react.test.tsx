import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { QueryProvider, queryClient, orpc } from "../query-client";
import type { ReactNode } from "react";

// Mock auth hooks
vi.mock("@mirai-app/auth/client", () => ({
  useSession: vi.fn(() => ({ access_token: "test-token" })),
  useAuth: vi.fn(() => ({
    signOut: vi.fn(),
    refreshSession: vi.fn(),
  })),
}));

// Mock getORPCClient
const mockCleanup = vi.fn().mockResolvedValue(undefined);
const mockClient = {
  user: {
    getMy: vi.fn().mockResolvedValue({}),
  },
};

vi.mock("../vanilia", () => ({
  getORPCClient: vi.fn(() => ({
    client: mockClient,
    cleanup: mockCleanup,
  })),
}));

// Mock @orpc/tanstack-query
const mockQueryUtils = {
  user: {
    getMy: {
      queryOptions: vi.fn(() => ({ queryKey: ["user", "getMy"] })),
      mutationOptions: vi.fn(() => ({ mutationFn: vi.fn() })),
    },
  },
  challenge: {
    getAll: {
      queryOptions: vi.fn(() => ({ queryKey: ["challenge", "getAll"] })),
    },
  },
};

vi.mock("@orpc/tanstack-query", () => ({
  createTanstackQueryUtils: vi.fn(() => mockQueryUtils),
}));

describe("QueryProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children without errors", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    const { getByTestId } = render(
      <QueryProvider httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000">
        <TestChild />
      </QueryProvider>,
    );

    expect(getByTestId("test-child")).toBeTruthy();
    expect(getByTestId("test-child").textContent).toBe("Test Content");
  });

  it("should render multiple children", () => {
    const { container } = render(
      <QueryProvider httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000">
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </QueryProvider>,
    );

    expect(container.textContent).toContain("Child 1");
    expect(container.textContent).toContain("Child 2");
    expect(container.textContent).toContain("Child 3");
  });

  it("should render nested components", () => {
    const NestedComponent = () => (
      <div data-testid="nested">
        <span>Nested Content</span>
      </div>
    );

    const { getByTestId } = render(
      <QueryProvider httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000">
        <NestedComponent />
      </QueryProvider>,
    );

    expect(getByTestId("nested")).toBeTruthy();
  });

  it("should handle null children gracefully", () => {
    const { container } = render(
      <QueryProvider httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000">
        {null}
      </QueryProvider>,
    );

    expect(container).toBeDefined();
  });

  it("should handle fragment children", () => {
    const { container } = render(
      <QueryProvider httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000">
        <>
          <div>Fragment Child 1</div>
          <div>Fragment Child 2</div>
        </>
      </QueryProvider>,
    );

    expect(container.textContent).toContain("Fragment Child 1");
    expect(container.textContent).toContain("Fragment Child 2");
  });
});

describe("orpc utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export orpc", () => {
    expect(orpc).toBeDefined();
  });

  it("should provide queryOptions for user router", () => {
    expect(orpc.user).toBeDefined();
    expect(orpc.user.getMy).toBeDefined();
    expect(typeof orpc.user.getMy.queryOptions).toBe("function");
  });

  it("should provide mutationOptions for user router", () => {
    expect(typeof orpc.user.getMy.mutationOptions).toBe("function");
  });

  it("should provide queryOptions for challenge router", () => {
    expect(orpc.challenge).toBeDefined();
    expect(orpc.challenge.getAll).toBeDefined();
    expect(typeof orpc.challenge.getAll.queryOptions).toBe("function");
  });
});

describe("queryClient", () => {
  it("should export a QueryClient instance", () => {
    expect(queryClient).toBeDefined();
    expect(queryClient).toHaveProperty("getQueryCache");
    expect(queryClient).toHaveProperty("getMutationCache");
    expect(queryClient).toHaveProperty("invalidateQueries");
  });
});

describe("Integration with React patterns", () => {
  it("should work with React.memo components", async () => {
    const React = await import("react");

    const MemoizedComponent = React.memo(() => {
      return <div data-testid="memoized">memoized-content</div>;
    });

    const { getByTestId } = render(
      <QueryProvider httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000">
        <MemoizedComponent />
      </QueryProvider>,
    );

    expect(getByTestId("memoized").textContent).toBe("memoized-content");
  });

  it("should work with useEffect inside provider", async () => {
    const React = await import("react");

    const EffectComponent = () => {
      const [effectCalled, setEffectCalled] = React.useState(false);

      React.useEffect(() => {
        setEffectCalled(true);
      }, []);

      return <div data-testid="effect-result">{effectCalled ? "effect-called" : "waiting"}</div>;
    };

    const { getByTestId } = render(
      <QueryProvider httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000">
        <EffectComponent />
      </QueryProvider>,
    );

    expect(getByTestId("effect-result").textContent).toBe("effect-called");
  });
});
