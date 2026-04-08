import { describe, expect, test, beforeEach, mock } from "bun:test";

// Store original values
let cookies: string[] = [];
let locationHref = "";

// Mock modules
const mockSignOut = mock(() => Promise.resolve());
const mockSupabaseSignOut = mock(() => Promise.resolve());

mock.module("@mirai-app/auth/client", () => ({
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

// Mock document.cookie
global.document = {
  get cookie() {
    return cookies.join("; ");
  },
  set cookie(value: string) {
    // Parse and store cookie
    if (value.includes("Max-Age=0")) {
      // Deleting cookie - remove from array
      const cookieName = value.split("=")[0];
      cookies = cookies.filter((c) => !c.startsWith(cookieName + "="));
    } else {
      cookies.push(value);
    }
  },
} as any;

// Mock window.location
global.window = {
  get location() {
    return {
      href: locationHref,
      set href(value: string) {
        locationHref = value;
      },
    };
  },
  set location(value: any) {},
} as any;

// Import after mocks
import { logout } from "../logout";

beforeEach(() => {
  cookies = [];
  locationHref = "/current-page";
  mockSignOut.mockClear();
  mockSupabaseSignOut.mockClear();
});

describe("logout", () => {
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

    expect(locationHref).toBe("/login");
  });

  test("redirects to /login even if supabase signOut fails", async () => {
    mockSupabaseSignOut.mockImplementation(() =>
      Promise.reject(new Error("Network error")),
    );

    await logout();

    expect(locationHref).toBe("/login");
  });

  test("redirects to /login even if authStore signOut fails", async () => {
    mockSignOut.mockImplementation(() =>
      Promise.reject(new Error("Store error")),
    );

    await logout();

    expect(locationHref).toBe("/login");
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

    expect(locationHref).toBe("/login");
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
    expect(locationHref).toBe("/login");
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
