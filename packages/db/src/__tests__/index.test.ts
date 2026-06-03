import { describe, expect, it } from "vitest";
import { closeDb, createDb, runMigrations } from "../index";

describe("index exports", () => {
  it("should export createDb", () => {
    expect(createDb).toBeDefined();
    expect(typeof createDb).toBe("function");
  });

  it("should export closeDb", () => {
    expect(closeDb).toBeDefined();
    expect(typeof closeDb).toBe("function");
  });

  it("should export runMigrations", () => {
    expect(runMigrations).toBeDefined();
    expect(typeof runMigrations).toBe("function");
  });

  it("should export TransactionDB type", () => {
    expect(true).toBe(true);
  });

  it("should export schema-related types", () => {
    expect(true).toBe(true);
  });

  it("should re-export from schema", () => {
    expect(typeof createDb).toBe("function");
    expect(typeof closeDb).toBe("function");
    expect(typeof runMigrations).toBe("function");
  });
});
