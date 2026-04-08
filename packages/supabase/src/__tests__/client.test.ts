import { describe, test, expect, mock, spyOn } from "bun:test";
import { createSupabaseClient } from "../client";

const mockCreateClient = mock(() => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: {} }, error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
  removeChannel: () => ({}),
}));

mock.module("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
  REALTIME_CHANNEL_STATES: { CHANNEL: "joined" },
}));

describe("createSupabaseClient", () => {
  test("creates a client with valid URL and key", () => {
    const client = createSupabaseClient(
      "https://example.supabase.co",
      "test-anon-key",
    );

    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  test("creates a client with custom options", () => {
    const customOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    };

    const client = createSupabaseClient(
      "https://example.supabase.co",
      "test-anon-key",
      undefined,
      customOptions,
    );

    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  test("the returned client has expected auth and database methods", () => {
    const client = createSupabaseClient(
      "https://example.supabase.co",
      "test-anon-key",
    );

    expect(typeof client.auth.getSession).toBe("function");
    expect(typeof client.auth.getUser).toBe("function");
    expect(typeof client.auth.signInWithPassword).toBe("function");
    expect(typeof client.auth.signOut).toBe("function");
    expect(typeof client.auth.onAuthStateChange).toBe("function");
    expect(typeof client.from).toBe("function");
    expect(typeof client.channel).toBe("function");
    expect(typeof client.removeChannel).toBe("function");
  });

  test("creates client with custom storage adapter", () => {
    const customStorage = {
      getItem: (key: string) => "test-value",
      setItem: (key: string, value: string) => {},
      removeItem: (key: string) => {},
    };

    const client = createSupabaseClient(
      "https://example.supabase.co",
      "test-anon-key",
      customStorage,
    );

    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  test("uses in-memory storage when no storage provided and no globalStorage available", () => {
    const client = createSupabaseClient(
      "https://example.supabase.co",
      "test-anon-key",
    );

    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });
});
