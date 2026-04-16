import { describe, it, expect } from "bun:test";
import { VoteId } from "./vote-id";

describe("[UNIT] VoteId", () => {
  describe("[UNIT] VoteId.create", () => {
    it("should create VoteId from valid string", () => {
      const validId = "vote-123";
      const voteId = VoteId.create(validId);
      expect(VoteId.toString(voteId)).toBe(validId);
    });

    it("should throw for empty string", () => {
      expect(() => VoteId.create("")).toThrow();
    });

    it("should throw for whitespace-only string", () => {
      expect(() => VoteId.create("   ")).toThrow();
    });
  });

  describe("[UNIT] VoteId.unsafeCreate", () => {
    it("should create VoteId without validation", () => {
      const id = VoteId.unsafeCreate("any-string");
      expect(VoteId.toString(id)).toBe("any-string");
    });

    it("should create VoteId with empty string when unsafe", () => {
      const id = VoteId.unsafeCreate("");
      expect(VoteId.toString(id)).toBe("");
    });
  });

  describe("[UNIT] VoteId.generate", () => {
    it("should generate a valid VoteId", () => {
      const voteId = VoteId.generate();
      expect(typeof voteId).toBe("string");
      expect(voteId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = VoteId.generate();
      const id2 = VoteId.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] VoteId.equals", () => {
    it("should return true for same ID", () => {
      const id = VoteId.create("vote-123");
      expect(VoteId.equals(id, id)).toBe(true);
    });

    it("should return true for equal IDs", () => {
      const id1 = VoteId.create("vote-123");
      const id2 = VoteId.create("vote-123");
      expect(VoteId.equals(id1, id2)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = VoteId.create("vote-123");
      const id2 = VoteId.create("vote-456");
      expect(VoteId.equals(id1, id2)).toBe(false);
    });
  });

  describe("[UNIT] VoteId.toString", () => {
    it("should convert to string", () => {
      const id = VoteId.create("vote-123");
      expect(VoteId.toString(id)).toBe("vote-123");
    });
  });
});
