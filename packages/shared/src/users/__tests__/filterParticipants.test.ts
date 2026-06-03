import { describe, expect, it } from "vitest";
import { filterParticipantsByEmail, sortParticipants } from "../filterParticipants";

describe("filterParticipantsByEmail", () => {
  const participants = [
    { user: { id: "user-1" } },
    { user: { id: "user-2" } },
    { user: { id: "user-3" } },
  ];

  const authSummaryById = new Map([
    ["user-1", { email: "alice@example.com" }],
    ["user-2", { email: "bob@test.org" }],
    ["user-3", { email: null }],
  ]);

  it("returns all participants when emailQuery is undefined", () => {
    const result = filterParticipantsByEmail(participants, undefined, authSummaryById);
    expect(result).toHaveLength(3);
    expect(result).toEqual(participants);
  });

  it("returns all participants when emailQuery is empty string", () => {
    const result = filterParticipantsByEmail(participants, "", authSummaryById);
    expect(result).toHaveLength(3);
    expect(result).toEqual(participants);
  });

  it("filters participants by email substring (case-insensitive)", () => {
    const result = filterParticipantsByEmail(participants, "ALICE", authSummaryById);
    expect(result).toHaveLength(1);
    expect(result[0]!.user.id).toBe("user-1");
  });

  it("filters participants by partial email match", () => {
    const result = filterParticipantsByEmail(participants, "example", authSummaryById);
    expect(result).toHaveLength(1);
    expect(result[0]!.user.id).toBe("user-1");
  });

  it("excludes participants with null email when filtering", () => {
    const result = filterParticipantsByEmail(participants, "test", authSummaryById);
    expect(result).toHaveLength(1);
    expect(result[0]!.user.id).toBe("user-2");
  });

  it("returns empty array when no emails match", () => {
    const result = filterParticipantsByEmail(participants, "nomatch", authSummaryById);
    expect(result).toHaveLength(0);
  });

  it("handles participants not present in authSummaryById", () => {
    const sparseMap = new Map([["user-1", { email: "alice@example.com" }]]);
    const result = filterParticipantsByEmail(participants, "alice", sparseMap);
    expect(result).toHaveLength(1);
    expect(result[0]!.user.id).toBe("user-1");
  });
});

describe("sortParticipants", () => {
  const participants = [
    {
      user: {
        firstName: "Charlie",
        lastName: "Brown",
        authSummary: { email: "charlie@example.com" },
      },
    },
    {
      user: { firstName: "Alice", lastName: "Smith", authSummary: { email: "alice@example.com" } },
    },
    { user: { firstName: "Bob", lastName: "Anderson", authSummary: { email: "bob@example.com" } } },
    { user: { firstName: null, lastName: "Doe", authSummary: { email: "nullfirst@example.com" } } },
    {
      user: { firstName: "Alice", lastName: null, authSummary: { email: "alicenull@example.com" } },
    },
    { user: { firstName: "Alice", lastName: "Smith", authSummary: { email: null } } },
  ];

  it("sorts by firstName as primary key", () => {
    const result = sortParticipants(participants, "firstName");
    expect(result.map((p) => p.user.firstName)).toEqual([
      null,
      "Alice",
      "Alice",
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("sorts by lastName as primary key", () => {
    const result = sortParticipants(participants, "lastName");
    expect(result.map((p) => p.user.lastName)).toEqual([
      null,
      "Anderson",
      "Brown",
      "Doe",
      "Smith",
      "Smith",
    ]);
  });

  it("sorts by email as primary key", () => {
    const result = sortParticipants(participants, "email");
    expect(result.map((p) => p.user.authSummary?.email)).toEqual([
      null,
      "alice@example.com",
      "alicenull@example.com",
      "bob@example.com",
      "charlie@example.com",
      "nullfirst@example.com",
    ]);
  });

  it("uses lastName then email as tie-breakers when sorting by firstName", () => {
    const result = sortParticipants(participants, "firstName");
    const alices = result.filter((p) => p.user.firstName === "Alice");
    expect(alices.map((p) => p.user.lastName)).toEqual([null, "Smith", "Smith"]);
    // The two Alice Smiths: one with null email, one with email
    const smiths = alices.filter((p) => p.user.lastName === "Smith");
    expect(smiths[0]!.user.authSummary?.email).toBeNull();
    expect(smiths[1]!.user.authSummary?.email).toBe("alice@example.com");
  });

  it("uses firstName then email as tie-breakers when sorting by lastName", () => {
    const result = sortParticipants(participants, "lastName");
    const smiths = result.filter((p) => p.user.lastName === "Smith");
    expect(smiths.map((p) => p.user.firstName)).toEqual(["Alice", "Alice"]);
    expect(smiths[0]!.user.authSummary?.email).toBeNull();
    expect(smiths[1]!.user.authSummary?.email).toBe("alice@example.com");
  });

  it("uses firstName then lastName as tie-breakers when sorting by email", () => {
    const result = sortParticipants(participants, "email");
    const nullEmails = result.filter((p) => p.user.authSummary?.email === null);
    expect(nullEmails).toHaveLength(1);
    expect(nullEmails[0]!.user.firstName).toBe("Alice");
  });

  it("treats null values as empty strings for sorting", () => {
    const withNulls = [
      { user: { firstName: "Zoe", lastName: null, authSummary: { email: "zoe@example.com" } } },
      { user: { firstName: null, lastName: "Zoe", authSummary: { email: "zoe@example.com" } } },
    ];
    const byFirstName = sortParticipants(withNulls, "firstName");
    expect(byFirstName[0]!.user.firstName).toBeNull();
    expect(byFirstName[1]!.user.firstName).toBe("Zoe");

    const byLastName = sortParticipants(withNulls, "lastName");
    expect(byLastName[0]!.user.lastName).toBeNull();
    expect(byLastName[1]!.user.lastName).toBe("Zoe");
  });

  it("does not mutate the original array", () => {
    const original = [...participants];
    const result = sortParticipants(participants, "firstName");
    expect(participants).toEqual(original);
    expect(result).not.toBe(participants);
  });

  it("handles empty array", () => {
    expect(sortParticipants([], "firstName")).toEqual([]);
  });

  it("handles single element array", () => {
    const single = [
      { user: { firstName: "Only", lastName: "One", authSummary: { email: "only@example.com" } } },
    ];
    expect(sortParticipants(single, "firstName")).toEqual(single);
  });

  it("handles missing authSummary as null email", () => {
    const noAuthSummary = [
      { user: { firstName: "A", lastName: "B" } },
      { user: { firstName: "C", lastName: "D", authSummary: { email: "c@example.com" } } },
    ];
    const result = sortParticipants(noAuthSummary, "email");
    expect(result[0]!.user.firstName).toBe("A");
    expect(result[1]!.user.firstName).toBe("C");
  });
});
