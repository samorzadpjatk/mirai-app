import type { SupabaseClient } from "@mirai-app/supabase";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("config/supabase", () => {
  const mockCreateSupabaseClient = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockCreateSupabaseClient.mockReturnValue({
      auth: { admin: { listUsers: vi.fn() } },
      storage: { listBuckets: vi.fn() },
    });

    vi.doMock("@mirai-app/supabase", () => ({
      createSupabaseClient: (...args: unknown[]) =>
        mockCreateSupabaseClient(...args) as SupabaseClient,
    }));
  });

  it("should create supabase client with URL and service role key", async () => {
    const mockUrl = "https://test.supabase.co";
    const mockKey = "test-service-role-key";

    vi.doMock("../../config/env", () => ({
      env: {
        supabaseUrl: mockUrl,
        serviceRoleKey: mockKey,
      },
    }));

    await import("../../config/supabase");

    expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
      mockUrl,
      mockKey,
      undefined,
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    );
  });

  it("should configure auth options correctly", async () => {
    vi.doMock("../../config/env", () => ({
      env: {
        supabaseUrl: "https://test.supabase.co",
        serviceRoleKey: "test-key",
      },
    }));

    await import("../../config/supabase");

    const callArgs = mockCreateSupabaseClient.mock.calls[0] as [
      string,
      string,
      undefined,
      { auth: { autoRefreshToken: boolean; persistSession: boolean } },
    ];
    const options = callArgs[3];

    expect(options.auth.autoRefreshToken).toBe(false);
    expect(options.auth.persistSession).toBe(false);
  });

  it("should export supabase instance", async () => {
    const mockSupabase = {
      auth: { admin: { createUser: vi.fn() } },
      storage: { from: vi.fn() },
    };

    mockCreateSupabaseClient.mockReturnValue(mockSupabase);

    vi.doMock("../../config/env", () => ({
      env: {
        supabaseUrl: "https://test.supabase.co",
        serviceRoleKey: "test-key",
      },
    }));

    const { supabase } = await import("../../config/supabase");

    expect(supabase).toBe(mockSupabase);
  });

  it("should handle different Supabase URLs", async () => {
    const testUrls = [
      "https://abc123.supabase.co",
      "https://my-project.supabase.co",
      "http://localhost:54321",
    ];

    for (const url of testUrls) {
      vi.resetModules();
      mockCreateSupabaseClient.mockClear();

      vi.doMock("../../config/env", () => ({
        env: {
          supabaseUrl: url,
          serviceRoleKey: "test-key",
        },
      }));

      await import("../../config/supabase");

      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        url,
        "test-key",
        undefined,
        expect.any(Object),
      );
    }
  });

  it("should handle long service role keys", async () => {
    const longKey = "key".repeat(100);

    vi.doMock("../../config/env", () => ({
      env: {
        supabaseUrl: "https://test.supabase.co",
        serviceRoleKey: longKey,
      },
    }));

    await import("../../config/supabase");

    expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      longKey,
      undefined,
      expect.any(Object),
    );
  });
});
