import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { CoinTransaction } from "./CoinTransaction";
import { ValidationError } from "../errors";

describe("[UNIT] CoinTransaction Entity", () => {
  describe("[UNIT] CoinTransaction.create", () => {
    it("should create with valid positive amount", () => {
      const transaction = Effect.runSync(
        CoinTransaction.create({
          groupId: "group-123",
          amount: 100,
          adminId: "admin-456",
        }),
      );

      expect(transaction.id).toBeDefined();
      expect(transaction.groupId).toBe("group-123");
      expect(transaction.amount).toBe(100);
      expect(transaction.isCredit()).toBe(true);
      expect(transaction.isDebit()).toBe(false);
      expect(transaction.getAbsoluteAmount()).toBe(100);
    });

    it("should create with valid negative amount", () => {
      const transaction = Effect.runSync(
        CoinTransaction.create({
          groupId: "group-123",
          amount: -50,
          adminId: "admin-456",
        }),
      );

      expect(transaction.amount).toBe(-50);
      expect(transaction.isCredit()).toBe(false);
      expect(transaction.isDebit()).toBe(true);
      expect(transaction.getAbsoluteAmount()).toBe(50);
    });

    it("should create with reason", () => {
      const transaction = Effect.runSync(
        CoinTransaction.create({
          groupId: "group-123",
          amount: 100,
          reason: "Challenge completion bonus",
          adminId: "admin-456",
        }),
      );

      expect(transaction.reason).toBe("Challenge completion bonus");
      expect(transaction.hasReason()).toBe(true);
    });

    it("should reject zero amount", () => {
      const effect = CoinTransaction.create({
        groupId: "group-123",
        amount: 0,
        adminId: "admin-456",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("amount");
      }
    });

    it("should reject empty groupId", () => {
      const effect = CoinTransaction.create({
        groupId: "",
        amount: 100,
        adminId: "admin-456",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("groupId");
      }
    });

    it("should reject empty adminId", () => {
      const effect = CoinTransaction.create({
        groupId: "group-123",
        amount: 100,
        adminId: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("adminId");
      }
    });
  });

  describe("[UNIT] CoinTransaction.getFormattedAmount", () => {
    it("should format positive amount", () => {
      const transaction = Effect.runSync(
        CoinTransaction.create({
          groupId: "group-123",
          amount: 100,
          adminId: "admin-456",
        }),
      );

      expect(transaction.getFormattedAmount()).toBe("+100 coins");
    });

    it("should format negative amount", () => {
      const transaction = Effect.runSync(
        CoinTransaction.create({
          groupId: "group-123",
          amount: -50,
          adminId: "admin-456",
        }),
      );

      expect(transaction.getFormattedAmount()).toBe("-50 coins");
    });
  });

  describe("[UNIT] CoinTransaction.isForGroup / isProcessedBy", () => {
    it("should check if for specific group", () => {
      const transaction = Effect.runSync(
        CoinTransaction.create({
          groupId: "group-123",
          amount: 100,
          adminId: "admin-456",
        }),
      );

      expect(transaction.isForGroup("group-123")).toBe(true);
      expect(transaction.isForGroup("other-group")).toBe(false);
    });

    it("should check if processed by specific admin", () => {
      const transaction = Effect.runSync(
        CoinTransaction.create({
          groupId: "group-123",
          amount: 100,
          adminId: "admin-456",
        }),
      );

      expect(transaction.isProcessedBy("admin-456")).toBe(true);
      expect(transaction.isProcessedBy("other-admin")).toBe(false);
    });
  });
});
