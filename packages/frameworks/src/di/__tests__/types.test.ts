import { describe, it, expect } from "bun:test";
import { TYPES, ServiceIdentifier, ServiceIdentifierValue } from "../types";

describe("[UNIT] TYPES - Service Identifiers", () => {
  describe("Required Symbols (Step 4 Success Criteria)", () => {
    it("should have PrismaClient symbol", () => {
      expect(TYPES.PrismaClient).toBeDefined();
      expect(typeof TYPES.PrismaClient).toBe("symbol");
    });

    it("should have UserRepository symbol", () => {
      expect(TYPES.UserRepository).toBeDefined();
      expect(typeof TYPES.UserRepository).toBe("symbol");
    });

    it("should have ChallengeRepository symbol", () => {
      expect(TYPES.ChallengeRepository).toBeDefined();
      expect(typeof TYPES.ChallengeRepository).toBe("symbol");
    });

    it("should have GroupRepository symbol", () => {
      expect(TYPES.GroupRepository).toBeDefined();
      expect(typeof TYPES.GroupRepository).toBe("symbol");
    });

    it("should have UserController symbol", () => {
      expect(TYPES.UserController).toBeDefined();
      expect(typeof TYPES.UserController).toBe("symbol");
    });
  });

  describe("Cross-Realm Compatibility (Symbol.for())", () => {
    it("should use Symbol.for() for PrismaClient", () => {
      const fromTypes = TYPES.PrismaClient;
      const recreated = Symbol.for("PrismaClient");
      expect(fromTypes).toBe(recreated);
    });

    it("should use Symbol.for() for UserRepository", () => {
      const fromTypes = TYPES.UserRepository;
      const recreated = Symbol.for("UserRepository");
      expect(fromTypes).toBe(recreated);
    });

    it("should use Symbol.for() for ChallengeRepository", () => {
      const fromTypes = TYPES.ChallengeRepository;
      const recreated = Symbol.for("ChallengeRepository");
      expect(fromTypes).toBe(recreated);
    });

    it("should use Symbol.for() for GroupRepository", () => {
      const fromTypes = TYPES.GroupRepository;
      const recreated = Symbol.for("GroupRepository");
      expect(fromTypes).toBe(recreated);
    });

    it("should use Symbol.for() for UserController", () => {
      const fromTypes = TYPES.UserController;
      const recreated = Symbol.for("UserController");
      expect(fromTypes).toBe(recreated);
    });
  });

  describe("Symbol Uniqueness", () => {
    it("should have unique symbols (no collisions)", () => {
      const symbols = Object.values(TYPES);
      const uniqueSymbols = new Set(symbols);
      expect(symbols.length).toBe(uniqueSymbols.size);
    });

    it("should have 35 total symbols", () => {
      const keys = Object.keys(TYPES);
      expect(keys.length).toBe(35);
    });
  });

  describe("Symbol Organization by Category", () => {
    it("should have Framework Services", () => {
      expect(TYPES.PrismaClient).toBeDefined();
      expect(TYPES.SupabaseClient).toBeDefined();
    });

    it("should have Repository Layer (16 repositories)", () => {
      const repoKeys = Object.keys(TYPES).filter((k) =>
        k.endsWith("Repository"),
      );
      expect(repoKeys.length).toBe(16);
    });

    it("should have Service Layer (6 services)", () => {
      const serviceKeys = Object.keys(TYPES).filter((k) =>
        k.endsWith("Service"),
      );
      expect(serviceKeys.length).toBe(6);
    });

    it("should have Controllers (6 controllers)", () => {
      const controllerKeys = Object.keys(TYPES).filter((k) =>
        k.endsWith("Controller"),
      );
      expect(controllerKeys.length).toBe(6);
    });

    it("should have Infrastructure (Logger, Cache, EventBus)", () => {
      expect(TYPES.Logger).toBeDefined();
      expect(TYPES.Cache).toBeDefined();
      expect(TYPES.EventBus).toBeDefined();
    });

    it("should have Request Context (RequestId, UserContext)", () => {
      expect(TYPES.RequestId).toBeDefined();
      expect(TYPES.UserContext).toBeDefined();
    });
  });

  describe("TypeScript Type Exports", () => {
    it("should export ServiceIdentifier type", () => {
      // This test verifies at compile time that the type is exported
      const key: ServiceIdentifier = "UserRepository";
      expect(key).toBe("UserRepository");
    });

    it("should export ServiceIdentifierValue type", () => {
      // This test verifies at compile time that the type is exported
      const value: ServiceIdentifierValue = TYPES.UserRepository;
      expect(value).toBe(TYPES.UserRepository);
    });
  });

  describe("Symbol Descriptions", () => {
    it("should have proper descriptions for required symbols", () => {
      expect(TYPES.PrismaClient.description).toBe("PrismaClient");
      expect(TYPES.UserRepository.description).toBe("UserRepository");
      expect(TYPES.ChallengeRepository.description).toBe("ChallengeRepository");
      expect(TYPES.GroupRepository.description).toBe("GroupRepository");
      expect(TYPES.UserController.description).toBe("UserController");
    });
  });
});
