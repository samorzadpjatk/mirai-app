import { describe, it, expect } from "bun:test";
import { PushSubscriptionDrizzleMapper } from "./push-subscription-mapper";
import type { PushSubscriptionDTO } from "@mirai-app/use-cases";
import type { PushSubscriptionSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] PushSubscriptionDrizzleMapper", () => {
  const mapper = PushSubscriptionDrizzleMapper.instance;

  // Factory for creating mock Drizzle PushSubscription records
  const createMockSubscriptionSelect = (
    overrides: Partial<PushSubscriptionSelect> = {},
  ): PushSubscriptionSelect => ({
    id: "sub-123",
    userId: "user-456",
    expoPushToken: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    platform: "ios",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  // Factory for creating mock DTOs
  const createMockSubscriptionDTO = (
    overrides: Partial<PushSubscriptionDTO> = {},
  ): PushSubscriptionDTO => ({
    id: "sub-123",
    userId: "user-456",
    token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    platform: "ios",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to PushSubscriptionDTO", () => {
      const record = createMockSubscriptionSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("sub-123");
      expect(dto.userId).toBe("user-456");
      expect(dto.token).toBe("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]");
      expect(dto.platform).toBe("ios");
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("maps android platform correctly", () => {
      const record = createMockSubscriptionSelect({
        platform: "android",
        expoPushToken: "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
      });

      const dto = mapper.toDTO(record);

      expect(dto.platform).toBe("android");
      expect(dto.token).toBe("ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]");
    });

    it("maps web platform correctly", () => {
      const record = createMockSubscriptionSelect({
        platform: "web",
      });

      const dto = mapper.toDTO(record);

      expect(dto.platform).toBe("web");
    });

    it("handles different token formats", () => {
      const record = createMockSubscriptionSelect({
        expoPushToken: "custom-token-format-12345",
      });

      const dto = mapper.toDTO(record);

      expect(dto.token).toBe("custom-token-format-12345");
    });

    it("handles different timestamps", () => {
      const createdAt = new Date("2023-06-01T12:00:00Z");
      const updatedAt = new Date("2024-01-15T10:00:00Z");
      const record = createMockSubscriptionSelect({
        createdAt,
        updatedAt,
      });

      const dto = mapper.toDTO(record);

      expect(dto.createdAt).toEqual(createdAt);
      expect(dto.updatedAt).toEqual(updatedAt);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts PushSubscriptionDTO to Drizzle insert input", () => {
      const dto = createMockSubscriptionDTO();

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("sub-123");
      expect(insert.userId).toBe("user-456");
      expect(insert.expoPushToken).toBe(
        "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      );
      expect(insert.platform).toBe("ios");
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("maps all fields directly without transformation", () => {
      const dto = createMockSubscriptionDTO({
        id: "sub-custom",
        userId: "user-custom",
        token: "custom-token",
        platform: "custom-platform",
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-12-31T23:59:59Z"),
      });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("sub-custom");
      expect(insert.userId).toBe("user-custom");
      expect(insert.expoPushToken).toBe("custom-token");
      expect(insert.platform).toBe("custom-platform");
      expect(insert.createdAt).toEqual(new Date("2023-01-01T00:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2023-12-31T23:59:59Z"));
    });

    it("preserves token format exactly", () => {
      const dto = createMockSubscriptionDTO({
        token: "ExponentPushToken[abc123def456]",
      });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.expoPushToken).toBe("ExponentPushToken[abc123def456]");
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts PushSubscriptionDTO to Drizzle update input", () => {
      const dto = createMockSubscriptionDTO();

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or userId (immutable fields)
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("userId");
      expect(update).not.toHaveProperty("createdAt");

      // Should include mutable fields
      expect(update.expoPushToken).toBe(
        "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      );
      expect(update.platform).toBe("ios");
    });

    it("updates expoPushToken and platform from DTO", () => {
      const dto = createMockSubscriptionDTO({
        token: "ExponentPushToken[updated-token]",
        platform: "android",
      });

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.expoPushToken).toBe("ExponentPushToken[updated-token]");
      expect(update.platform).toBe("android");
    });

    it("updates updatedAt to current time", () => {
      const dto = createMockSubscriptionDTO();
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("does not include original updatedAt from DTO", () => {
      const dto = createMockSubscriptionDTO({
        updatedAt: new Date("2023-01-01T00:00:00Z"),
      });

      const update = mapper.toDrizzleUpdate(dto);

      // The updatedAt should be a new Date, not the DTO's updatedAt
      expect(update.updatedAt).not.toEqual(new Date("2023-01-01T00:00:00Z"));
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = PushSubscriptionDrizzleMapper.instance;
      const instance2 = PushSubscriptionDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });

    it("is a PushSubscriptionDrizzleMapper", () => {
      const instance = PushSubscriptionDrizzleMapper.instance;

      expect(instance).toBeInstanceOf(PushSubscriptionDrizzleMapper);
    });
  });

  describe("mapper interface compliance", () => {
    it("implements DrizzleEntityMapper interface", () => {
      // Verify the mapper has all required methods
      expect(typeof mapper.toDTO).toBe("function");
      expect(typeof mapper.toDrizzleInsert).toBe("function");
      expect(typeof mapper.toDrizzleUpdate).toBe("function");
    });

    it("round-trip conversion preserves data integrity", () => {
      const originalRecord = createMockSubscriptionSelect();
      const dto = mapper.toDTO(originalRecord);
      const insertData = mapper.toDrizzleInsert(dto);

      // Verify key fields are preserved through round-trip
      expect(insertData.id).toBe(originalRecord.id);
      expect(insertData.userId).toBe(originalRecord.userId);
      expect(insertData.expoPushToken).toBe(originalRecord.expoPushToken);
      expect(insertData.platform).toBe(originalRecord.platform);
    });
  });
});

/**
 * Summary
 *
 * This test suite covers the PushSubscriptionDrizzleMapper which handles
 * bidirectional mapping between Drizzle database records and PushSubscriptionDTOs.
 *
 * Test Coverage:
 * - toDTO: Converts Drizzle records to DTOs, handling all platform types (ios,
 *   android, web) and various token formats
 * - toDrizzleInsert: Converts DTOs to insert format with direct field mapping
 * - toDrizzleUpdate: Converts DTOs to update format with mutable fields only
 *   (expoPushToken, platform, updatedAt), excluding immutable fields
 * - Singleton instance: Verifies proper singleton pattern implementation
 * - Interface compliance: Ensures mapper implements required DrizzleEntityMapper
 *   interface methods
 * - Round-trip integrity: Verifies data consistency through conversion cycles
 *
 * Key Implementation Details:
 * - expoPushToken maps directly to token in DTO and vice versa
 * - Insert includes all fields from DTO including createdAt/updatedAt
 * - Update only includes mutable fields: expoPushToken, platform, and fresh updatedAt
 * - Immutable fields (id, userId, createdAt) are excluded from updates
 * - updatedAt is always set to current time in update operations
 */
