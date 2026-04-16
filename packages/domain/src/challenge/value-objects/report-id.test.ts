import { describe, it, expect } from "bun:test";
import { ReportId } from "./report-id";

describe("[UNIT] ReportId", () => {
  describe("[UNIT] ReportId.create", () => {
    it("should create ReportId from valid string", () => {
      const validId = "report-123";
      const reportId = ReportId.create(validId);
      expect(ReportId.toString(reportId)).toBe(validId);
    });

    it("should throw for empty string", () => {
      expect(() => ReportId.create("")).toThrow();
    });

    it("should throw for whitespace-only string", () => {
      expect(() => ReportId.create("   ")).toThrow();
    });
  });

  describe("[UNIT] ReportId.unsafeCreate", () => {
    it("should create ReportId without validation", () => {
      const id = ReportId.unsafeCreate("any-string");
      expect(ReportId.toString(id)).toBe("any-string");
    });

    it("should create ReportId with empty string when unsafe", () => {
      const id = ReportId.unsafeCreate("");
      expect(ReportId.toString(id)).toBe("");
    });
  });

  describe("[UNIT] ReportId.generate", () => {
    it("should generate a valid ReportId", () => {
      const reportId = ReportId.generate();
      expect(typeof reportId).toBe("string");
      expect(reportId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = ReportId.generate();
      const id2 = ReportId.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] ReportId.equals", () => {
    it("should return true for same ID", () => {
      const id = ReportId.create("report-123");
      expect(ReportId.equals(id, id)).toBe(true);
    });

    it("should return true for equal IDs", () => {
      const id1 = ReportId.create("report-123");
      const id2 = ReportId.create("report-123");
      expect(ReportId.equals(id1, id2)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = ReportId.create("report-123");
      const id2 = ReportId.create("report-456");
      expect(ReportId.equals(id1, id2)).toBe(false);
    });
  });

  describe("[UNIT] ReportId.toString", () => {
    it("should convert to string", () => {
      const id = ReportId.create("report-123");
      expect(ReportId.toString(id)).toBe("report-123");
    });
  });
});
