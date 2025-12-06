import { describe, it, expect, beforeEach } from "vitest";
import { arrayBufferToBase64 } from "../web_push";

describe("arrayBufferToBase64", () => {
  beforeEach(() => {
    // Setup DOM environment for btoa
    if (typeof window === "undefined") {
      // @ts-expect-error - global window mock
      global.window = {};
    }
  });

  it("should convert an empty ArrayBuffer to an empty base64 string", () => {
    const buffer = new ArrayBuffer(0);
    const result = arrayBufferToBase64(buffer);
    expect(result).toBe("");
  });

  it("should convert a simple ArrayBuffer to base64", () => {
    // Create an ArrayBuffer with some bytes
    const buffer = new ArrayBuffer(3);
    const view = new Uint8Array(buffer);
    view[0] = 72; // 'H'
    view[1] = 105; // 'i'
    view[2] = 33; // '!'

    const result = arrayBufferToBase64(buffer);
    // "Hi!" in base64 is "SGkh"
    expect(result).toBe("SGkh");
  });

  it("should handle ArrayBuffer with single byte", () => {
    const buffer = new ArrayBuffer(1);
    const view = new Uint8Array(buffer);
    view[0] = 65; // 'A'

    const result = arrayBufferToBase64(buffer);
    // "A" in base64 is "QQ=="
    expect(result).toBe("QQ==");
  });

  it("should handle ArrayBuffer with multiple bytes", () => {
    const buffer = new ArrayBuffer(5);
    const view = new Uint8Array(buffer);
    view[0] = 72; // 'H'
    view[1] = 101; // 'e'
    view[2] = 108; // 'l'
    view[3] = 108; // 'l'
    view[4] = 111; // 'o'

    const result = arrayBufferToBase64(buffer);
    // "Hello" in base64 is "SGVsbG8="
    expect(result).toBe("SGVsbG8=");
  });

  it("should handle ArrayBuffer with binary data", () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view[0] = 0;
    view[1] = 255;
    view[2] = 128;
    view[3] = 64;

    const result = arrayBufferToBase64(buffer);
    // Should produce valid base64 string
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("should handle ArrayBuffer with all zeros", () => {
    const buffer = new ArrayBuffer(4);
    // All bytes are already 0 by default
    
    const result = arrayBufferToBase64(buffer);
    // Four zero bytes in base64 is "AAAAAA=="
    expect(result).toBe("AAAAAA==");
  });

  it("should handle ArrayBuffer with max byte values", () => {
    const buffer = new ArrayBuffer(3);
    const view = new Uint8Array(buffer);
    view[0] = 255;
    view[1] = 255;
    view[2] = 255;

    const result = arrayBufferToBase64(buffer);
    // Three 0xFF bytes in base64 is "////"
    expect(result).toBe("////");
  });

  it("should properly iterate through all bytes in the buffer", () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < 8; i++) {
      view[i] = i + 1; // 1, 2, 3, 4, 5, 6, 7, 8
    }

    const result = arrayBufferToBase64(buffer);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    // The result should be a valid base64 string
    expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});