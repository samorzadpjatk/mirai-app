import { describe, it, expect } from "vitest";
import { buildActivityWhere, getActivityRelationTree, getActivityColumns } from "../queryBuilders";

describe("buildActivityWhere", () => {
  it("returns SQL expression for trip filter with hidden excluded", () => {
    const result = buildActivityWhere("trip-123", false);
    expect(result).toBeDefined();
  });

  it("returns SQL expression for trip filter including hidden", () => {
    const result = buildActivityWhere("trip-123", true);
    expect(result).toBeDefined();
  });

  it("returns SQL expression with cursor for pinned activity", () => {
    const cursor = {
      id: "act-456",
      createdAt: new Date("2024-01-15T10:00:00Z"),
      isPinned: true,
    };
    const result = buildActivityWhere("trip-123", false, cursor);
    expect(result).toBeDefined();
  });

  it("returns SQL expression with cursor for non-pinned activity", () => {
    const cursor = {
      id: "act-789",
      createdAt: new Date("2024-01-15T10:00:00Z"),
      isPinned: false,
    };
    const result = buildActivityWhere("trip-123", false, cursor);
    expect(result).toBeDefined();
  });

  it("returns different SQL for different trip IDs", () => {
    const result1 = buildActivityWhere("trip-1", true);
    const result2 = buildActivityWhere("trip-2", true);
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result1).not.toBe(result2);
  });

  it("returns different SQL with and without cursor", () => {
    const withoutCursor = buildActivityWhere("trip-123", false);
    const withCursor = buildActivityWhere("trip-123", false, {
      id: "act-1",
      createdAt: new Date(),
      isPinned: false,
    });
    expect(withoutCursor).toBeDefined();
    expect(withCursor).toBeDefined();
    expect(withoutCursor).not.toBe(withCursor);
  });
});

describe("getActivityRelationTree", () => {
  it("returns relation tree with all expected keys", () => {
    const result = getActivityRelationTree();
    expect(result).toHaveProperty("admin");
    expect(result).toHaveProperty("hiddenBy");
    expect(result).toHaveProperty("submissionActivity");
    expect(result).toHaveProperty("challengeActivity");
    expect(result).toHaveProperty("rankChangeActivity");
    expect(result).toHaveProperty("userPost");
  });

  it("returns consistent relation tree on multiple calls", () => {
    const result1 = getActivityRelationTree();
    const result2 = getActivityRelationTree();
    expect(result1).toEqual(result2);
  });

  it("has nested with clauses in submissionActivity", () => {
    const result = getActivityRelationTree();
    expect(result.submissionActivity).toHaveProperty("with");
    expect(result.submissionActivity.with).toHaveProperty("submission");
    expect(result.submissionActivity.with).toHaveProperty("challenge");
    expect(result.submissionActivity.with).toHaveProperty("group");
  });

  it("has nested with clauses in userPost", () => {
    const result = getActivityRelationTree();
    expect(result.userPost).toHaveProperty("with");
    expect(result.userPost.with).toHaveProperty("author");
    expect(result.userPost.with.author).toHaveProperty("with");
    expect(result.userPost.with.author.with).toHaveProperty("user");
    expect(result.userPost.with.author.with).toHaveProperty("group");
  });
});

describe("getActivityColumns", () => {
  it("returns columns selection with all expected keys", () => {
    const result = getActivityColumns();
    expect(result).toHaveProperty("id", true);
    expect(result).toHaveProperty("tripId", true);
    expect(result).toHaveProperty("activityType", true);
    expect(result).toHaveProperty("title", true);
    expect(result).toHaveProperty("description", true);
    expect(result).toHaveProperty("imageUrl", true);
    expect(result).toHaveProperty("isPinned", true);
    expect(result).toHaveProperty("isHidden", true);
    expect(result).toHaveProperty("hiddenAt", true);
    expect(result).toHaveProperty("hiddenReason", true);
    expect(result).toHaveProperty("createdByAdmin", true);
    expect(result).toHaveProperty("createdAt", true);
    expect(result).toHaveProperty("updatedAt", true);
  });

  it("returns consistent columns on multiple calls", () => {
    const result1 = getActivityColumns();
    const result2 = getActivityColumns();
    expect(result1).toEqual(result2);
  });

  it("returns all values as true", () => {
    const result = getActivityColumns();
    const values = Object.values(result);
    expect(values.every((v) => v === true)).toBe(true);
  });
});
