/**
 * Smoke Test for Native Test Setup
 *
 * Verifies that Bun test runner with Happy DOM and TamaguiProvider
 * is configured correctly for the native app using @mirai-app/ui/test.
 *
 * @module test/smoke.test
 */

import { describe, it, expect } from "bun:test";
import { isTestEnvironment } from "@mirai-app/ui/test";

describe("[UNIT] Native Test Setup - Core", () => {
  it("should confirm test environment", () => {
    expect(isTestEnvironment).toBe(true);
  });

  it("should have Happy DOM globals available", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
    expect(typeof HTMLElement).toBe("function");
  });

  it("should preserve native fetch", () => {
    expect(typeof fetch).toBe("function");
    expect(typeof Response).toBe("function");
    expect(typeof Request).toBe("function");
    expect(typeof Headers).toBe("function");
  });

  it("should have React Native globals", () => {
    expect(typeof __DEV__).toBe("boolean");
  });

  it("should have navigator available", () => {
    expect(typeof navigator).toBe("object");
    expect(navigator.product).toBeDefined();
  });
});

describe("[UNIT] Native Test Setup - @mirai-app/ui/test Integration", () => {
  it("should import TestWrapper from @mirai-app/ui/test", async () => {
    const { TestWrapper } = await import("@mirai-app/ui/test");
    expect(TestWrapper).toBeDefined();
    expect(typeof TestWrapper).toBe("function");
  });

  it("should import createTestWrapper from @mirai-app/ui/test", async () => {
    const { createTestWrapper } = await import("@mirai-app/ui/test");
    expect(createTestWrapper).toBeDefined();
    expect(typeof createTestWrapper).toBe("function");
  });

  it("should import TestWrapperDark from @mirai-app/ui/test", async () => {
    const { TestWrapperDark } = await import("@mirai-app/ui/test");
    expect(TestWrapperDark).toBeDefined();
    expect(typeof TestWrapperDark).toBe("function");
  });

  it("should import TestWrapperProps type from @mirai-app/ui/test", async () => {
    const { TestWrapper } = await import("@mirai-app/ui/test");
    // TestWrapperProps is a type, so we verify the component exists
    expect(TestWrapper).toBeDefined();
  });
});
