import { describe, expect, it } from "vitest";
import {
  aggregateTicketResults,
  calculateDeliveryStats,
  collectUnregisteredTokens,
} from "../deliveryUtils";

describe("aggregateTicketResults", () => {
  it("aggregates all success results for a user", () => {
    const tickets = [{ status: "ok" }, { status: "ok" }];
    const messages = [{ to: "token1" }, { to: "token1" }];
    const userByToken = new Map([["token1", "user1"]]);

    const result = aggregateTicketResults(tickets, messages, userByToken);

    expect(result.get("user1")).toEqual({ hasSuccess: true, hasFailure: false });
  });

  it("aggregates mixed results for a user", () => {
    const tickets = [{ status: "ok" }, { status: "error", details: { error: "fail" } }];
    const messages = [{ to: "token1" }, { to: "token1" }];
    const userByToken = new Map([["token1", "user1"]]);

    const result = aggregateTicketResults(tickets, messages, userByToken);

    expect(result.get("user1")).toEqual({ hasSuccess: true, hasFailure: true });
  });

  it("returns empty map when token is missing", () => {
    const tickets = [{ status: "ok" }];
    const messages = [{} as { to: string }];
    const userByToken = new Map<string, string>();

    const result = aggregateTicketResults(tickets, messages, userByToken);

    expect(result.size).toBe(0);
  });

  it("returns empty map when userId is missing for token", () => {
    const tickets = [{ status: "ok" }];
    const messages = [{ to: "token1" }];
    const userByToken = new Map<string, string>();

    const result = aggregateTicketResults(tickets, messages, userByToken);

    expect(result.size).toBe(0);
  });

  it("handles multiple users independently", () => {
    const tickets = [
      { status: "ok" },
      { status: "error", details: { error: "fail" } },
      { status: "ok" },
    ];
    const messages = [{ to: "token1" }, { to: "token2" }, { to: "token3" }];
    const userByToken = new Map([
      ["token1", "user1"],
      ["token2", "user2"],
      ["token3", "user3"],
    ]);

    const result = aggregateTicketResults(tickets, messages, userByToken);

    expect(result.get("user1")).toEqual({ hasSuccess: true, hasFailure: false });
    expect(result.get("user2")).toEqual({ hasSuccess: false, hasFailure: true });
    expect(result.get("user3")).toEqual({ hasSuccess: true, hasFailure: false });
  });
});

describe("calculateDeliveryStats", () => {
  it("calculates explicit audience mode with all success", () => {
    const resultByUser = new Map([
      ["user1", { hasSuccess: true, hasFailure: false }],
      ["user2", { hasSuccess: true, hasFailure: false }],
    ]);
    const explicitAudienceUserIds = new Set(["user1", "user2"]);

    const result = calculateDeliveryStats(resultByUser, explicitAudienceUserIds, [], []);

    expect(result).toEqual({ sent: 2, failed: 0, total: 2, success: true });
  });

  it("calculates explicit audience mode with mixed results", () => {
    const resultByUser = new Map([
      ["user1", { hasSuccess: true, hasFailure: false }],
      ["user2", { hasSuccess: false, hasFailure: true }],
    ]);
    const explicitAudienceUserIds = new Set(["user1", "user2"]);

    const result = calculateDeliveryStats(resultByUser, explicitAudienceUserIds, [], []);

    expect(result).toEqual({ sent: 1, failed: 1, total: 2, success: false });
  });

  it("calculates explicit audience mode with missing user results", () => {
    const resultByUser = new Map<string, { hasSuccess: boolean; hasFailure: boolean }>();
    const explicitAudienceUserIds = new Set(["user1", "user2"]);

    const result = calculateDeliveryStats(resultByUser, explicitAudienceUserIds, [], []);

    expect(result).toEqual({ sent: 0, failed: 2, total: 2, success: false });
  });

  it("calculates implicit mode with sent and failed arrays", () => {
    const resultByUser = new Map<string, { hasSuccess: boolean; hasFailure: boolean }>();
    const explicitAudienceUserIds = new Set<string>();

    const result = calculateDeliveryStats(
      resultByUser,
      explicitAudienceUserIds,
      ["user1", "user2"],
      ["user3"],
    );

    expect(result).toEqual({ sent: 2, failed: 1, total: 3, success: false });
  });

  it("calculates implicit mode with all success", () => {
    const resultByUser = new Map<string, { hasSuccess: boolean; hasFailure: boolean }>();
    const explicitAudienceUserIds = new Set<string>();

    const result = calculateDeliveryStats(
      resultByUser,
      explicitAudienceUserIds,
      ["user1", "user2"],
      [],
    );

    expect(result).toEqual({ sent: 2, failed: 0, total: 2, success: true });
  });

  it("calculates implicit mode with empty arrays", () => {
    const resultByUser = new Map<string, { hasSuccess: boolean; hasFailure: boolean }>();
    const explicitAudienceUserIds = new Set<string>();

    const result = calculateDeliveryStats(resultByUser, explicitAudienceUserIds, [], []);

    expect(result).toEqual({ sent: 0, failed: 0, total: 0, success: true });
  });
});

describe("collectUnregisteredTokens", () => {
  it("should return no tokens when every delivery succeeded", () => {
    const tickets = [{ status: "ok" }, { status: "ok" }];
    const messages = [{ to: "token-1" }, { to: "token-2" }];

    expect(collectUnregisteredTokens(tickets, messages)).toEqual([]);
  });

  it("should return only tokens rejected as DeviceNotRegistered", () => {
    const tickets = [
      { status: "ok" },
      { status: "error", details: { error: "DeviceNotRegistered" } },
      { status: "error", details: { error: "MessageTooBig" } },
      { status: "error" },
    ];
    const messages = [{ to: "live" }, { to: "dead" }, { to: "too-big" }, { to: "unknown-error" }];

    expect(collectUnregisteredTokens(tickets, messages)).toEqual(["dead"]);
  });

  it("should deduplicate a token rejected in several chunks", () => {
    const tickets = [
      { status: "error", details: { error: "DeviceNotRegistered" } },
      { status: "error", details: { error: "DeviceNotRegistered" } },
    ];
    const messages = [{ to: "dead" }, { to: "dead" }];

    expect(collectUnregisteredTokens(tickets, messages)).toEqual(["dead"]);
  });

  it("should ignore tickets without a matching message", () => {
    const tickets = [
      { status: "error", details: { error: "DeviceNotRegistered" } },
      { status: "error", details: { error: "DeviceNotRegistered" } },
    ];
    const messages = [{ to: "dead" }];

    expect(collectUnregisteredTokens(tickets, messages)).toEqual(["dead"]);
  });
});
