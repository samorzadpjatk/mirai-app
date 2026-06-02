import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomUUID } from "../../utils/uuid";

describe("randomUUID", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should use crypto.randomUUID when available", () => {
    const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(mockUUID),
    });

    const result = randomUUID();

    expect(result).toBe(mockUUID);
    expect(globalThis.crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("should fall back to crypto.getRandomValues when randomUUID is unavailable", () => {
    const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i * 17;
      }
      return arr;
    });

    vi.stubGlobal("crypto", {
      getRandomValues: mockGetRandomValues,
    });

    const result = randomUUID();

    expect(mockGetRandomValues).toHaveBeenCalledTimes(1);
    expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should fall back to crypto.webcrypto.getRandomValues when getRandomValues is unavailable", () => {
    const mockWebCryptoGetRandomValues = vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i * 23;
      }
      return arr;
    });

    vi.stubGlobal("crypto", {
      webcrypto: {
        getRandomValues: mockWebCryptoGetRandomValues,
      },
    });

    const result = randomUUID();

    expect(mockWebCryptoGetRandomValues).toHaveBeenCalledTimes(1);
    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should throw when no secure random source is available", () => {
    vi.stubGlobal("crypto", undefined);

    expect(() => randomUUID()).toThrow("No secure random source available");
  });

  it("should produce a valid v4 UUID format", () => {
    if (!globalThis.crypto?.randomUUID) {
      const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      });
      vi.stubGlobal("crypto", {
        getRandomValues: mockGetRandomValues,
      });
    }

    const result = randomUUID();

    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should set correct version and variant bits", () => {
    const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = 0xff;
      }
      return arr;
    });

    vi.stubGlobal("crypto", {
      getRandomValues: mockGetRandomValues,
    });

    const result = randomUUID();

    expect(result).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
  });
});
