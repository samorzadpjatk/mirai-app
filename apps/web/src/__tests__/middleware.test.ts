/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the @supabase/ssr package
const mockCreateServerClient = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

describe("middleware", () => {
  let middleware: (request: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:8000";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.NODE_ENV = "test";

    // Import middleware after mocks are set up
    const middlewareModule = await import("../middleware");
    middleware = middlewareModule.middleware;
  });

  it("should call supabase getUser", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const request = new NextRequest("http://localhost:11000/dashboard");
    const response = await middleware(request);

    expect(response).toBeDefined();
    expect(response.cookies).toBeDefined();
    expect(mockGetUser).toHaveBeenCalled();
  });

  it("should create supabase client with correct configuration", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const request = new NextRequest("http://localhost:11000/test");
    await middleware(request);

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "http://localhost:8000",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
  });

  it("should handle requests with user session", async () => {
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
    };

    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const request = new NextRequest("http://localhost:11000/dashboard");
    const response = await middleware(request);

    expect(response).toBeDefined();
    expect(mockGetUser).toHaveBeenCalled();
  });

  it("should handle requests without user", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const request = new NextRequest("http://localhost:11000/public");
    const response = await middleware(request);

    expect(response).toBeDefined();
    expect(response.cookies).toBeDefined();
    expect(mockGetUser).toHaveBeenCalled();
  });

  it("should implement cookies getAll", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const request = new NextRequest("http://localhost:11000/test");
    request.cookies.set("test-cookie", "test-value");

    await middleware(request);

    const cookiesConfig = mockCreateServerClient.mock.calls[0]?.[2]?.cookies;
    expect(cookiesConfig).toBeDefined();

    if (cookiesConfig?.getAll) {
      const result = cookiesConfig.getAll();
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it("should implement cookies setAll", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const request = new NextRequest("http://localhost:11000/test");
    await middleware(request);

    const cookiesConfig = mockCreateServerClient.mock.calls[0]?.[2]?.cookies;
    expect(cookiesConfig).toBeDefined();
    expect(cookiesConfig?.setAll).toBeInstanceOf(Function);
  });
});
