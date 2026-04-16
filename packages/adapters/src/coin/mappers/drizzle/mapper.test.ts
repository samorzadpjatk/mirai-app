import { describe, it, expect } from "bun:test";
import { CoinTransactionDTODrizzleMapper } from "./mapper";
import { coinTransactions } from "@mirai-app/frameworks/drizzle/schema";

describe("[UNIT] CoinTransactionDTODrizzleMapper", () => {
  const mapper = CoinTransactionDTODrizzleMapper.instance;

  // Factory for creating mock Drizzle coin transaction records
  const createMockCoinTransactionSelect = (
    overrides: Record<string, unknown> = {},
  ) => ({
    id: "transaction-123",
    tripId: "trip-456",
    groupId: "group-789",
    amount: 100,
    reason: "Test transaction",
    adminId: "admin-001",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to CoinTransactionDTO", () => {
      const record = createMockCoinTransactionSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("transaction-123");
      expect(dto.groupId).toBe("group-789");
      expect(dto.amount).toBe(100);
      expect(dto.reason).toBe("Test transaction");
      expect(dto.adminId).toBe("admin-001");
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null reason", () => {
      const record = createMockCoinTransactionSelect({
        reason: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.reason).toBeNull();
    });

    it("includes group relation when groupName is provided", () => {
      const record = createMockCoinTransactionSelect({
        groupName: "Test Group",
        groupCoins: 500,
      });

      const dto = mapper.toDTO(record);

      expect(dto.group).toEqual({
        id: "group-789",
        name: "Test Group",
        coins: 500,
      });
    });

    it("excludes group relation when groupName is not provided", () => {
      const record = createMockCoinTransactionSelect();

      const dto = mapper.toDTO(record);

      expect(dto.group).toBeUndefined();
    });

    it("includes admin relation when adminFirstName is provided", () => {
      const record = createMockCoinTransactionSelect({
        adminFirstName: "John",
        adminLastName: "Doe",
      });

      const dto = mapper.toDTO(record);

      expect(dto.admin).toEqual({
        id: "admin-001",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("includes admin relation with null lastName when not provided", () => {
      const record = createMockCoinTransactionSelect({
        adminFirstName: "John",
        adminLastName: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.admin).toEqual({
        id: "admin-001",
        firstName: "John",
        lastName: null,
      });
    });

    it("excludes admin relation when adminFirstName is not provided", () => {
      const record = createMockCoinTransactionSelect();

      const dto = mapper.toDTO(record);

      expect(dto.admin).toBeUndefined();
    });

    it("delegates to toDTO for toDomain method", () => {
      const record = createMockCoinTransactionSelect();

      const domainResult = mapper.toDomain(record);
      const dtoResult = mapper.toDTO(record);

      expect(domainResult).toEqual(dtoResult);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts CoinTransactionDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockCoinTransactionSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("transaction-123");
      // tripId defaults to empty string in mapper when not in DTO
      expect(insert.tripId).toBe("");
      expect(insert.groupId).toBe("group-789");
      expect(insert.amount).toBe(100);
      expect(insert.reason).toBe("Test transaction");
      expect(insert.adminId).toBe("admin-001");
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null reason in insert", () => {
      const record = createMockCoinTransactionSelect({
        reason: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.reason).toBeNull();
    });

    it("uses provided tripId from DTO if available", () => {
      const record = createMockCoinTransactionSelect();
      const dto = mapper.toDTO(record);
      // Add tripId to DTO
      (dto as unknown as Record<string, unknown>).tripId = "custom-trip-123";

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.tripId).toBe("custom-trip-123");
    });

    it("defaults createdAt to now if not provided", () => {
      const record = createMockCoinTransactionSelect();
      const dto = mapper.toDTO(record);
      // Set createdAt to null to trigger default
      (dto as unknown as Record<string, unknown>).createdAt = null;

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts CoinTransactionDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockCoinTransactionSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Only amount and reason should be updatable
      expect(update.amount).toBe(100);
      expect(update.reason).toBe("Test transaction");
    });

    it("handles null reason in update", () => {
      const record = createMockCoinTransactionSelect({
        reason: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.reason).toBeNull();
    });
  });

  describe("fromPartial", () => {
    it("creates partial entity with all fields present", () => {
      const record = {
        id: "transaction-123",
        groupId: "group-789",
        amount: 100,
        reason: "Test transaction",
        adminId: "admin-001",
      };

      const partial = mapper.fromPartial(record);

      expect(partial.id).toBe("transaction-123");
      expect(partial.groupId).toBe("group-789");
      expect(partial.amount).toBe(100);
      expect(partial.reason).toBe("Test transaction");
      expect(partial.adminId).toBe("admin-001");
    });

    it("creates partial entity with only some fields present", () => {
      const record = {
        id: "transaction-123",
        amount: 200,
      };

      const partial = mapper.fromPartial(record);

      expect(partial.id).toBe("transaction-123");
      expect(partial.amount).toBe(200);
      expect(partial.groupId).toBeUndefined();
      expect(partial.reason).toBeUndefined();
      expect(partial.adminId).toBeUndefined();
    });

    it("handles zero amount correctly", () => {
      const record = {
        amount: 0,
      };

      const partial = mapper.fromPartial(record);

      expect(partial.amount).toBe(0);
    });

    it("returns empty object when no fields match", () => {
      const record = {};

      const partial = mapper.fromPartial(record);

      expect(partial).toEqual({});
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = CoinTransactionDTODrizzleMapper.instance;
      const instance2 = CoinTransactionDTODrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
