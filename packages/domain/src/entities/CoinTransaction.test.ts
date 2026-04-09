import { describe, it, expect } from "bun:test";
import { CoinTransaction } from "./CoinTransaction";

describe("[UNIT] CoinTransaction Entity", () => {
  describe("CoinTransaction.create", () => {
    it("should create with valid positive amount", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: 100,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.groupId).toBe("group-123");
        expect(result.value.amount).toBe(100);
        expect(result.value.isCredit()).toBe(true);
        expect(result.value.isDebit()).toBe(false);
        expect(result.value.getAbsoluteAmount()).toBe(100);
      }
    });

    it("should create with valid negative amount", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: -50,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.amount).toBe(-50);
        expect(result.value.isCredit()).toBe(false);
        expect(result.value.isDebit()).toBe(true);
        expect(result.value.getAbsoluteAmount()).toBe(50);
      }
    });

    it("should create with reason", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: 100,
        reason: "Challenge completion bonus",
        adminId: "admin-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reason).toBe("Challenge completion bonus");
        expect(result.value.hasReason()).toBe(true);
      }
    });

    it("should reject zero amount", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: 0,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty groupId", () => {
      const result = CoinTransaction.create({
        groupId: "",
        amount: 100,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty adminId", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: 100,
        adminId: "",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("CoinTransaction.getFormattedAmount", () => {
    it("should format positive amount", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: 100,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getFormattedAmount()).toBe("+100 coins");
      }
    });

    it("should format negative amount", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: -50,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getFormattedAmount()).toBe("-50 coins");
      }
    });
  });

  describe("CoinTransaction.isForGroup / isProcessedBy", () => {
    it("should check if for specific group", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: 100,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForGroup("group-123")).toBe(true);
        expect(result.value.isForGroup("other-group")).toBe(false);
      }
    });

    it("should check if processed by specific admin", () => {
      const result = CoinTransaction.create({
        groupId: "group-123",
        amount: 100,
        adminId: "admin-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isProcessedBy("admin-456")).toBe(true);
        expect(result.value.isProcessedBy("other-admin")).toBe(false);
      }
    });
  });
});
