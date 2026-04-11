import { describe, it, expect } from "bun:test";
import {
  timestamps,
  timestampsWithNow,
  withUpdatedAt,
  updateEntity,
  updateEntityWithNow,
  type Timestamps,
  type DomainEntity,
} from "./immutable";

// Test entity class for updateEntity tests
class TestEntity implements DomainEntity {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly status: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): TestEntity {
    const now = new Date();
    return new TestEntity(
      props.id,
      props.name,
      props.status ?? "active",
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }
}

describe("[UNIT] immutable", () => {
  describe("timestamps", () => {
    it("creates new timestamps when none provided", () => {
      const before = Date.now();
      const result = timestamps();
      const after = Date.now();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it("returns frozen object", () => {
      const result = timestamps();

      expect(Object.isFrozen(result)).toBe(true);
    });

    it("preserves existing createdAt when provided", () => {
      const existingCreated = new Date("2024-01-01");
      const result = timestamps({ createdAt: existingCreated });

      expect(result.createdAt).toBe(existingCreated);
      expect(result.updatedAt).not.toBe(existingCreated);
    });

    it("preserves existing updatedAt when provided", () => {
      const existingUpdated = new Date("2024-01-15");
      const result = timestamps({ updatedAt: existingUpdated });

      expect(result.updatedAt).toBe(existingUpdated);
      expect(result.createdAt).not.toBe(existingUpdated);
    });

    it("preserves both timestamps when both provided", () => {
      const existingCreated = new Date("2024-01-01");
      const existingUpdated = new Date("2024-01-15");
      const result = timestamps({
        createdAt: existingCreated,
        updatedAt: existingUpdated,
      });

      expect(result.createdAt).toBe(existingCreated);
      expect(result.updatedAt).toBe(existingUpdated);
    });

    it("uses new Date() for only unspecified timestamps", () => {
      const existingCreated = new Date("2024-01-01");
      const before = Date.now();
      const result = timestamps({ createdAt: existingCreated });
      const after = Date.now();

      expect(result.createdAt).toBe(existingCreated);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("timestampsWithNow", () => {
    it("uses provided now for both timestamps", () => {
      const fixedNow = new Date("2024-06-15T12:00:00Z");
      const result = timestampsWithNow(fixedNow);

      expect(result.createdAt).toEqual(fixedNow);
      expect(result.updatedAt).toEqual(fixedNow);
    });

    it("preserves existing timestamps over now", () => {
      const fixedNow = new Date("2024-06-15T12:00:00Z");
      const existingCreated = new Date("2024-01-01");
      const result = timestampsWithNow(fixedNow, {
        createdAt: existingCreated,
      });

      expect(result.createdAt).toBe(existingCreated);
      expect(result.updatedAt).toEqual(fixedNow);
    });
  });

  describe("withUpdatedAt", () => {
    it("applies updates and refreshes updatedAt", () => {
      const entity: Timestamps & { id: string; name: string } = {
        id: "test-123",
        name: "Original",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-10"),
      };

      const beforeUpdate = Date.now();
      const updated = withUpdatedAt(entity, { name: "Updated" });
      const afterUpdate = Date.now();

      expect(updated.name).toBe("Updated");
      expect(updated.id).toBe("test-123");
      expect(updated.createdAt).toEqual(entity.createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate);
    });

    it("preserves id and createdAt", () => {
      const entity = {
        id: "test-123",
        name: "Original",
        status: "active",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-10"),
      };

      const updated = withUpdatedAt(entity, { status: "inactive" });

      expect(updated.id).toBe("test-123");
      expect(updated.createdAt).toEqual(new Date("2024-01-01"));
    });

    it("allows multiple property updates", () => {
      const entity = {
        id: "test-123",
        name: "Original",
        status: "active",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-10"),
      };

      const updated = withUpdatedAt(entity, {
        name: "Updated",
        status: "inactive",
      });

      expect(updated.name).toBe("Updated");
      expect(updated.status).toBe("inactive");
    });
  });

  describe("updateEntity", () => {
    it("calls constructor with correct arguments", () => {
      const entity = TestEntity.create({
        id: "test-123",
        name: "Original",
        status: "active",
      });

      const updated = updateEntity(entity, { status: "inactive" }, TestEntity);

      expect(updated).toBeInstanceOf(TestEntity);
      expect(updated.id).toBe("test-123");
      expect(updated.name).toBe("Original");
      expect(updated.status).toBe("inactive");
    });

    it("updates timestamp automatically", () => {
      const entity = TestEntity.create({
        id: "test-123",
        name: "Original",
      });
      const originalUpdatedAt = entity.updatedAt;

      const beforeUpdate = Date.now();
      // Small delay to ensure timestamp difference
      const updated = updateEntity(entity, { name: "Updated" }, TestEntity);
      const afterUpdate = Date.now();

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate);
      // Use >= to handle same millisecond edge case
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });

    it("preserves id and createdAt", () => {
      const createdAt = new Date("2024-01-01");
      const entity = TestEntity.create({
        id: "test-123",
        name: "Original",
        createdAt,
      });

      const updated = updateEntity(entity, { name: "Updated" }, TestEntity);

      expect(updated.id).toBe("test-123");
      expect(updated.createdAt).toEqual(createdAt);
    });
  });

  describe("updateEntityWithNow", () => {
    it("uses provided timestamp for updatedAt", () => {
      const entity = TestEntity.create({
        id: "test-123",
        name: "Original",
      });
      const fixedNow = new Date("2024-06-15T12:00:00Z");

      const updated = updateEntityWithNow(
        entity,
        { name: "Updated" },
        TestEntity,
        fixedNow,
      );

      expect(updated.updatedAt).toEqual(fixedNow);
    });

    it("applies other updates correctly", () => {
      const entity = TestEntity.create({
        id: "test-123",
        name: "Original",
        status: "active",
      });
      const fixedNow = new Date("2024-06-15T12:00:00Z");

      const updated = updateEntityWithNow(
        entity,
        { name: "Updated", status: "inactive" },
        TestEntity,
        fixedNow,
      );

      expect(updated.name).toBe("Updated");
      expect(updated.status).toBe("inactive");
      expect(updated.id).toBe("test-123");
    });
  });
});
