import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleGroupCoinsService } from "../group-coins";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";

// Mock the drizzle database
describe("[UNIT] DrizzleGroupCoinsService", () => {
  let service: DrizzleGroupCoinsService;

  beforeEach(() => {
    service = new DrizzleGroupCoinsService({} as DrizzleDb);
  });

  describe("[UNIT] getBalance", () => {
    it("should return Effect that can be run", () => {
      const effect = service.getBalance("group-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });

  describe("[UNIT] deductCoins", () => {
    it("should return Effect that can be run", () => {
      const effect = service.deductCoins(
        "group-123",
        50,
        "Test reason",
        "admin-123",
      );

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });

  describe("[UNIT] addCoins", () => {
    it("should return Effect that can be run", () => {
      const effect = service.addCoins(
        "group-123",
        50,
        "Test reason",
        "admin-123",
      );

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });
});
