import { describe, expect, it, beforeEach, vi } from "vitest";
import type { MockedFunction } from "vitest";
import { createServerSupabaseClient } from "../server";
import { cookies } from "next/headers";
import { createSupabaseClient } from "@integral-2025-app/auth";

vi.mock("next/headers");
vi.mock("@integral-2025-app/auth", () => ({
  createSupabaseClient: vi.fn(),
}));

const mockCookies = vi.mocked(cookies);
const mockCreateSupabaseClient =
  createSupabaseClient as MockedFunction<typeof createSupabaseClient>;

describe("lib/supabase/server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:8000";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.NODE_ENV = "test";
  });

  describe("createServerSupabaseClient", () => {
    it("should create Supabase client with cookie storage", async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      const mockSupabaseClient = {} as any;

      mockCookies.mockResolvedValue(mockCookieStore as any);
      mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient);

      const result = await createServerSupabaseClient();

      expect(result).toBe(mockSupabaseClient);
      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        "http://localhost:8000",
        "test-anon-key",
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: expect.any(Object),
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          }),
        }),
      );
    });

    it("should implement getItem from cookie storage", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "session-token" }),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);
      mockCreateSupabaseClient.mockReturnValue({} as any);

      await createServerSupabaseClient();

      const callArgs = mockCreateSupabaseClient.mock.calls[0];
      const storage = callArgs?.[2]?.auth?.storage;

      expect(storage).toBeDefined();
      if (storage?.getItem) {
        const result = await storage.getItem("test-key");
        expect(result).toBe("session-token");
        expect(mockCookieStore.get).toHaveBeenCalledWith("test-key");
      }
    });

    it("should return null from getItem when cookie not found", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);
      mockCreateSupabaseClient.mockReturnValue({} as any);

      await createServerSupabaseClient();

      const callArgs = mockCreateSupabaseClient.mock.calls[0];
      const storage = callArgs?.[2]?.auth?.storage;

      if (storage?.getItem) {
        const result = await storage.getItem("test-key");
        expect(result).toBeNull();
      }
    });

    it("should implement setItem with correct cookie options in production", async () => {
      process.env.NODE_ENV = "production";
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);
      mockCreateSupabaseClient.mockReturnValue({} as any);

      await createServerSupabaseClient();

      const callArgs = mockCreateSupabaseClient.mock.calls[0];
      const storage = callArgs?.[2]?.auth?.storage;

      if (storage?.setItem) {
        await storage.setItem("test-key", "test-value");
        expect(mockCookieStore.set).toHaveBeenCalledWith(
          "test-key",
          "base64-dGVzdC12YWx1ZQ==",
          {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 604800,
            path: "/",
          },
        );
      }
    });

    it("should implement setItem with insecure cookies in non-production", async () => {
      process.env.NODE_ENV = "development";
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);
      mockCreateSupabaseClient.mockReturnValue({} as any);

      await createServerSupabaseClient();

      const callArgs = mockCreateSupabaseClient.mock.calls[0];
      const storage = callArgs?.[2]?.auth?.storage;

      if (storage?.setItem) {
        await storage.setItem("test-key", "test-value");
        expect(mockCookieStore.set).toHaveBeenCalledWith(
          "test-key",
          "base64-dGVzdC12YWx1ZQ==",
          {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 604800,
            path: "/",
          },
        );
      }
    });

    it("should implement removeItem to delete cookie", async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);
      mockCreateSupabaseClient.mockReturnValue({} as any);

      await createServerSupabaseClient();

      const callArgs = mockCreateSupabaseClient.mock.calls[0];
      const storage = callArgs?.[2]?.auth?.storage;

      if (storage?.removeItem) {
        await storage.removeItem("test-key");
        expect(mockCookieStore.delete).toHaveBeenCalledWith("test-key");
      }
    });
  });
});
