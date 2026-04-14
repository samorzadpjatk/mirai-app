import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  InMemoryRepository,
  DatabaseError,
} from "../../gateways/in-memory/base";

// Concrete implementation for testing
interface TestEntity {
  id: string;
  name: string;
  value: number;
}

class TestRepository extends InMemoryRepository<TestEntity> {
  findById(id: string) {
    return this.findByIdGeneric(id);
  }

  findAll(options?: { limit?: number; offset?: number }) {
    return this.findAllGeneric(options);
  }

  create(item: TestEntity) {
    return this.createGeneric(item);
  }

  update(item: TestEntity) {
    return this.updateGeneric(item);
  }

  delete(id: string) {
    return this.deleteGeneric(id);
  }

  exists(id: string) {
    return this.existsGeneric(id);
  }

  count() {
    return this.countGeneric();
  }
}

describe("[UNIT] InMemoryRepository (Effect-based)", () => {
  let repo: TestRepository;

  beforeEach(() => {
    repo = new TestRepository();
  });

  describe("[UNIT] seed and reset", () => {
    it("should seed items using Effect", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "Item 1", value: 100 },
        { id: "2", name: "Item 2", value: 200 },
      ];

      const effect = repo.seed(items);
      await Effect.runPromise(effect);

      const countEffect = repo.count();
      const count = await Effect.runPromise(countEffect);
      expect(count).toBe(2);
    });

    it("should reset storage using Effect", async () => {
      const items: TestEntity[] = [{ id: "1", name: "Item 1", value: 100 }];

      await Effect.runPromise(repo.seed(items));
      await Effect.runPromise(repo.reset());

      const count = await Effect.runPromise(repo.count());
      expect(count).toBe(0);
    });
  });

  describe("[UNIT] createGeneric", () => {
    it("should create item and return Effect", async () => {
      const item: TestEntity = { id: "1", name: "Item 1", value: 100 };

      const effect = repo.create(item);
      const result = await Effect.runPromise(effect);

      expect(result).toEqual(item);

      const found = await Effect.runPromise(repo.findById("1"));
      expect(found).toEqual(item);
    });
  });

  describe("[UNIT] findByIdGeneric", () => {
    it("should return item as Effect when found", async () => {
      const item: TestEntity = { id: "1", name: "Item 1", value: 100 };
      await Effect.runPromise(repo.create(item));

      const effect = repo.findById("1");
      const result = await Effect.runPromise(effect);

      expect(result).toEqual(item);
    });

    it("should return null as Effect when not found", async () => {
      const effect = repo.findById("non-existent");
      const result = await Effect.runPromise(effect);

      expect(result).toBeNull();
    });
  });

  describe("[UNIT] findAllGeneric", () => {
    it("should return all items as Effect", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "Item 1", value: 100 },
        { id: "2", name: "Item 2", value: 200 },
        { id: "3", name: "Item 3", value: 300 },
      ];
      await Effect.runPromise(repo.seed(items));

      const effect = repo.findAll();
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(3);
    });

    it("should respect limit option", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "Item 1", value: 100 },
        { id: "2", name: "Item 2", value: 200 },
        { id: "3", name: "Item 3", value: 300 },
      ];
      await Effect.runPromise(repo.seed(items));

      const effect = repo.findAll({ limit: 2 });
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
    });

    it("should respect offset option", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "Item 1", value: 100 },
        { id: "2", name: "Item 2", value: 200 },
        { id: "3", name: "Item 3", value: 300 },
      ];
      await Effect.runPromise(repo.seed(items));

      const effect = repo.findAll({ offset: 1 });
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("2");
    });
  });

  describe("[UNIT] updateGeneric", () => {
    it("should update existing item and return Effect", async () => {
      const item: TestEntity = { id: "1", name: "Item 1", value: 100 };
      await Effect.runPromise(repo.create(item));

      const updatedItem: TestEntity = { id: "1", name: "Updated", value: 200 };
      const effect = repo.update(updatedItem);
      const result = await Effect.runPromise(effect);

      expect(result).toEqual(updatedItem);

      const found = await Effect.runPromise(repo.findById("1"));
      expect(found).toEqual(updatedItem);
    });

    it("should return DatabaseError Effect when item not found", async () => {
      const item: TestEntity = { id: "non-existent", name: "Item", value: 100 };

      const effect = repo.update(item);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
    });
  });

  describe("[UNIT] deleteGeneric", () => {
    it("should delete item using Effect", async () => {
      const item: TestEntity = { id: "1", name: "Item 1", value: 100 };
      await Effect.runPromise(repo.create(item));

      await Effect.runPromise(repo.delete("1"));

      const found = await Effect.runPromise(repo.findById("1"));
      expect(found).toBeNull();
    });
  });

  describe("[UNIT] existsGeneric", () => {
    it("should return true Effect when item exists", async () => {
      const item: TestEntity = { id: "1", name: "Item 1", value: 100 };
      await Effect.runPromise(repo.create(item));

      const effect = repo.exists("1");
      const result = await Effect.runPromise(effect);

      expect(result).toBe(true);
    });

    it("should return false Effect when item does not exist", async () => {
      const effect = repo.exists("non-existent");
      const result = await Effect.runPromise(effect);

      expect(result).toBe(false);
    });
  });

  describe("[UNIT] countGeneric", () => {
    it("should return count as Effect", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "Item 1", value: 100 },
        { id: "2", name: "Item 2", value: 200 },
      ];
      await Effect.runPromise(repo.seed(items));

      const effect = repo.count();
      const result = await Effect.runPromise(effect);

      expect(result).toBe(2);
    });
  });

  describe("[UNIT] DatabaseError", () => {
    it("should create DatabaseError with correct properties", () => {
      const error = new DatabaseError({
        operation: "testOperation",
        message: "Test message",
        cause: new Error("Original error"),
      });

      expect(error._tag).toBe("DatabaseError");
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.operation).toBe("testOperation");
      expect(error.message).toBe("Test message");
      expect(error.cause).toBeInstanceOf(Error);
    });
  });
});
