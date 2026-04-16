import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  InMemoryGateway,
  DatabaseError,
} from "../../../system/shared/gateways/in-memory-base";

interface TestEntity {
  id: string;
  name: string;
  value: number;
}

class TestGateway extends InMemoryGateway<TestEntity> {}

describe("[UNIT] InMemoryGateway", () => {
  let gateway: TestGateway;

  beforeEach(() => {
    gateway = new TestGateway();
  });

  describe("createGeneric", () => {
    it("stores item in storage", async () => {
      const item: TestEntity = { id: "1", name: "Test", value: 42 };

      await Effect.runPromise(gateway["createGeneric"](item));
      const found = await Effect.runPromise(gateway["findByIdGeneric"]("1"));

      expect(found).toEqual(item);
    });

    it("overwrites existing item with same id", async () => {
      const item1: TestEntity = { id: "1", name: "First", value: 1 };
      const item2: TestEntity = { id: "1", name: "Second", value: 2 };

      await Effect.runPromise(gateway["createGeneric"](item1));
      await Effect.runPromise(gateway["createGeneric"](item2));
      const found = await Effect.runPromise(gateway["findByIdGeneric"]("1"));

      expect(found).toEqual(item2);
    });
  });

  describe("findByIdGeneric", () => {
    it("returns item when found", async () => {
      const item: TestEntity = { id: "1", name: "Test", value: 42 };
      await Effect.runPromise(gateway["createGeneric"](item));

      const found = await Effect.runPromise(gateway["findByIdGeneric"]("1"));

      expect(found).toEqual(item);
    });

    it("returns null when not found", async () => {
      const found = await Effect.runPromise(
        gateway["findByIdGeneric"]("nonexistent"),
      );

      expect(found).toBeNull();
    });
  });

  describe("findAllGeneric", () => {
    it("returns all items", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
        { id: "3", name: "Third", value: 3 },
      ];
      for (const item of items) {
        await Effect.runPromise(gateway["createGeneric"](item));
      }

      const found = await Effect.runPromise(gateway["findAllGeneric"]());

      expect(found).toHaveLength(3);
    });

    it("respects limit option", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
        { id: "3", name: "Third", value: 3 },
      ];
      for (const item of items) {
        await Effect.runPromise(gateway["createGeneric"](item));
      }

      const found = await Effect.runPromise(
        gateway["findAllGeneric"]({ limit: 2 }),
      );

      expect(found).toHaveLength(2);
    });

    it("respects offset option", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
        { id: "3", name: "Third", value: 3 },
      ];
      for (const item of items) {
        await Effect.runPromise(gateway["createGeneric"](item));
      }

      const found = await Effect.runPromise(
        gateway["findAllGeneric"]({ offset: 1 }),
      );

      expect(found).toHaveLength(2);
    });

    it("respects both limit and offset", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
        { id: "3", name: "Third", value: 3 },
        { id: "4", name: "Fourth", value: 4 },
      ];
      for (const item of items) {
        await Effect.runPromise(gateway["createGeneric"](item));
      }

      const found = await Effect.runPromise(
        gateway["findAllGeneric"]({ offset: 1, limit: 2 }),
      );

      expect(found).toHaveLength(2);
    });
  });

  describe("updateGeneric", () => {
    it("updates existing item", async () => {
      const item: TestEntity = { id: "1", name: "Original", value: 42 };
      await Effect.runPromise(gateway["createGeneric"](item));

      const updated: TestEntity = { id: "1", name: "Updated", value: 100 };
      const result = await Effect.runPromise(gateway["updateGeneric"](updated));

      expect(result).toEqual(updated);
      const found = await Effect.runPromise(gateway["findByIdGeneric"]("1"));
      expect(found).toEqual(updated);
    });

    it("fails when item does not exist", async () => {
      const item: TestEntity = { id: "nonexistent", name: "Test", value: 42 };

      const result = await Effect.runPromise(
        Effect.either(gateway["updateGeneric"](item)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("deleteGeneric", () => {
    it("removes item from storage", async () => {
      const item: TestEntity = { id: "1", name: "Test", value: 42 };
      await Effect.runPromise(gateway["createGeneric"](item));

      await Effect.runPromise(gateway["deleteGeneric"]("1"));
      const found = await Effect.runPromise(gateway["findByIdGeneric"]("1"));

      expect(found).toBeNull();
    });

    it("succeeds when item does not exist", async () => {
      // Should not throw
      await Effect.runPromise(gateway["deleteGeneric"]("nonexistent"));
    });
  });

  describe("existsGeneric", () => {
    it("returns true when item exists", async () => {
      const item: TestEntity = { id: "1", name: "Test", value: 42 };
      await Effect.runPromise(gateway["createGeneric"](item));

      const exists = await Effect.runPromise(gateway["existsGeneric"]("1"));

      expect(exists).toBe(true);
    });

    it("returns false when item does not exist", async () => {
      const exists = await Effect.runPromise(
        gateway["existsGeneric"]("nonexistent"),
      );

      expect(exists).toBe(false);
    });
  });

  describe("countGeneric", () => {
    it("returns zero for empty storage", async () => {
      const count = await Effect.runPromise(gateway["countGeneric"]());

      expect(count).toBe(0);
    });

    it("returns correct count", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
        { id: "3", name: "Third", value: 3 },
      ];
      for (const item of items) {
        await Effect.runPromise(gateway["createGeneric"](item));
      }

      const count = await Effect.runPromise(gateway["countGeneric"]());

      expect(count).toBe(3);
    });
  });

  describe("seed", () => {
    it("adds multiple items", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
      ];

      await Effect.runPromise(gateway.seed(items));

      const found1 = await Effect.runPromise(gateway["findByIdGeneric"]("1"));
      const found2 = await Effect.runPromise(gateway["findByIdGeneric"]("2"));
      expect(found1 !== null).toBe(true);
      expect(found2 !== null).toBe(true);
      if (found1 && items[0]) expect(found1).toEqual(items[0]);
      if (found2 && items[1]) expect(found2).toEqual(items[1]);
    });

    it("overwrites existing items", async () => {
      const item1: TestEntity = { id: "1", name: "First", value: 1 };
      await Effect.runPromise(gateway["createGeneric"](item1));

      const item2: TestEntity = { id: "1", name: "Updated", value: 2 };
      await Effect.runPromise(gateway.seed([item2]));

      const found = await Effect.runPromise(gateway["findByIdGeneric"]("1"));
      expect(found).toEqual(item2);
    });
  });

  describe("reset", () => {
    it("clears all items", async () => {
      const items: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
      ];
      await Effect.runPromise(gateway.seed(items));

      await Effect.runPromise(gateway.reset());

      const count = await Effect.runPromise(gateway["countGeneric"]());
      expect(count).toBe(0);
    });

    it("allows adding items after reset", async () => {
      const item1: TestEntity = { id: "1", name: "First", value: 1 };
      await Effect.runPromise(gateway["createGeneric"](item1));
      await Effect.runPromise(gateway.reset());

      const item2: TestEntity = { id: "2", name: "Second", value: 2 };
      await Effect.runPromise(gateway["createGeneric"](item2));

      const found = await Effect.runPromise(gateway["findByIdGeneric"]("2"));
      expect(found).toEqual(item2);
    });
  });

  describe("getAllItems", () => {
    it("returns empty array for empty storage", () => {
      const items = gateway["getAllItems"]();

      expect(items).toEqual([]);
    });

    it("returns all stored items", async () => {
      const testItems: TestEntity[] = [
        { id: "1", name: "First", value: 1 },
        { id: "2", name: "Second", value: 2 },
      ];
      await Effect.runPromise(gateway.seed(testItems));

      const items = gateway["getAllItems"]();

      expect(items).toHaveLength(2);
      expect(items.map((i) => i.id).sort()).toEqual(["1", "2"]);
    });
  });
});
