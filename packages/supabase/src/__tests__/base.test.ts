import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import createBaseSupabaseClient from "~/base";

const mockSupabaseClient = {
  auth: { getSession: vi.fn(), getUser: vi.fn() },
  from: vi.fn(),
} as unknown as SupabaseClient;

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

const getLastCall = () => vi.mocked(createClient).mock.calls.at(-1);

describe("createBaseSupabaseClient", () => {
  const url = "https://example.supabase.co";
  const anonKey = "test-anon-key";

  beforeEach(() => {
    vi.mocked(createClient).mockClear();
  });

  it("applies default auth configuration", () => {
    createBaseSupabaseClient(url, anonKey);

    expect(createClient).toHaveBeenCalledWith(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  });

  it("merges custom auth overrides with defaults", () => {
    const customStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    createBaseSupabaseClient(url, anonKey, {
      auth: {
        storage: customStorage,
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    expect(createClient).toHaveBeenCalledWith(url, anonKey, {
      auth: {
        storage: customStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: true,
      },
    });
  });

  it("returns the supabase-js client instance", () => {
    const client = createBaseSupabaseClient(url, anonKey);

    expect(client).toBe(mockSupabaseClient);

    const [, , options] = getLastCall() ?? [];
    expect(options?.auth?.autoRefreshToken).toBe(true);
  });
});
