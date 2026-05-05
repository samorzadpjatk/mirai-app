import { describe, it, expect, vi, beforeEach } from "vitest";
import createBaseSupabaseClient from "../base";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClientOptions } from "../types";

// Mock the @supabase/supabase-js module
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

describe("createBaseSupabaseClient", () => {
  const mockUrl = "https://test.supabase.co";
  const mockAnonKey = "test-anon-key";
  const mockSupabaseClient = {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof createClient>);
  });

  it("should create a Supabase client with URL and anon key", () => {
    createBaseSupabaseClient(mockUrl, mockAnonKey);

    expect(createClient).toHaveBeenCalledWith(
      mockUrl,
      mockAnonKey,
      expect.any(Object)
    );
  });

  it("should return the created Supabase client", () => {
    const result = createBaseSupabaseClient(mockUrl, mockAnonKey);

    expect(result).toBe(mockSupabaseClient);
  });

  it("should configure default auth options", () => {
    createBaseSupabaseClient(mockUrl, mockAnonKey);

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    );
  });

  it("should configure realtime options with eventsPerSecond", () => {
    createBaseSupabaseClient(mockUrl, mockAnonKey);

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    );
  });

  it("should merge custom auth options with defaults", () => {
    const customOptions: SupabaseClientOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    };

    createBaseSupabaseClient(mockUrl, mockAnonKey, customOptions);

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: true,
        },
      })
    );
  });

  it("should merge custom realtime options with defaults", () => {
    const customOptions: SupabaseClientOptions = {
      realtime: {
        params: {
          eventsPerSecond: 20,
          customParam: "value",
        },
      },
    };

    createBaseSupabaseClient(mockUrl, mockAnonKey, customOptions);

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        realtime: {
          params: {
            eventsPerSecond: 20,
            customParam: "value",
          },
        },
      })
    );
  });

  it("should handle empty options object", () => {
    createBaseSupabaseClient(mockUrl, mockAnonKey, {});

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    );
  });

  it("should log client creation with URL", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    createBaseSupabaseClient(mockUrl, mockAnonKey);

    expect(consoleSpy).toHaveBeenCalledWith(
      `[Supabase] Creating client with URL: ${mockUrl}`
    );

    consoleSpy.mockRestore();
  });

  it("should handle different URL formats", () => {
    const urls = [
      "https://test.supabase.co",
      "https://my-project.supabase.co",
      "http://localhost:54321",
    ];

    urls.forEach((url) => {
      vi.clearAllMocks();
      createBaseSupabaseClient(url, mockAnonKey);
      expect(createClient).toHaveBeenCalledWith(url, mockAnonKey, expect.any(Object));
    });
  });

  it("should handle different key formats", () => {
    const keys = [
      "test-anon-key",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "service-role-key",
    ];

    keys.forEach((key) => {
      vi.clearAllMocks();
      createBaseSupabaseClient(mockUrl, key);
      expect(createClient).toHaveBeenCalledWith(mockUrl, key, expect.any(Object));
    });
  });

  it("should preserve additional options passed to auth", () => {
    const customOptions: SupabaseClientOptions = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Additional auth options
        flowType: "pkce" as const,
        debug: true,
      },
    };

    createBaseSupabaseClient(mockUrl, mockAnonKey, customOptions);

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          debug: true,
        }),
      })
    );
  });

  it("should handle options with only realtime settings", () => {
    const customOptions: SupabaseClientOptions = {
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    };

    createBaseSupabaseClient(mockUrl, mockAnonKey, customOptions);

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 5,
          },
        },
      })
    );
  });

  it("should handle options with only auth settings", () => {
    const customOptions: SupabaseClientOptions = {
      auth: {
        autoRefreshToken: false,
      },
    };

    createBaseSupabaseClient(mockUrl, mockAnonKey, customOptions);

    const callArgs = vi.mocked(createClient).mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual(
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    );
  });
});
