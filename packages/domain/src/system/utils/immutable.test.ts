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

describe("[UNIT] immutable", () => {
  describe("timestamps", () => {
    it("creates timestamps with current time when no options provided", () => {
      const before = new Date();
      const result = timestamps();
      const after = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("returns frozen object", () => {
      const result = timestamps();
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("creates both timestamps with same value", () => {
      const result = timestamps();
      expect(result.createdAt.getTime()).toBe(result.updatedAt.getTime());
    });

    it("preserves provided createdAt", () => {
      const existingCreatedAt = new Date("2024-01-01");
      const result = timestamps({ createdAt: existingCreatedAt });

      expect(result.createdAt).toBe(existingCreatedAt);
    });

    it("preserves provided updatedAt", () => {
      const existingUpdatedAt = new Date("2024-06-15");
      const result = timestamps({ updatedAt: existingUpdatedAt });

      expect(result.updatedAt).toBe(existingUpdatedAt);
    });

    it("preserves both timestamps when both provided", () => {
      const createdAt = new Date("2024-01-01");
      const updatedAt = new Date("2024-06-15");
      const result = timestamps({ createdAt, updatedAt });

      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });

    it("uses current time for updatedAt when only createdAt provided", () => {
      const before = new Date();
      const createdAt = new Date("2024-01-01");
      const result = timestamps({ createdAt });
      const after = new Date();

      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("uses current time for createdAt when only updatedAt provided", () => {
      const before = new Date();
      const updatedAt = new Date("2024-06-15");
      const result = timestamps({ updatedAt });
      const after = new Date();

      expect(result.updatedAt).toBe(updatedAt);
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("timestampsWithNow", () => {
    it("uses provided now for both timestamps when no options", () => {
      const now = new Date("2024-03-15T12:00:00Z");
      const result = timestampsWithNow(now);

      expect(result.createdAt).toBe(now);
      expect(result.updatedAt).toBe(now);
    });

    it("returns frozen object", () => {
      const now = new Date();
      const result = timestampsWithNow(now);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("preserves provided createdAt using now as fallback", () => {
      const now = new Date("2024-03-15T12:00:00Z");
      const createdAt = new Date("2024-01-01");
      const result = timestampsWithNow(now, { createdAt });

      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(now);
    });

    it("preserves provided updatedAt using now as fallback", () => {
      const now = new Date("2024-03-15T12:00:00Z");
      const updatedAt = new Date("2024-06-15");
      const result = timestampsWithNow(now, { updatedAt });

      expect(result.updatedAt).toBe(updatedAt);
      expect(result.createdAt).toBe(now);
    });

    it("preserves both timestamps when both provided", () => {
      const now = new Date("2024-03-15T12:00:00Z");
      const createdAt = new Date("2024-01-01");
      const updatedAt = new Date("2024-06-15");
      const result = timestampsWithNow(now, { createdAt, updatedAt });

      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });
  });

  describe("withUpdatedAt", () => {
    it("preserves id and createdAt from entity", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        status: "active",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const before = new Date();
      const result = withUpdatedAt(entity, { name: "Updated" });
      const after = new Date();

      expect(result.id).toBe("test-id");
      expect(result.createdAt).toBe(entity.createdAt);
    });

    it("updates specified fields", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        status: "active",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const result = withUpdatedAt(entity, {
        name: "Updated",
        status: "inactive",
      });

      expect(result.name).toBe("Updated");
      expect(result.status).toBe("inactive");
    });

    it("sets new updatedAt to current time", async () => {
      const entity = {
        id: "test-id",
        name: "Test",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const before = new Date();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result = withUpdatedAt(entity, { name: "Updated" });
      const after = new Date();

      expect(result.updatedAt.getTime()).toBeGreaterThan(
        entity.updatedAt.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("preserves unchanged fields", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        description: "Original description",
        count: 42,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const result = withUpdatedAt(entity, { name: "Updated" });

      expect(result.description).toBe("Original description");
      expect(result.count).toBe(42);
    });

    it("handles empty updates object", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const before = new Date();
      const result = withUpdatedAt(entity, {});
      const after = new Date();

      expect(result.id).toBe("test-id");
      expect(result.name).toBe("Test");
      expect(result.createdAt).toBe(entity.createdAt);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("handles updates with null values", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        description: "Original",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const result = withUpdatedAt(entity, {
        description: null as unknown as string,
      });

      expect(result.description).toBeNull();
    });

    it("does not modify original entity", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const originalName = entity.name;
      withUpdatedAt(entity, { name: "Updated" });

      expect(entity.name).toBe(originalName);
    });
  });

  describe("updateEntity", () => {
    class TestEntity {
      constructor(
        readonly id: string,
        readonly name: string,
        readonly count: number,
        readonly createdAt: Date,
        readonly updatedAt: Date,
      ) {}
    }

    it("creates new entity instance", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const result = updateEntity(entity, { name: "Updated" }, TestEntity);

      expect(result).toBeInstanceOf(TestEntity);
      expect(result).not.toBe(entity);
    });

    it("preserves unchanged properties", () => {
      const createdAt = new Date("2024-01-01");
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        createdAt,
        new Date("2024-02-01"),
      );
      const result = updateEntity(entity, { name: "Updated" }, TestEntity);

      expect(result.id).toBe("id-1");
      expect(result.count).toBe(42);
      expect(result.createdAt).toBe(createdAt);
    });

    it("updates specified properties", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const result = updateEntity(
        entity,
        { name: "Updated", count: 100 },
        TestEntity,
      );

      expect(result.name).toBe("Updated");
      expect(result.count).toBe(100);
    });

    it("sets updatedAt to current time", async () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );

      const before = new Date();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result = updateEntity(entity, { name: "Updated" }, TestEntity);
      const after = new Date();

      expect(result.updatedAt.getTime()).toBeGreaterThan(
        entity.updatedAt.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("handles empty updates", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const result = updateEntity(entity, {}, TestEntity);

      expect(result.id).toBe("id-1");
      expect(result.name).toBe("Test");
      expect(result.count).toBe(42);
    });

    it("handles single property update", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const result = updateEntity(entity, { count: 99 }, TestEntity);

      expect(result.count).toBe(99);
      expect(result.name).toBe("Test");
    });

    it("handles updating all properties except timestamps", () => {
      const createdAt = new Date("2024-01-01");
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        createdAt,
        new Date("2024-02-01"),
      );
      const result = updateEntity(
        entity,
        { id: "id-2", name: "Updated", count: 100 },
        TestEntity,
      );

      expect(result.id).toBe("id-2");
      expect(result.name).toBe("Updated");
      expect(result.count).toBe(100);
      expect(result.createdAt).toBe(createdAt);
    });

    it("does not modify original entity", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        42,
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const originalName = entity.name;

      updateEntity(entity, { name: "Updated" }, TestEntity);

      expect(entity.name).toBe(originalName);
    });

    it("works with private constructors", () => {
      class EntityWithPrivateConstructor {
        private constructor(
          readonly id: string,
          readonly value: number,
          readonly createdAt: Date,
          readonly updatedAt: Date,
        ) {}

        static create(
          id: string,
          value: number,
          createdAt: Date,
          updatedAt: Date,
        ) {
          return new EntityWithPrivateConstructor(
            id,
            value,
            createdAt,
            updatedAt,
          );
        }
      }

      const entity = EntityWithPrivateConstructor.create(
        "id-1",
        42,
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const result = updateEntity(
        entity,
        { value: 100 },
        EntityWithPrivateConstructor,
      );

      expect(result).toBeInstanceOf(EntityWithPrivateConstructor);
      expect(result.value).toBe(100);
      expect(result.id).toBe("id-1");
    });
  });

  describe("updateEntityWithNow", () => {
    class TestEntity {
      constructor(
        readonly id: string,
        readonly name: string,
        readonly createdAt: Date,
        readonly updatedAt: Date,
      ) {}
    }

    it("uses provided now as updatedAt", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const now = new Date("2024-12-25T10:30:00Z");
      const result = updateEntityWithNow(
        entity,
        { name: "Updated" },
        TestEntity,
        now,
      );

      expect(result.updatedAt).toBe(now);
    });

    it("creates new entity instance", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const now = new Date();
      const result = updateEntityWithNow(
        entity,
        { name: "Updated" },
        TestEntity,
        now,
      );

      expect(result).toBeInstanceOf(TestEntity);
      expect(result).not.toBe(entity);
    });

    it("preserves unchanged properties", () => {
      const createdAt = new Date("2024-01-01");
      const entity = new TestEntity(
        "id-1",
        "Test",
        createdAt,
        new Date("2024-02-01"),
      );
      const now = new Date();
      const result = updateEntityWithNow(
        entity,
        { name: "Updated" },
        TestEntity,
        now,
      );

      expect(result.id).toBe("id-1");
      expect(result.createdAt).toBe(createdAt);
    });

    it("updates specified properties", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const now = new Date();
      const result = updateEntityWithNow(
        entity,
        { name: "Updated" },
        TestEntity,
        now,
      );

      expect(result.name).toBe("Updated");
    });

    it("handles empty updates", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const now = new Date();
      const result = updateEntityWithNow(entity, {}, TestEntity, now);

      expect(result.id).toBe("id-1");
      expect(result.name).toBe("Test");
      expect(result.updatedAt).toBe(now);
    });

    it("does not modify original entity", () => {
      const entity = new TestEntity(
        "id-1",
        "Test",
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );
      const originalName = entity.name;
      const now = new Date();

      updateEntityWithNow(entity, { name: "Updated" }, TestEntity, now);

      expect(entity.name).toBe(originalName);
    });
  });

  describe("edge cases", () => {
    it("handles entities with many properties", () => {
      class LargeEntity {
        constructor(
          readonly id: string,
          readonly prop1: string,
          readonly prop2: number,
          readonly prop3: boolean,
          readonly prop4: string | null,
          readonly prop5: Date,
          readonly prop6: string[],
          readonly createdAt: Date,
          readonly updatedAt: Date,
        ) {}
      }

      const entity = new LargeEntity(
        "id-1",
        "value1",
        42,
        true,
        null,
        new Date("2024-03-15"),
        ["a", "b", "c"],
        new Date("2024-01-01"),
        new Date("2024-02-01"),
      );

      const result = updateEntity(
        entity,
        { prop2: 100, prop3: false },
        LargeEntity,
      );

      expect(result.prop1).toBe("value1");
      expect(result.prop2).toBe(100);
      expect(result.prop3).toBe(false);
      expect(result.prop4).toBeNull();
      expect(result.prop6).toEqual(["a", "b", "c"]);
    });

    it("handles Date objects in updates", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        scheduledAt: new Date("2024-03-01"),
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const newDate = new Date("2024-06-15");
      const result = withUpdatedAt(entity, { scheduledAt: newDate });

      expect(result.scheduledAt).toBe(newDate);
    });

    it("handles nested object properties in withUpdatedAt", () => {
      interface NestedData {
        value: number;
        label: string;
      }

      const entity = {
        id: "test-id",
        data: { value: 42, label: "original" } as NestedData,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const newData: NestedData = { value: 100, label: "updated" };
      const result = withUpdatedAt(entity, { data: newData });

      expect(result.data).toBe(newData);
    });

    it("handles updates with undefined values in withUpdatedAt", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        optional: "value" as string | undefined,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const result = withUpdatedAt(entity, { optional: undefined });

      expect(result.optional).toBeUndefined();
    });

    it("preserves readonly nature of returned objects from withUpdatedAt", () => {
      const entity = {
        id: "test-id",
        name: "Test",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-01"),
      };

      const result = withUpdatedAt(entity, { name: "Updated" });

      expect(result.id).toBe("test-id");
      expect(result.name).toBe("Updated");
    });
  });
});
