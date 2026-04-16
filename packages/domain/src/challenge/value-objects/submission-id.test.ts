import { describe, it, expect } from "bun:test";
import { SubmissionId } from "./submission-id";

describe("[UNIT] SubmissionId", () => {
  describe("[UNIT] SubmissionId.create", () => {
    it("should create SubmissionId from valid CUID", () => {
      const validCUID = "cm5r7z3t40000j6s6x0q1q2q3";
      const submissionId = SubmissionId.create(validCUID);
      expect(SubmissionId.toString(submissionId)).toBe(validCUID);
    });

    it("should throw for invalid CUID", () => {
      expect(() => SubmissionId.create("not-a-cuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => SubmissionId.create("")).toThrow();
    });
  });

  describe("[UNIT] SubmissionId.unsafeCreate", () => {
    it("should create SubmissionId without validation", () => {
      const id = SubmissionId.unsafeCreate("any-string");
      expect(SubmissionId.toString(id)).toBe("any-string");
    });
  });

  describe("[UNIT] SubmissionId.generate", () => {
    it("should generate a valid SubmissionId", () => {
      const submissionId = SubmissionId.generate();
      expect(typeof submissionId).toBe("string");
      expect(submissionId.length).toBeGreaterThan(0);
    });

    it("should generate unique IDs", () => {
      const id1 = SubmissionId.generate();
      const id2 = SubmissionId.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] SubmissionId.equals", () => {
    it("should return true for same ID", () => {
      const id = SubmissionId.create("cm5r7z3t40000j6s6x0q1q2q3");
      expect(SubmissionId.equals(id, id)).toBe(true);
    });

    it("should return true for equal IDs", () => {
      const id1 = SubmissionId.create("cm5r7z3t40000j6s6x0q1q2q3");
      const id2 = SubmissionId.create("cm5r7z3t40000j6s6x0q1q2q3");
      expect(SubmissionId.equals(id1, id2)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = SubmissionId.create("cm5r7z3t40000j6s6x0q1q2q3");
      const id2 = SubmissionId.create("cm5r7z3t40000j6s6x0q1q2q4");
      expect(SubmissionId.equals(id1, id2)).toBe(false);
    });
  });

  describe("[UNIT] SubmissionId.toString", () => {
    it("should convert to string", () => {
      const id = SubmissionId.create("cm5r7z3t40000j6s6x0q1q2q3");
      expect(SubmissionId.toString(id)).toBe("cm5r7z3t40000j6s6x0q1q2q3");
    });
  });
});
