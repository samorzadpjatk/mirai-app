/**
 * @jest-environment node
 */

// Test to verify Jest setup is working correctly
// Note: jest, describe, test, expect are globally available in Jest, no need to import

describe("[UNIT] Jest Setup Verification", () => {
  test("Jest is running correctly", () => {
    expect(true).toBe(true);
  });

  test("jest.fn() works correctly", () => {
    const mockFn = jest.fn(() => "mocked value");
    expect(mockFn()).toBe("mocked value");
    expect(mockFn).toHaveBeenCalled();
  });

  test("async/await works correctly", async () => {
    const asyncMock = jest.fn(() => Promise.resolve("async value"));
    const result = await asyncMock();
    expect(result).toBe("async value");
  });

  test("expect matchers work", () => {
    expect(1 + 1).toBe(2);
    expect("hello").toContain("ell");
    expect([1, 2, 3]).toHaveLength(3);
    expect({ a: 1 }).toHaveProperty("a", 1);
  });
});

describe("[UNIT] Native Module Mocks - Basic Verification", () => {
  test("jest.mock is available", () => {
    expect(typeof jest.mock).toBe("function");
  });

  test("can create async mocks", async () => {
    const locationMock = jest.fn(() =>
      Promise.resolve({
        granted: true,
        status: "granted",
      }),
    );

    const result = await locationMock();
    expect(result.granted).toBe(true);
  });
});
