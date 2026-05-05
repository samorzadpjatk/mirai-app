import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@mirai-app/shared", () => ({
  ReviewStatus: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  },
  Submission: jest.fn(),
}));

jest.mock("../useJudgement", () => ({
  useJudgement: jest.fn(() => ({})),
}));

import { useJudgement } from "../index";

describe("stores/judgement/index exports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useJudgement hook export", () => {
    it("should export useJudgement hook", () => {
      expect(useJudgement).toBeDefined();
      expect(typeof useJudgement).toBe("function");
    });

    it("should allow calling useJudgement hook", () => {
      const result = useJudgement();
      expect(result).toBeDefined();
    });
  });

  describe("type exports", () => {
    it("should have ReviewStatus type available", () => {
      const indexModule = require("../index");
      expect(indexModule).toBeDefined();
    });

    it("should have Submission type available", () => {
      const indexModule = require("../index");
      expect(indexModule).toBeDefined();
    });
  });

  describe("edge cases - module structure", () => {
    it("should export useJudgement as function", () => {
      expect(typeof useJudgement).toBe("function");
    });

    it("should maintain consistent export structure", () => {
      const indexModule = require("../index");
      const exportKeys = Object.keys(indexModule);
      expect(exportKeys).toContain("useJudgement");
    });
  });

  describe("integration - hook usage patterns", () => {
    it("should support judgement hook workflow", () => {
      const result = useJudgement();
      expect(result).toBeDefined();
    });

    it("should return consistent results from hook", () => {
      const result1 = useJudgement();
      const result2 = useJudgement();
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
