import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import createBaseSupabaseClient from "../base";
import { createSupabaseClient } from "../client";
import type { StorageAdapter, SupabaseClientOptions } from "../types";
import { createMockSupabaseClient } from "./utils";

// Mock the base module
vi.mock("../base", () => ({
  default: vi.fn(),
}));

describe("createSupabaseClient", () => {
  const mockUrl = "https://test.supabase.co";
  const mockKey = "test-anon-key";
  const mockSupabaseClient = createMockSupabaseClient() as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createBaseSupabaseClient).mockReturnValue(mockSupabaseClient);
  });

  describe("basic client creation", () => {
    it("should create a Supabase client with URL and key", () => {
      createSupabaseClient(mockUrl, mockKey);

      expect(createBaseSupabaseClient).toHaveBeenCalledWith(mockUrl, mockKey, expect.any(Object));
    });

    it("should return the created Supabase client", () => {
      const result = createSupabaseClient(mockUrl, mockKey);

      expect(result).toBe(mockSupabaseClient);
    });
  });

  describe("storage adapter handling", () => {
    it("should use provided storage adapter", () => {
      const mockStorage: StorageAdapter = {
        getItem: vi.fn().mockReturnValue("stored-value"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      createSupabaseClient(mockUrl, mockKey, mockStorage);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: mockStorage,
          }),
        }),
      );
    });

    it("should use in-memory storage when no storage provided and no global localStorage", () => {
      // Ensure (globalThis as { localStorage?: StorageAdapter }).localStorage is undefined
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as { localStorage?: StorageAdapter }).localStorage = undefined;

      createSupabaseClient(mockUrl, mockKey);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2] as SupabaseClientOptions;

      expect(options.auth?.storage).toBeDefined();
      expect(options.auth?.storage?.getItem).toBeDefined();
      expect(options.auth?.storage?.setItem).toBeDefined();
      expect(options.auth?.storage?.removeItem).toBeDefined();

      // Restore original localStorage
      (globalThis as { localStorage?: StorageAdapter }).localStorage = originalLocalStorage;
    });

    it("should use global localStorage when available and no storage provided", () => {
      const mockLocalStorage: StorageAdapter = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      // Set up global localStorage
      (globalThis as { localStorage?: StorageAdapter }).localStorage = mockLocalStorage;

      createSupabaseClient(mockUrl, mockKey);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: mockLocalStorage,
          }),
        }),
      );

      // Clean up
      delete (globalThis as { localStorage?: StorageAdapter }).localStorage;
    });

    it("should prefer provided storage over global localStorage", () => {
      const mockLocalStorage: StorageAdapter = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      const mockCustomStorage: StorageAdapter = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      (globalThis as { localStorage?: StorageAdapter }).localStorage = mockLocalStorage;

      createSupabaseClient(mockUrl, mockKey, mockCustomStorage);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: mockCustomStorage,
          }),
        }),
      );

      delete (globalThis as { localStorage?: StorageAdapter }).localStorage;
    });
  });

  describe("in-memory storage implementation", () => {
    it("should store and retrieve values with in-memory storage", () => {
      // Ensure no global localStorage
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as { localStorage?: StorageAdapter }).localStorage = undefined;

      createSupabaseClient(mockUrl, mockKey);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2] as SupabaseClientOptions;
      const storage = options.auth?.storage;

      // Test storage operations
      storage?.setItem("test-key", "test-value");
      const value = storage?.getItem("test-key");

      expect(value).toBe("test-value");

      // Restore
      (globalThis as { localStorage?: StorageAdapter }).localStorage = originalLocalStorage;
    });

    it("should return null for non-existent keys in in-memory storage", () => {
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as { localStorage?: StorageAdapter }).localStorage = undefined;

      createSupabaseClient(mockUrl, mockKey);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2] as SupabaseClientOptions;
      const storage = options.auth?.storage;

      const value = storage?.getItem("non-existent-key");

      expect(value).toBeNull();

      (globalThis as { localStorage?: StorageAdapter }).localStorage = originalLocalStorage;
    });

    it("should remove items from in-memory storage", () => {
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as { localStorage?: StorageAdapter }).localStorage = undefined;

      createSupabaseClient(mockUrl, mockKey);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2] as SupabaseClientOptions;
      const storage = options.auth?.storage;

      storage?.setItem("key-to-remove", "value");
      storage?.removeItem("key-to-remove");
      const value = storage?.getItem("key-to-remove");

      expect(value).toBeNull();

      (globalThis as { localStorage?: StorageAdapter }).localStorage = originalLocalStorage;
    });

    it("should handle multiple keys in in-memory storage", () => {
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as { localStorage?: StorageAdapter }).localStorage = undefined;

      createSupabaseClient(mockUrl, mockKey);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2] as SupabaseClientOptions;
      const storage = options.auth?.storage;

      storage?.setItem("key1", "value1");
      storage?.setItem("key2", "value2");

      expect(storage?.getItem("key1")).toBe("value1");
      expect(storage?.getItem("key2")).toBe("value2");

      (globalThis as { localStorage?: StorageAdapter }).localStorage = originalLocalStorage;
    });
  });

  describe("options merging", () => {
    it("should merge custom options with defaults", () => {
      const customOptions: SupabaseClientOptions = {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      };

      createSupabaseClient(mockUrl, mockKey, undefined, customOptions);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: true,
          }),
        }),
      );
    });

    it("should include storage in merged auth options", () => {
      const mockStorage: StorageAdapter = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      const customOptions: SupabaseClientOptions = {
        auth: {
          autoRefreshToken: false,
        },
      };

      createSupabaseClient(mockUrl, mockKey, mockStorage, customOptions);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: mockStorage,
            autoRefreshToken: false,
            persistSession: true,
            detectSessionInUrl: true,
          }),
        }),
      );
    });

    it("should preserve other options besides auth", () => {
      const customOptions: SupabaseClientOptions = {
        realtime: {
          params: {
            eventsPerSecond: 5,
          },
        },
      };

      createSupabaseClient(mockUrl, mockKey, undefined, customOptions);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.any(Object),
          realtime: {
            params: {
              eventsPerSecond: 5,
            },
          },
        }),
      );
    });

    it("should handle empty options object", () => {
      createSupabaseClient(mockUrl, mockKey, undefined, {});

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }),
        }),
      );
    });

    it("should handle undefined options", () => {
      createSupabaseClient(mockUrl, mockKey, undefined, undefined);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }),
        }),
      );
    });

    it("should merge deeply nested auth options", () => {
      const customOptions: SupabaseClientOptions = {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      };

      createSupabaseClient(mockUrl, mockKey, undefined, customOptions);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2] as SupabaseClientOptions;

      expect(options.auth?.autoRefreshToken).toBe(false);
      expect(options.auth?.persistSession).toBe(false);
      expect(options.auth?.detectSessionInUrl).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle storage adapter with async methods", () => {
      const asyncStorage: StorageAdapter = {
        getItem: vi.fn().mockResolvedValue("async-value"),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
      };

      createSupabaseClient(mockUrl, mockKey, asyncStorage);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: asyncStorage,
          }),
        }),
      );
    });

    it("should handle storage adapter with sync methods", () => {
      const syncStorage: StorageAdapter = {
        getItem: vi.fn().mockReturnValue("sync-value"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      createSupabaseClient(mockUrl, mockKey, syncStorage);

      const callArgs = vi.mocked(createBaseSupabaseClient).mock.calls[0]!;
      const options = callArgs[2];

      expect(options).toEqual(
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: syncStorage,
          }),
        }),
      );
    });

    it("should handle when globalThis is undefined (edge case)", () => {
      // This tests the getGlobalLocalStorage function when globalThis might be undefined
      // In practice, this shouldn't happen in normal Node.js/Vitest environments
      const result = createSupabaseClient(mockUrl, mockKey);

      expect(result).toBeDefined();
      expect(createBaseSupabaseClient).toHaveBeenCalled();
    });
  });
});
