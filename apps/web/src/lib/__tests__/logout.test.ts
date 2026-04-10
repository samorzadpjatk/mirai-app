import {
  describe,
  expect,
  test,
  beforeEach,
  mock,
  beforeAll,
  afterAll,
} from "bun:test";

// Set required environment variables BEFORE any imports
// Note: These values must be consistent with other test files due to module caching
process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.PUBLIC_TRPC_API_URL = "http://localhost:3000/api/trpc";
process.env.PUBLIC_TRPC_WS_URL = "ws://localhost:3000/api/trpc";

// Store original values
let cookies: string[] = [];
let logout: () => Promise<void>;
let originalDocumentCookieDescriptor: PropertyDescriptor | undefined;
let originalWindowLocationDescriptor: PropertyDescriptor | undefined;
let originalConsoleError: typeof console.error;

// Mock console.error to suppress expected error messages during tests
originalConsoleError = console.error;
console.error = mock(() => {});

// Mock modules
const mockSignOut = mock(() => Promise.resolve());
const mockSupabaseSignOut = mock(() => Promise.resolve());

mock.module("@mirai-app/frameworks/auth/client", () => ({
  authStore: {
    getState: () => ({
      signOut: mockSignOut,
    }),
    setState: () => {},
  },
}));

mock.module("../supabase", () => ({
  supabase: {
    auth: {
      signOut: mockSupabaseSignOut,
    },
  },
}));

// Store original descriptors before mocking
originalDocumentCookieDescriptor = Object.getOwnPropertyDescriptor(
  global.document,
  "cookie",
);
originalWindowLocationDescriptor = Object.getOwnPropertyDescriptor(
  global.window,
  "location",
);

// Mock document.cookie using defineProperty to preserve other document methods
Object.defineProperty(global.document, "cookie", {
  get: () => cookies.join("; "),
  set: (value: string) => {
    // Parse and store cookie
    if (value.includes("Max-Age=0")) {
      // Deleting cookie - remove from array
      const cookieName = value.split("=")[0];
      cookies = cookies.filter((c) => !c.startsWith(cookieName + "="));
    } else {
      cookies.push(value);
    }
  },
  configurable: true,
});

// Create window location mock
const locationMock = {
  href: "/current-page",
};

Object.defineProperty(global.window, "location", {
  get: () => locationMock,
  set: (value: any) => {
    if (value && typeof value === "object" && value.href !== undefined) {
      locationMock.href = value.href;
    }
  },
  configurable: true,
});

// Dynamic import after mocks are set up
beforeAll(async () => {
  const logoutModule = await import("../logout");
  logout = logoutModule.logout;
});

beforeEach(() => {
  cookies = [];
  global.window.location.href = "/current-page";
  mockSignOut.mockClear();
  mockSupabaseSignOut.mockClear();
});

// Restore original descriptors after all tests
afterAll(() => {
  if (originalDocumentCookieDescriptor) {
    Object.defineProperty(
      global.document,
      "cookie",
      originalDocumentCookieDescriptor,
    );
  }
  if (originalWindowLocationDescriptor) {
    Object.defineProperty(
      global.window,
      "location",
      originalWindowLocationDescriptor,
    );
  }
  // Restore console.error
  console.error = originalConsoleError;
});

describe("[INTEGRATION] logout", () => {
  test("calls supabase.auth.signOut", async () => {
    await logout();

    expect(mockSupabaseSignOut).toHaveBeenCalledTimes(1);
  });

  test("calls authStore.signOut", async () => {
    await logout();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test("clears sb-access-token cookie", async () => {
    cookies = ["sb-access-token=old-token"];

    await logout();

    // After setting Max-Age=0, the cookie should be removed
    const hasAccessToken = cookies.some((c) =>
      c.startsWith("sb-access-token="),
    );
    expect(hasAccessToken).toBe(false);
  });

  test("clears sb-refresh-token cookie", async () => {
    cookies = ["sb-refresh-token=old-refresh"];

    await logout();

    const hasRefreshToken = cookies.some((c) =>
      c.startsWith("sb-refresh-token="),
    );
    expect(hasRefreshToken).toBe(false);
  });

  test("redirects to /login", async () => {
    await logout();

    expect(global.window.location.href).toBe("/login");
  });

  test("redirects to /login even if supabase signOut fails", async () => {
    mockSupabaseSignOut.mockImplementation(() =>
      Promise.reject(new Error("Network error")),
    );

    await logout();

    expect(global.window.location.href).toBe("/login");
  });

  test("redirects to /login even if authStore signOut fails", async () => {
    mockSignOut.mockImplementation(() =>
      Promise.reject(new Error("Store error")),
    );

    await logout();

    expect(global.window.location.href).toBe("/login");
  });

  test("clears cookies even if supabase signOut fails", async () => {
    mockSupabaseSignOut.mockImplementation(() =>
      Promise.reject(new Error("Network error")),
    );
    cookies = ["sb-access-token=token", "sb-refresh-token=refresh"];

    await logout();

    expect(cookies).toHaveLength(0);
  });

  test("handles multiple cookies", async () => {
    cookies = [
      "sb-access-token=token123",
      "sb-refresh-token=refresh456",
      "other-cookie=value",
    ];

    await logout();

    // Only auth cookies should be cleared
    const hasAccessToken = cookies.some((c) =>
      c.startsWith("sb-access-token="),
    );
    const hasRefreshToken = cookies.some((c) =>
      c.startsWith("sb-refresh-token="),
    );
    expect(hasAccessToken).toBe(false);
    expect(hasRefreshToken).toBe(false);
    expect(cookies).toContain("other-cookie=value");
  });

  test("continues to redirect when no cookies exist", async () => {
    cookies = [];

    await logout();

    expect(global.window.location.href).toBe("/login");
  });

  test("always executes in finally block", async () => {
    mockSupabaseSignOut.mockImplementation(() =>
      Promise.reject(new Error("Supabase error")),
    );
    mockSignOut.mockImplementation(() =>
      Promise.reject(new Error("Store error")),
    );

    await logout();

    // Despite errors, redirect should still happen
    expect(global.window.location.href).toBe("/login");
    expect(cookies).toHaveLength(0);
  });

  test("sets correct cookie attributes for clearing", async () => {
    // Capture the cookie strings that are set
    const setCookies: string[] = [];
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      global.document,
      "cookie",
    );

    Object.defineProperty(global.document, "cookie", {
      set: (value: string) => {
        setCookies.push(value);
      },
      get: () => cookies.join("; "),
      configurable: true,
    });

    await logout();

    // Restore original descriptor
    if (originalDescriptor) {
      Object.defineProperty(global.document, "cookie", originalDescriptor);
    }

    // Check that cookies are cleared with correct attributes
    const accessTokenCookie = setCookies.find((c) =>
      c.startsWith("sb-access-token="),
    );
    const refreshTokenCookie = setCookies.find((c) =>
      c.startsWith("sb-refresh-token="),
    );

    expect(accessTokenCookie).toContain("Path=/");
    expect(accessTokenCookie).toContain("Max-Age=0");
    expect(accessTokenCookie).toContain("SameSite=Lax");

    expect(refreshTokenCookie).toContain("Path=/");
    expect(refreshTokenCookie).toContain("Max-Age=0");
    expect(refreshTokenCookie).toContain("SameSite=Lax");
  });
});
