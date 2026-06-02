import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { SupabaseProvider, useSupabaseClient } from "../react";
import type { ReactNode } from "react";
import { createMockSupabaseClient } from "./utils";

describe("SupabaseProvider", () => {
  const mockClient = createMockSupabaseClient();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children without errors", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    const { getByTestId } = render(
      <SupabaseProvider client={mockClient}>
        <TestChild />
      </SupabaseProvider>,
    );

    expect(getByTestId("test-child")).toBeInTheDocument();
    expect(getByTestId("test-child")).toHaveTextContent("Test Content");
  });

  it("should render multiple children", () => {
    const { container } = render(
      <SupabaseProvider client={mockClient}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </SupabaseProvider>,
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
      <SupabaseProvider client={mockClient}>
        <NestedComponent />
      </SupabaseProvider>,
    );

    expect(getByTestId("nested")).toBeInTheDocument();
  });

  it("should accept a valid SupabaseClient", () => {
    // This test verifies TypeScript types work correctly
    const { container } = render(
      <SupabaseProvider client={mockClient}>
        <div>Test</div>
      </SupabaseProvider>,
    );

    expect(container).toBeDefined();
  });

  it("should handle null children gracefully", () => {
    const { container } = render(<SupabaseProvider client={mockClient}>{null}</SupabaseProvider>);

    expect(container).toBeDefined();
  });

  it("should handle fragment children", () => {
    const { container } = render(
      <SupabaseProvider client={mockClient}>
        <>
          <div>Fragment Child 1</div>
          <div>Fragment Child 2</div>
        </>
      </SupabaseProvider>,
    );

    expect(container.textContent).toContain("Fragment Child 1");
    expect(container.textContent).toContain("Fragment Child 2");
  });
});

describe("useSupabaseClient", () => {
  const mockClient = createMockSupabaseClient();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the Supabase client when used within provider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SupabaseProvider client={mockClient}>{children}</SupabaseProvider>
    );

    const { result } = renderHook(() => useSupabaseClient(), { wrapper });

    expect(result.current).toBe(mockClient);
  });

  it("should throw error when used outside of provider", () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => {
      renderHook(() => useSupabaseClient());
    }).toThrow("useSupabaseClient must be used within SupabaseProvider");

    consoleSpy.mockRestore();
  });

  it("should provide access to auth methods", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SupabaseProvider client={mockClient}>{children}</SupabaseProvider>
    );

    const { result } = renderHook(() => useSupabaseClient(), { wrapper });

    expect(result.current.auth).toBeDefined();
    expect(typeof result.current.auth.getSession).toBe("function");
    expect(typeof result.current.auth.getUser).toBe("function");
    expect(typeof result.current.auth.signOut).toBe("function");
  });

  it("should provide access to database methods", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SupabaseProvider client={mockClient}>{children}</SupabaseProvider>
    );

    const { result } = renderHook(() => useSupabaseClient(), { wrapper });

    expect(result.current.from).toBeDefined();
    expect(typeof result.current.from).toBe("function");
  });

  it("should provide access to storage methods", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SupabaseProvider client={mockClient}>{children}</SupabaseProvider>
    );

    const { result } = renderHook(() => useSupabaseClient(), { wrapper });

    expect(result.current.storage).toBeDefined();
    expect(typeof result.current.storage.from).toBe("function");
  });

  it("should return the same client instance on re-renders", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SupabaseProvider client={mockClient}>{children}</SupabaseProvider>
    );

    const { result, rerender } = renderHook(() => useSupabaseClient(), {
      wrapper,
    });

    const firstClient = result.current;
    rerender();
    const secondClient = result.current;

    expect(firstClient).toBe(secondClient);
  });

  it("should work with multiple nested providers (different clients)", () => {
    const mockClient2 = createMockSupabaseClient();

    const InnerComponent = () => {
      const client = useSupabaseClient();
      return <div data-testid="inner-client">{client === mockClient2 ? "client2" : "client1"}</div>;
    };

    const OuterComponent = () => {
      const client = useSupabaseClient();
      return (
        <div data-testid="outer-client">
          {client === mockClient ? "client1" : "other"}
          <SupabaseProvider client={mockClient2}>
            <InnerComponent />
          </SupabaseProvider>
        </div>
      );
    };

    const { getByTestId } = render(
      <SupabaseProvider client={mockClient}>
        <OuterComponent />
      </SupabaseProvider>,
    );

    expect(getByTestId("outer-client").textContent).toContain("client1");
    expect(getByTestId("inner-client").textContent).toBe("client2");
  });

  it("should maintain client reference in complex component trees", () => {
    const DeepChild = () => {
      const client = useSupabaseClient();
      return (
        <div data-testid="deep-child">{client === mockClient ? "has-client" : "no-client"}</div>
      );
    };

    const MiddleComponent = () => (
      <div data-testid="middle">
        <DeepChild />
      </div>
    );

    const { getByTestId } = render(
      <SupabaseProvider client={mockClient}>
        <div data-testid="outer">
          <MiddleComponent />
        </div>
      </SupabaseProvider>,
    );

    expect(getByTestId("deep-child").textContent).toBe("has-client");
  });

  it("should handle components that conditionally render", () => {
    const ConditionalComponent = ({ show }: { show: boolean }) => {
      const client = useSupabaseClient();
      if (!show) return null;
      return <div data-testid="conditional">{client ? "has-client" : "no-client"}</div>;
    };

    const { getByTestId, rerender, queryByTestId } = render(
      <SupabaseProvider client={mockClient}>
        <ConditionalComponent show={false} />
      </SupabaseProvider>,
    );

    expect(queryByTestId("conditional")).toBeNull();

    rerender(
      <SupabaseProvider client={mockClient}>
        <ConditionalComponent show={true} />
      </SupabaseProvider>,
    );

    expect(getByTestId("conditional").textContent).toBe("has-client");
  });

  it("should work with React.memo components", () => {
    const MemoizedComponent = React.memo(() => {
      const client = useSupabaseClient();
      return <div data-testid="memoized">{client ? "has-client" : "no-client"}</div>;
    });

    const { getByTestId } = render(
      <SupabaseProvider client={mockClient}>
        <MemoizedComponent />
      </SupabaseProvider>,
    );

    expect(getByTestId("memoized").textContent).toBe("has-client");
  });

  it("should work with useEffect that depends on client", () => {
    const EffectComponent = () => {
      const client = useSupabaseClient();
      const [effectCalled, setEffectCalled] = React.useState(false);

      React.useEffect(() => {
        if (client) {
          setEffectCalled(true);
        }
      }, [client]);

      return <div data-testid="effect-result">{effectCalled ? "effect-called" : "waiting"}</div>;
    };

    const { getByTestId } = render(
      <SupabaseProvider client={mockClient}>
        <EffectComponent />
      </SupabaseProvider>,
    );

    expect(getByTestId("effect-result").textContent).toBe("effect-called");
  });
});

// Import React for the memo and useEffect tests
import React from "react";
