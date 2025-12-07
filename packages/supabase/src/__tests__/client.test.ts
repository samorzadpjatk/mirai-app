import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createBaseSupabaseClientMock = vi.hoisted(() => vi.fn(() => ({ id: "client" })));

vi.mock("../base", () => ({
  default: createBaseSupabaseClientMock,
}));

const DEFAULT_ENV = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  NODE_ENV: "test",
};

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const getLatestAuthOptions = () => {
  const call = createBaseSupabaseClientMock.mock.calls
    .at(-1) as [string, string, { auth: Record<string, unknown> }] | undefined;

  return call?.[2]?.auth;
};

const loadClientModule = async (envOverrides: Partial<typeof DEFAULT_ENV> = {}) => {
  vi.resetModules();
  createBaseSupabaseClientMock.mockClear();
  vi.doMock("../utils/env", () => ({
    env: {
      ...DEFAULT_ENV,
      ...envOverrides,
    },
  }));

  return import("../client");
};

describe("createSupabaseClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as { window?: unknown }).window;
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("passes env configuration to the base factory", async () => {
    const { createSupabaseClient } = await loadClientModule();

    createSupabaseClient();

    expect(createBaseSupabaseClientMock).toHaveBeenCalledWith(
      DEFAULT_ENV.SUPABASE_URL,
      DEFAULT_ENV.SUPABASE_ANON_KEY,
      expect.anything()
    );
  });

  it("exposes the value returned by the base factory", async () => {
    const { createSupabaseClient } = await loadClientModule();

    const client = createSupabaseClient();

    expect(client).toEqual({ id: "client" });
  });

  it("prefers a user-provided storage adapter", async () => {
    const { createSupabaseClient } = await loadClientModule();
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    createSupabaseClient(storage);

    const latestAuth = getLatestAuthOptions();
    expect(latestAuth?.storage).toBe(storage);
  });

  it("uses browser localStorage when available", async () => {
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    (globalThis as { window?: unknown }).window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;

    const { createSupabaseClient } = await loadClientModule();
    createSupabaseClient();

    const latestAuth = getLatestAuthOptions();
    expect(latestAuth?.storage).toBe(mockLocalStorage);
  });

  it("falls back to an in-memory storage implementation", async () => {
    const { createSupabaseClient } = await loadClientModule();

    createSupabaseClient();

    const latestAuth = getLatestAuthOptions();
    const storage = latestAuth?.storage as StorageLike | undefined;

    expect(storage).toBeDefined();
    expect(storage?.getItem("missing"), "missing entries default to null").toBeNull();
    storage?.setItem("key", "value");
    expect(storage?.getItem("key")).toBe("value");
    storage?.removeItem("key");
    expect(storage?.getItem("key")).toBeNull();
  });

  it("re-reads env configuration on each module load", async () => {
    const { createSupabaseClient } = await loadClientModule({
      SUPABASE_URL: "https://override.supabase.co",
    });

    createSupabaseClient();

    expect(createBaseSupabaseClientMock).toHaveBeenCalledWith(
      "https://override.supabase.co",
      DEFAULT_ENV.SUPABASE_ANON_KEY,
      expect.anything()
    );
  });
});
