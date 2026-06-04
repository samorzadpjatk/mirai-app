import { describe, expect, it } from "vitest";
import { buildReportWithEmail, mapReportsWithEmails } from "../builders";

describe("buildReportWithEmail", () => {
  it("returns report as-is when reporter is null", () => {
    const report = {
      id: "report-1",
      submissionId: "sub-1",
      reporterId: "reporter-1",
      reason: "Spam",
      details: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      reporter: null,
    };
    const result = buildReportWithEmail(report as any, new Map());
    expect(result.reporter).toBeNull();
  });

  it("adds resolved email to reporter user", () => {
    const report = {
      id: "report-1",
      submissionId: "sub-1",
      reporterId: "reporter-1",
      reason: "Spam",
      details: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      reporter: {
        id: "reporter-1",
        user: {
          id: "user-1",
          authUserId: "auth-1",
          firstName: "John",
          lastName: "Doe",
        },
      },
    };
    const emailLookup = new Map([["auth-1", "john@example.com"]]);
    const result = buildReportWithEmail(report as any, emailLookup);
    expect(result.reporter?.user.email).toBe("john@example.com");
    expect(result.reporter?.user.firstName).toBe("John");
  });

  it("sets email to null when not found in lookup", () => {
    const report = {
      id: "report-1",
      reporter: {
        id: "reporter-1",
        user: {
          id: "user-1",
          authUserId: "auth-1",
          firstName: "John",
        },
      },
    };
    const result = buildReportWithEmail(report as any, new Map());
    expect(result.reporter?.user.email).toBeNull();
  });

  it("strips authUserId from reporter user", () => {
    const report = {
      id: "report-1",
      reporter: {
        id: "reporter-1",
        user: {
          id: "user-1",
          authUserId: "auth-1",
          firstName: "John",
        },
      },
    };
    const result = buildReportWithEmail(report as any, new Map());
    expect((result.reporter?.user as any).authUserId).toBeUndefined();
  });
});

describe("mapReportsWithEmails", () => {
  it("returns empty array for empty input", () => {
    const result = mapReportsWithEmails([], new Map());
    expect(result).toEqual([]);
  });

  it("maps multiple reports with emails", () => {
    const reports = [
      {
        id: "report-1",
        reporter: {
          id: "reporter-1",
          user: { id: "user-1", authUserId: "auth-1", firstName: "John" },
        },
      },
      {
        id: "report-2",
        reporter: {
          id: "reporter-2",
          user: { id: "user-2", authUserId: "auth-2", firstName: "Jane" },
        },
      },
    ];
    const emailLookup = new Map([
      ["auth-1", "john@example.com"],
      ["auth-2", "jane@example.com"],
    ]);
    const result = mapReportsWithEmails(reports as any, emailLookup);
    expect(result).toHaveLength(2);
    expect(result[0]!.reporter?.user.email).toBe("john@example.com");
    expect(result[1]!.reporter?.user.email).toBe("jane@example.com");
  });
});
