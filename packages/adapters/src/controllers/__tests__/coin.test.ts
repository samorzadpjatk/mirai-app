import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CoinController } from "../coin-controller";
import type { AddCoinsUseCase, RemoveCoinsUseCase } from "@mirai-app/use-cases";
import { ok, err } from "@mirai-app/domain";

describe("[UNIT] CoinController", () => {
  let mockAddCoinsUseCase: AddCoinsUseCase;
  let mockRemoveCoinsUseCase: RemoveCoinsUseCase;
  let controller: CoinController;

  beforeEach(() => {
    mockAddCoinsUseCase = {
      execute: mock(() =>
        Promise.resolve(
          ok({
            transaction: {
              id: "tx-1",
              groupId: "group-1",
              amount: 100,
              reason: "Test",
              adminId: "admin-1",
              createdAt: new Date(),
            },
          }),
        ),
      ),
    } as unknown as AddCoinsUseCase;

    mockRemoveCoinsUseCase = {
      execute: mock(() =>
        Promise.resolve(
          ok({
            transaction: {
              id: "tx-2",
              groupId: "group-1",
              amount: -50,
              reason: "Removal",
              adminId: "admin-1",
              createdAt: new Date(),
            },
          }),
        ),
      ),
    } as unknown as RemoveCoinsUseCase;

    controller = new CoinController(
      mockAddCoinsUseCase,
      mockRemoveCoinsUseCase,
    );
  });

  describe("addCoins", () => {
    it("should add coins successfully", async () => {
      const input = {
        tripId: "trip-1",
        groupId: "group-1",
        amount: 100,
        reason: "Test",
        adminId: "admin-1",
      };

      const result = await controller.addCoins(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(100);
      }
    });

    it("should return error when use case fails", async () => {
      mockAddCoinsUseCase.execute = mock(() =>
        Promise.resolve(err("Group not found")),
      );

      const input = {
        tripId: "trip-1",
        groupId: "invalid",
        amount: 100,
        adminId: "admin-1",
      };

      const result = await controller.addCoins(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group not found");
      }
    });
  });

  describe("removeCoins", () => {
    it("should remove coins successfully", async () => {
      const input = {
        tripId: "trip-1",
        groupId: "group-1",
        amount: 50,
        reason: "Test removal",
        adminId: "admin-1",
      };

      const result = await controller.removeCoins(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-50);
      }
    });

    it("should return error when use case fails", async () => {
      mockRemoveCoinsUseCase.execute = mock(() =>
        Promise.resolve(err("Group does not have enough coins")),
      );

      const input = {
        tripId: "trip-1",
        groupId: "group-1",
        amount: 1000,
        adminId: "admin-1",
      };

      const result = await controller.removeCoins(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not have enough coins");
      }
    });
  });

  describe("schemas", () => {
    it("should expose validation schemas", () => {
      expect(controller.schemas.addCoins).toBeDefined();
      expect(controller.schemas.removeCoins).toBeDefined();
    });
  });
});
