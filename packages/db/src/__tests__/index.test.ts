import { describe, expect, it } from "vitest";
import { closeDb, createDb, runMigrations } from "../index";

describe("index exports", () => {
  it("should export all functions", () => {
    expect(typeof createDb).toBe("function");
    expect(typeof closeDb).toBe("function");
    expect(typeof runMigrations).toBe("function");
  });
});
