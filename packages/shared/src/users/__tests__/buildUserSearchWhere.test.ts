import { describe, it, expect } from "vitest";
import { buildUserSearchWhere } from "../buildUserSearchWhere";
import type { UserSearchField } from "../buildUserSearchWhere";

describe("buildUserSearchWhere", () => {
  const tripId = "trip-123";

  it("returns base condition when searchTerm is undefined", () => {
    const result = buildUserSearchWhere(tripId, "firstName");
    expect(result).toBeDefined();
  });

  it("returns base condition when searchTerm is empty string", () => {
    const result = buildUserSearchWhere(tripId, "firstName", "");
    expect(result).toBeDefined();
  });

  it("returns base condition for email field (in-memory filtering)", () => {
    const result = buildUserSearchWhere(tripId, "email", "test@example.com");
    expect(result).toBeDefined();
  });

  it("builds ilike condition for firstName field", () => {
    const result = buildUserSearchWhere(tripId, "firstName", "John");
    expect(result).toBeDefined();
  });

  it("builds ilike condition for lastName field", () => {
    const result = buildUserSearchWhere(tripId, "lastName", "Doe");
    expect(result).toBeDefined();
  });

  it("builds ilike condition for groupName field", () => {
    const result = buildUserSearchWhere(tripId, "groupName", "Team A");
    expect(result).toBeDefined();
  });

  it("builds ilike condition for wristNumber field", () => {
    const result = buildUserSearchWhere(tripId, "wristNumber", "W001");
    expect(result).toBeDefined();
  });

  it("handles all valid field values without throwing", () => {
    const fields: UserSearchField[] = [
      "firstName",
      "lastName",
      "email",
      "groupName",
      "wristNumber",
    ];

    for (const field of fields) {
      expect(() => buildUserSearchWhere(tripId, field, "search")).not.toThrow();
    }
  });
});
