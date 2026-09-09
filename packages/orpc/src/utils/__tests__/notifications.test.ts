import type { DB } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import { sendNotification } from "../notifications";

vi.mock("../resilience", () => ({
  executeWithRetry: vi.fn(
    async <T>(
      toExecute: () => Promise<T>,
      onError?: (error: unknown, retryAttempt: number) => void,
    ): Promise<T> => {
      try {
        return await toExecute();
      } catch (error: unknown) {
        onError?.(error, 0);
        throw error;
      }
    },
  ),
}));

vi.mock("@mirai-app/common/notifications", () => ({
  deduplicateIds: vi.fn((ids: string[]) => Array.from(new Set(ids))),
  extractFulfilledValues: vi.fn((results) =>
    results
      .filter((r: { status: string }) => r.status === "fulfilled")
      .map((r: { value: unknown }) => r.value),
  ),
}));

describe("sendNotification - pure unit branches", () => {
  it("throws ORPCError when insert returns no rows", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });
    // The notification row and its audience are written in one transaction, so
    // the double is a transaction handle rather than the connection itself.
    const transaction = vi.fn(async (callback: (tx: { insert: typeof insert }) => unknown) =>
      callback({ insert }),
    );
    const mockDb = { insert, transaction } as unknown as DB;

    await expect(
      sendNotification({
        db: mockDb,
        userId: "user-1",
        input: {
          title: "Title",
          body: "Body",
          url: "/test",
          userIds: ["user-2"],
          tripId: null,
        },
      }),
    ).rejects.toThrow(ORPCError);

    await expect(
      sendNotification({
        db: mockDb,
        userId: "user-1",
        input: {
          title: "Title",
          body: "Body",
          url: "/test",
          userIds: ["user-2"],
          tripId: null,
        },
      }),
    ).rejects.toThrow("Failed to create notification");

    expect(transaction).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
    expect(values).toHaveBeenCalled();
    expect(returning).toHaveBeenCalled();
  });
});
