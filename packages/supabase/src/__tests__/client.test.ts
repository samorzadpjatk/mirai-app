import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseClient } from "~/client";

const createBaseSupabaseClientMock = vi.hoisted(() => vi.fn(() => ({ id: "client" })));

vi.mock("~/base", () => ({
  default: createBaseSupabaseClientMock,
}));

const TEST_URL = "https://test.supabase.co";
const TEST_ANON_KEY = "test-anon-key";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const getLatestAuthOptions = () => {
  const call = createBaseSupabaseClientMock.mock.calls
    .at(-1) as [string, string, { auth: Record<string, unknown> }] | undefined;

  return call?.[2]?.auth;
};

describe("createSupabaseClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as { window?: unknown }).window;
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("passes URL and key to the base factory", () => {
    createSupabaseClient(TEST_URL, TEST_ANON_KEY);

    expect(createBaseSupabaseClientMock).toHaveBeenCalledWith(
      TEST_URL,
      TEST_ANON_KEY,
      expect.anything()
    );
  });

  it("exposes the value returned by the base factory", () => {
    const client = createSupabaseClient(TEST_URL, TEST_ANON_KEY);

    expect(client).toEqual({ id: "client" });
  });

  it("prefers a user-provided storage adapter", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    createSupabaseClient(TEST_URL, TEST_ANON_KEY, storage);

    const latestAuth = getLatestAuthOptions();
    expect(latestAuth?.storage).toBe(storage);
  });

  it("uses browser localStorage when available", () => {
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

    createSupabaseClient(TEST_URL, TEST_ANON_KEY);

    const latestAuth = getLatestAuthOptions();
    expect(latestAuth?.storage).toBe(mockLocalStorage);
  });

  it("falls back to an in-memory storage implementation", () => {
    createSupabaseClient(TEST_URL, TEST_ANON_KEY);

    const latestAuth = getLatestAuthOptions();
    const storage = latestAuth?.storage as StorageLike | undefined;

    expect(storage).toBeDefined();
    expect(storage?.getItem("missing"), "missing entries default to null").toBeNull();
    storage?.setItem("key", "value");
    expect(storage?.getItem("key")).toBe("value");
    storage?.removeItem("key");
    expect(storage?.getItem("key")).toBeNull();
  });

  it("accepts different URL and key values", () => {
    const customUrl = "https://custom.supabase.co";
    const customKey = "custom-anon-key";

    createSupabaseClient(customUrl, customKey);

    expect(createBaseSupabaseClientMock).toHaveBeenCalledWith(
      customUrl,
      customKey,
      expect.anything()
    );
  });
});
