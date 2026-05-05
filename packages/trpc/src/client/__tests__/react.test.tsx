import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { useTRPC, useTRPCClient, TRPCContext } from "../react";
import type { ReactNode } from "react";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "../../api/root";

// Create mock tRPC proxy
const createMockTRPCProxy = (): TRPCOptionsProxy<AppRouter> =>
  ({
    user: {
      getMy: {
        useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
        useMutation: vi.fn().mockReturnValue({ mutate: vi.fn() }),
      },
      getAll: {
        useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
      },
    },
    challenge: {
      getAll: {
        useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
      },
    },
  }) as unknown as TRPCOptionsProxy<AppRouter>;

// Create mock tRPC vanilla client
const createMockTRPCClient = (): TRPCClient<AppRouter> =>
  ({
    query: vi.fn().mockResolvedValue({}),
    mutation: vi.fn().mockResolvedValue({}),
    subscription: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }) as unknown as TRPCClient<AppRouter>;

describe("TRPCContext", () => {
  it("should be exported as a React context", () => {
    expect(TRPCContext).toBeDefined();
    expect(TRPCContext.Provider).toBeDefined();
    expect(TRPCContext.Consumer).toBeDefined();
  });

  it("should have null as default value", () => {
    // The context default value should be null (accessing internal property for test)
    expect((TRPCContext as unknown as { _currentValue: unknown })._currentValue).toBeNull();
  });
});

describe("useTRPC", () => {
  const mockProxy = createMockTRPCProxy();
  const mockClient = createMockTRPCClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TRPCContext.Provider
      value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
    >
      {children}
    </TRPCContext.Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return tRPC proxy when used within provider", () => {
    const { result } = renderHook(() => useTRPC(), { wrapper });

    expect(result.current).toBe(mockProxy);
  });

  it("should provide access to user router", () => {
    const { result } = renderHook(() => useTRPC(), { wrapper });

    expect(result.current.user).toBeDefined();
    expect(result.current.user.getMy).toBeDefined();
    expect(result.current.user.getAll).toBeDefined();
  });

  it("should provide access to challenge router", () => {
    const { result } = renderHook(() => useTRPC(), { wrapper });

    expect(result.current.challenge).toBeDefined();
    expect(result.current.challenge.getAll).toBeDefined();
  });

  it("should throw error when used outside of provider", () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTRPC());
    }).toThrow("useTRPC must be used within APIProvider");

    consoleSpy.mockRestore();
  });

  it("should return the same proxy instance on re-renders", () => {
    const { result, rerender } = renderHook(() => useTRPC(), { wrapper });

    const firstProxy = result.current;
    rerender();
    const secondProxy = result.current;

    expect(firstProxy).toBe(secondProxy);
  });

  it("should work with multiple nested providers", () => {
    const mockProxy2 = createMockTRPCProxy();
    const mockClient2 = createMockTRPCClient();

    const InnerComponent = () => {
      const trpc = useTRPC();
      return (
        <div data-testid="inner-trpc">
          {trpc === mockProxy2 ? "proxy2" : "other"}
        </div>
      );
    };

    const OuterComponent = () => {
      const trpc = useTRPC();
      return (
        <div data-testid="outer-trpc">
          {trpc === mockProxy ? "proxy1" : "other"}
          <TRPCContext.Provider
            value={{
              trpcProxy: mockProxy2,
              trpcVanillaClient: mockClient2,
            }}
          >
            <InnerComponent />
          </TRPCContext.Provider>
        </div>
      );
    };

    const { getByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <OuterComponent />
      </TRPCContext.Provider>
    );

    expect(getByTestId("outer-trpc").textContent).toContain("proxy1");
    expect(getByTestId("inner-trpc").textContent).toBe("proxy2");
  });

  it("should work in complex component trees", () => {
    const DeepChild = () => {
      const trpc = useTRPC();
      return (
        <div data-testid="deep-child">
          {trpc === mockProxy ? "has-proxy" : "no-proxy"}
        </div>
      );
    };

    const MiddleComponent = () => (
      <div data-testid="middle">
        <DeepChild />
      </div>
    );

    const { getByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <div data-testid="outer">
          <MiddleComponent />
        </div>
      </TRPCContext.Provider>
    );

    expect(getByTestId("deep-child").textContent).toBe("has-proxy");
  });

  it("should work with components that conditionally render", () => {
    const ConditionalComponent = ({ show }: { show: boolean }) => {
      const trpc = useTRPC();
      if (!show) return null;
      return (
        <div data-testid="conditional">
          {trpc ? "has-trpc" : "no-trpc"}
        </div>
      );
    };

    const { getByTestId, rerender, queryByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <ConditionalComponent show={false} />
      </TRPCContext.Provider>
    );

    expect(queryByTestId("conditional")).toBeNull();

    rerender(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <ConditionalComponent show={true} />
      </TRPCContext.Provider>
    );

    expect(getByTestId("conditional").textContent).toBe("has-trpc");
  });
});

describe("useTRPCClient", () => {
  const mockProxy = createMockTRPCProxy();
  const mockClient = createMockTRPCClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TRPCContext.Provider
      value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
    >
      {children}
    </TRPCContext.Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return vanilla tRPC client when used within provider", () => {
    const { result } = renderHook(() => useTRPCClient(), { wrapper });

    expect(result.current).toBe(mockClient);
  });

  it("should provide access to query method", () => {
    const { result } = renderHook(() => useTRPCClient(), { wrapper });

    expect(typeof (result.current as unknown as { query: unknown }).query).toBe("function");
  });

  it("should provide access to mutation method", () => {
    const { result } = renderHook(() => useTRPCClient(), { wrapper });

    expect(typeof (result.current as unknown as { mutation: unknown }).mutation).toBe("function");
  });

  it("should provide access to subscription method", () => {
    const { result } = renderHook(() => useTRPCClient(), { wrapper });

    expect(typeof (result.current as unknown as { subscription: unknown }).subscription).toBe("function");
  });

  it("should throw error when used outside of provider", () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTRPCClient());
    }).toThrow("useTRPCClient must be used within APIProvider");

    consoleSpy.mockRestore();
  });

  it("should return the same client instance on re-renders", () => {
    const { result, rerender } = renderHook(() => useTRPCClient(), { wrapper });

    const firstClient = result.current;
    rerender();
    const secondClient = result.current;

    expect(firstClient).toBe(secondClient);
  });

  it("should work with multiple nested providers (different clients)", () => {
    const mockProxy2 = createMockTRPCProxy();
    const mockClient2 = createMockTRPCClient();

    const InnerComponent = () => {
      const client = useTRPCClient();
      return (
        <div data-testid="inner-client">
          {client === mockClient2 ? "client2" : "client1"}
        </div>
      );
    };

    const OuterComponent = () => {
      const client = useTRPCClient();
      return (
        <div data-testid="outer-client">
          {client === mockClient ? "client1" : "other"}
          <TRPCContext.Provider
            value={{
              trpcProxy: mockProxy2,
              trpcVanillaClient: mockClient2,
            }}
          >
            <InnerComponent />
          </TRPCContext.Provider>
        </div>
      );
    };

    const { getByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <OuterComponent />
      </TRPCContext.Provider>
    );

    expect(getByTestId("outer-client").textContent).toContain("client1");
    expect(getByTestId("inner-client").textContent).toBe("client2");
  });
});

describe("TRPCContext Provider", () => {
  const mockProxy = createMockTRPCProxy();
  const mockClient = createMockTRPCClient();

  it("should render children without errors", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    const { getByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <TestChild />
      </TRPCContext.Provider>
    );

    expect(getByTestId("test-child")).toBeTruthy();
    expect(getByTestId("test-child").textContent).toBe("Test Content");
  });

  it("should render multiple children", () => {
    const { container } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </TRPCContext.Provider>
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
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <NestedComponent />
      </TRPCContext.Provider>
    );

    expect(getByTestId("nested")).toBeTruthy();
  });

  it("should handle null children gracefully", () => {
    const { container } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        {null}
      </TRPCContext.Provider>
    );

    expect(container).toBeDefined();
  });

  it("should handle fragment children", () => {
    const { container } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <>
          <div>Fragment Child 1</div>
          <div>Fragment Child 2</div>
        </>
      </TRPCContext.Provider>
    );

    expect(container.textContent).toContain("Fragment Child 1");
    expect(container.textContent).toContain("Fragment Child 2");
  });
});

describe("Integration with React patterns", () => {
  const mockProxy = createMockTRPCProxy();
  const mockClient = createMockTRPCClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TRPCContext.Provider
      value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
    >
      {children}
    </TRPCContext.Provider>
  );

  it("should work with React.memo components", async () => {
    const React = await import("react");
    
    const MemoizedComponent = React.memo(() => {
      const trpc = useTRPC();
      return (
        <div data-testid="memoized">
          {trpc ? "has-trpc" : "no-trpc"}
        </div>
      );
    });

    const { getByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <MemoizedComponent />
      </TRPCContext.Provider>
    );

    expect(getByTestId("memoized").textContent).toBe("has-trpc");
  });

  it("should work with useEffect that depends on trpc", async () => {
    const React = await import("react");
    
    const EffectComponent = () => {
      const trpc = useTRPC();
      const [effectCalled, setEffectCalled] = React.useState(false);

      React.useEffect(() => {
        if (trpc) {
          setEffectCalled(true);
        }
      }, [trpc]);

      return (
        <div data-testid="effect-result">
          {effectCalled ? "effect-called" : "waiting"}
        </div>
      );
    };

    const { getByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <EffectComponent />
      </TRPCContext.Provider>
    );

    expect(getByTestId("effect-result").textContent).toBe("effect-called");
  });

  it("should work with useCallback that uses trpc client", async () => {
    const React = await import("react");
    
    const CallbackComponent = () => {
      const trpcClient = useTRPCClient();
      const [callbackResult, setCallbackResult] = React.useState("");

      const handleClick = React.useCallback(() => {
        if (trpcClient) {
          setCallbackResult("has-client");
        }
      }, [trpcClient]);

      React.useEffect(() => {
        handleClick();
      }, [handleClick]);

      return (
        <div data-testid="callback-result">{callbackResult}</div>
      );
    };

    const { getByTestId } = render(
      <TRPCContext.Provider
        value={{ trpcProxy: mockProxy, trpcVanillaClient: mockClient }}
      >
        <CallbackComponent />
      </TRPCContext.Provider>
    );

    expect(getByTestId("callback-result").textContent).toBe("has-client");
  });
});

describe("Error boundary scenarios", () => {
  it("should throw with correct error message when context is null", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Test useTRPC
    expect(() => {
      renderHook(() => useTRPC());
    }).toThrow("useTRPC must be used within APIProvider");

    // Test useTRPCClient
    expect(() => {
      renderHook(() => useTRPCClient());
    }).toThrow("useTRPCClient must be used within APIProvider");

    consoleSpy.mockRestore();
  });

  it("should throw immediately without attempting to access properties", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    let errorThrown = false;
    let attemptedAccess = false;

    const TestComponent = () => {
      try {
        const trpc = useTRPC();
        // This line should never execute
        attemptedAccess = true;
        (trpc as unknown as { user: { getMy: { useQuery: () => void } } }).user.getMy.useQuery();
      } catch (e) {
        errorThrown = true;
        throw e;
      }
      return null;
    };

    try {
      render(<TestComponent />);
    } catch {
      // Expected
    }

    expect(errorThrown).toBe(true);
    expect(attemptedAccess).toBe(false);

    consoleSpy.mockRestore();
  });
});
