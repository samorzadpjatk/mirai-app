import { describe, it, expect } from "bun:test";
import { Id, PurchaseId } from "./id";

describe("[UNIT] RewardId", () => {
  describe("[UNIT] Id.create", () => {
    it("should create RewardId from valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const rewardId = Id.create(validUUID);
      expect(Id.toString(rewardId)).toBe(validUUID);
    });

    it("should throw for invalid UUID", () => {
      expect(() => Id.create("not-a-uuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => Id.create("")).toThrow();
    });
  });

  describe("[UNIT] Id.generate", () => {
    it("should generate a valid RewardId", () => {
      const rewardId = Id.generate();
      expect(typeof rewardId).toBe("string");
      expect(rewardId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = Id.generate();
      const id2 = Id.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] Id.equals", () => {
    it("should return true for same ID", () => {
      const id = Id.generate();
      expect(Id.equals(id, id)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = Id.generate();
      const id2 = Id.generate();
      expect(Id.equals(id1, id2)).toBe(false);
    });
  });

  describe("[UNIT] Id.toString", () => {
    it("should convert to string", () => {
      const id = Id.generate();
      expect(Id.toString(id)).toBe(id);
    });
  });
});

describe("[UNIT] PurchaseId", () => {
  describe("[UNIT] PurchaseId.create", () => {
    it("should create PurchaseId from valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const purchaseId = PurchaseId.create(validUUID);
      expect(PurchaseId.toString(purchaseId)).toBe(validUUID);
    });

    it("should throw for invalid UUID", () => {
      expect(() => PurchaseId.create("not-a-uuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => PurchaseId.create("")).toThrow();
    });
  });

  describe("[UNIT] PurchaseId.generate", () => {
    it("should generate a valid PurchaseId", () => {
      const purchaseId = PurchaseId.generate();
      expect(typeof purchaseId).toBe("string");
      expect(purchaseId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = PurchaseId.generate();
      const id2 = PurchaseId.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] PurchaseId.equals", () => {
    it("should return true for same ID", () => {
      const id = PurchaseId.generate();
      expect(PurchaseId.equals(id, id)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = PurchaseId.generate();
      const id2 = PurchaseId.generate();
      expect(PurchaseId.equals(id1, id2)).toBe(false);
    });
  });

  describe("[UNIT] PurchaseId.toString", () => {
    it("should convert to string", () => {
      const id = PurchaseId.generate();
      expect(PurchaseId.toString(id)).toBe(id);
    });
  });
});
