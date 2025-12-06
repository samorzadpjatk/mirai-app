import { describe, it, expect, vi } from "vitest";
import createSupabaseClient from "~/supabaseClient";

describe("createSupabaseClient", () => {
  it("should create a supabase client with auth prop", () => {
    const client = createSupabaseClient(
      "https://example.supabase.com",
      "test-anon-key",
    );

    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("should accept custom storage options", () => {
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    const client = createSupabaseClient(
      "https://example.supabase.com",
      "test-anon-key",
      {
        auth: {
          storage: mockStorage,
        },
      },
    );

    expect(client).toBeDefined();
  });
});
