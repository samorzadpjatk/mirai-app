import { describe, it, expect } from "vitest";
import { createContext } from "../../src/trpc";

describe("trpc context", () => {
  it("provides db on context", () => {
    const ctx = createContext();
    expect(ctx).toHaveProperty("db");
  });
});
