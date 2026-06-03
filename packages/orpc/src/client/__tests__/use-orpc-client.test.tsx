import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useORPCClient, orpc } from "../use-orpc-client";

vi.mock("../vanilia", () => ({
  getORPCClient: vi.fn(() => ({
    client: {
      user: {
        getMy: vi.fn().mockResolvedValue({}),
      },
    },
    cleanup: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("@orpc/tanstack-query", () => ({
  createTanstackQueryUtils: vi.fn(() => ({
    user: {
      getMy: {
        queryOptions: vi.fn(() => ({ queryKey: ["user", "getMy"] })),
        mutationOptions: vi.fn(() => ({ mutationFn: vi.fn() })),
      },
    },
  })),
}));

import { getORPCClient } from "../vanilia";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

function TestComponent({
  httpUrl,
  wsUrl,
  authToken,
}: {
  httpUrl: string;
  wsUrl: string;
  authToken?: string;
}) {
  useORPCClient({ httpUrl, wsUrl, authToken });
  return <div>Test</div>;
}

describe("useORPCClient", () => {
  it("should call getORPCClient with correct args", () => {
    render(
      <TestComponent
        httpUrl="http://localhost:3000"
        wsUrl="ws://localhost:3000"
        authToken="test-token"
      />,
    );
    expect(vi.mocked(getORPCClient)).toHaveBeenCalledWith(
      "http://localhost:3000",
      "ws://localhost:3000",
      "test-token",
    );
  });

  it("should call createTanstackQueryUtils with client", () => {
    render(<TestComponent httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000" />);
    const mockedGetORPCClient = vi.mocked(getORPCClient);
    const mockClient = mockedGetORPCClient.mock.results[0]?.value?.client;
    expect(vi.mocked(createTanstackQueryUtils)).toHaveBeenCalledWith(mockClient);
  });

  it("should assign orpc global", () => {
    render(<TestComponent httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000" />);
    expect(orpc).toBeDefined();
  });

  it("should provide queryOptions for user router", () => {
    render(<TestComponent httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000" />);
    expect(orpc.user).toBeDefined();
    expect(orpc.user.getMy).toBeDefined();
    expect(typeof orpc.user.getMy.queryOptions).toBe("function");
  });

  it("should provide mutationOptions for user router", () => {
    render(<TestComponent httpUrl="http://localhost:3000" wsUrl="ws://localhost:3000" />);
    expect(typeof orpc.user.getMy.mutationOptions).toBe("function");
  });
});
