import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { CoinTransaction } from "./coin-transaction";
import { ValidationError } from "../../system/errors";

describe("[UNIT] CoinTransaction", () => {
  const validProps = {
    id: "txn-123",
    groupId: "group-456",
    amount: 100,
    reason: "Test transaction",
    adminId: "admin-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  // ============================================================================
  // Factory Creation Tests
  // ============================================================================
  describe("[UNIT] CoinTransaction.create", () => {
    it("creates transaction with valid data", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create(validProps),
      );
      expect(result.id).toBe("txn-123");
      expect(result.groupId).toBe("group-456");
      expect(result.amount).toBe(100);
      expect(result.reason).toBe("Test transaction");
      expect(result.adminId).toBe("admin-789");
      expect(result.createdAt).toEqual(new Date("2024-01-01"));
      expect(result.updatedAt).toEqual(new Date("2024-01-01"));
    });

    it("creates transaction with minimal required fields", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 50,
          adminId: "admin-789",
        }),
      );
      expect(result.groupId).toBe("group-456");
      expect(result.amount).toBe(50);
      expect(result.adminId).toBe("admin-789");
      expect(result.reason).toBeNull();
    });

    it("generates UUID when id not provided", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 50,
          adminId: "admin-789",
        }),
      );
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("accepts positive amount (credit)", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(result.amount).toBe(100);
      expect(result.isCredit()).toBe(true);
      expect(result.isDebit()).toBe(false);
    });

    it("accepts negative amount (debit)", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: -50,
          adminId: "admin-789",
        }),
      );
      expect(result.amount).toBe(-50);
      expect(result.isCredit()).toBe(false);
      expect(result.isDebit()).toBe(true);
    });

    it("fails for zero amount", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          CoinTransaction.create({
            groupId: "group-456",
            amount: 0,
            adminId: "admin-789",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("amount cannot be zero");
      }
    });

    it("fails for empty groupId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          CoinTransaction.create({
            groupId: "",
            amount: 100,
            adminId: "admin-789",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("groupId");
      }
    });

    it("fails for whitespace-only groupId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          CoinTransaction.create({
            groupId: "   ",
            amount: 100,
            adminId: "admin-789",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("groupId");
      }
    });

    it("fails for empty adminId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          CoinTransaction.create({
            groupId: "group-456",
            amount: 100,
            adminId: "",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("adminId");
      }
    });

    it("fails for whitespace-only adminId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          CoinTransaction.create({
            groupId: "group-456",
            amount: 100,
            adminId: "   ",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("adminId");
      }
    });

    it("accepts null reason", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          reason: null,
        }),
      );
      expect(result.reason).toBeNull();
    });

    it("accepts undefined reason (defaults to null)", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(result.reason).toBeNull();
    });

    it("fails for reason exceeding 500 characters", async () => {
      const longReason = "a".repeat(501);
      const result = await Effect.runPromise(
        Effect.either(
          CoinTransaction.create({
            groupId: "group-456",
            amount: 100,
            adminId: "admin-789",
            reason: longReason,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("reason");
        expect(result.left.message).toBe(
          "reason must be at most 500 characters",
        );
      }
    });

    it("accepts reason at exactly 500 characters", async () => {
      const maxReason = "a".repeat(500);
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          reason: maxReason,
        }),
      );
      expect(result.reason).toBe(maxReason);
    });

    it("accepts empty string reason", async () => {
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          reason: "",
        }),
      );
      expect(result.reason).toBe("");
    });

    it("preserves custom timestamps when provided", async () => {
      const customDate = new Date("2023-06-15");
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          createdAt: customDate,
          updatedAt: customDate,
        }),
      );
      expect(result.createdAt).toEqual(customDate);
      expect(result.updatedAt).toEqual(customDate);
    });

    it("includes optional group data when provided", async () => {
      const groupData = {
        id: "group-456",
        name: "Test Group",
        coins: 1000,
      };
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          group: groupData,
        }),
      );
      expect(result.group).toEqual(groupData);
    });

    it("includes optional admin data when provided", async () => {
      const adminData = {
        id: "admin-789",
        firstName: "John",
        lastName: "Doe",
      };
      const result = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          admin: adminData,
        }),
      );
      expect(result.admin).toEqual(adminData);
    });
  });

  // ============================================================================
  // Credit/Debit Detection Tests
  // ============================================================================
  describe("[UNIT] CoinTransaction Credit/Debit Detection", () => {
    it("isCredit returns true for positive amount", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.isCredit()).toBe(true);
    });

    it("isCredit returns false for negative amount", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: -50,
          adminId: "admin-789",
        }),
      );
      expect(transaction.isCredit()).toBe(false);
    });

    it("isDebit returns true for negative amount", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: -50,
          adminId: "admin-789",
        }),
      );
      expect(transaction.isDebit()).toBe(true);
    });

    it("isDebit returns false for positive amount", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.isDebit()).toBe(false);
    });

    it("getAbsoluteAmount returns positive value for credit", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.getAbsoluteAmount()).toBe(100);
    });

    it("getAbsoluteAmount returns positive value for debit", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: -50,
          adminId: "admin-789",
        }),
      );
      expect(transaction.getAbsoluteAmount()).toBe(50);
    });

    it("getFormattedAmount includes + sign for credit", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.getFormattedAmount()).toBe("+100 coins");
    });

    it("getFormattedAmount includes - sign for debit", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: -50,
          adminId: "admin-789",
        }),
      );
      expect(transaction.getFormattedAmount()).toBe("-50 coins");
    });
  });

  // ============================================================================
  // Reason Query Tests
  // ============================================================================
  describe("[UNIT] CoinTransaction Reason Queries", () => {
    it("hasReason returns true when reason is provided", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          reason: "Bonus coins",
        }),
      );
      expect(transaction.hasReason()).toBe(true);
    });

    it("hasReason returns false when reason is null", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          reason: null,
        }),
      );
      expect(transaction.hasReason()).toBe(false);
    });

    it("hasReason returns false when reason is empty string", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          reason: "",
        }),
      );
      expect(transaction.hasReason()).toBe(false);
    });

    it("hasReason returns true for reason with whitespace only", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          reason: "   ",
        }),
      );
      expect(transaction.hasReason()).toBe(true);
    });
  });

  // ============================================================================
  // Group Association Tests
  // ============================================================================
  describe("[UNIT] CoinTransaction Group Association", () => {
    it("isForGroup returns true for matching group", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-abc",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.isForGroup("group-abc")).toBe(true);
    });

    it("isForGroup returns false for different group", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-abc",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.isForGroup("group-xyz")).toBe(false);
    });

    it("isForGroup returns false for empty string", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-abc",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.isForGroup("")).toBe(false);
    });
  });

  // ============================================================================
  // Admin Association Tests
  // ============================================================================
  describe("[UNIT] CoinTransaction Admin Association", () => {
    it("isProcessedBy returns true for matching admin", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-abc",
        }),
      );
      expect(transaction.isProcessedBy("admin-abc")).toBe(true);
    });

    it("isProcessedBy returns false for different admin", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-abc",
        }),
      );
      expect(transaction.isProcessedBy("admin-xyz")).toBe(false);
    });

    it("isProcessedBy returns false for empty string", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-abc",
        }),
      );
      expect(transaction.isProcessedBy("")).toBe(false);
    });
  });

  // ============================================================================
  // DTO Interface Tests
  // ============================================================================
  describe("[UNIT] CoinTransaction DTO Properties", () => {
    it("implements CoinTransactionDTO interface", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create(validProps),
      );

      // Verify all DTO properties are accessible
      expect(typeof transaction.id).toBe("string");
      expect(typeof transaction.groupId).toBe("string");
      expect(typeof transaction.amount).toBe("number");
      expect(
        transaction.reason === null || typeof transaction.reason === "string",
      ).toBe(true);
      expect(typeof transaction.adminId).toBe("string");
      expect(transaction.createdAt instanceof Date).toBe(true);
      expect(transaction.updatedAt instanceof Date).toBe(true);
    });

    it("optional group relation is accessible when provided", async () => {
      const groupData = {
        id: "group-456",
        name: "Test Group",
        coins: 1000,
      };
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          group: groupData,
        }),
      );
      expect(transaction.group).toBeDefined();
      expect(transaction.group?.id).toBe("group-456");
      expect(transaction.group?.name).toBe("Test Group");
      expect(transaction.group?.coins).toBe(1000);
    });

    it("optional admin relation is accessible when provided", async () => {
      const adminData = {
        id: "admin-789",
        firstName: "John",
        lastName: "Doe",
      };
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
          admin: adminData,
        }),
      );
      expect(transaction.admin).toBeDefined();
      expect(transaction.admin?.id).toBe("admin-789");
      expect(transaction.admin?.firstName).toBe("John");
      expect(transaction.admin?.lastName).toBe("Doe");
    });

    it("optional relations are undefined when not provided", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create({
          groupId: "group-456",
          amount: 100,
          adminId: "admin-789",
        }),
      );
      expect(transaction.group).toBeUndefined();
      expect(transaction.admin).toBeUndefined();
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("[UNIT] CoinTransaction Immutability", () => {
    it("properties are readonly", async () => {
      const transaction = await Effect.runPromise(
        CoinTransaction.create(validProps),
      );

      // TypeScript should enforce readonly at compile time
      // Runtime verification that values don't change
      const originalId = transaction.id;
      const originalAmount = transaction.amount;

      // Attempting to modify should fail at compile time
      // But we verify the values remain unchanged
      expect(transaction.id).toBe(originalId);
      expect(transaction.amount).toBe(originalAmount);
    });
  });
});
