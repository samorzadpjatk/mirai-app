import { describe, expect, it } from "vitest";
import type { PublicUser, roleSchema } from "../types";
import { formatUserFullName, toPublicUser, toPublicUserWithAuthSummary } from "../utils";

describe("user/utils - formatUserFullName", () => {
  it("returns full name when firstName and lastName provided", () => {
    const result = formatUserFullName({ firstName: "John", lastName: "Doe" });
    expect(result).toBe("John Doe");
  });

  it("returns firstName only when lastName is null", () => {
    const result = formatUserFullName({ firstName: "John", lastName: null });
    expect(result).toBe("John");
  });

  it("returns lastName only when firstName is null", () => {
    const result = formatUserFullName({ firstName: null, lastName: "Doe" });
    expect(result).toBe("Doe");
  });

  it("returns email fallback when both names are null", () => {
    const result = formatUserFullName({
      firstName: null,
      lastName: null,
      email: "john@example.com",
    });
    expect(result).toBe("john@example.com");
  });

  it("returns 'Unknown user' when user is undefined", () => {
    const result = formatUserFullName(undefined as any);
    expect(result).toBe("Unknown user");
  });

  it("returns 'Unknown user' when both names are empty strings", () => {
    const result = formatUserFullName({ firstName: "", lastName: "" });
    expect(result).toBe("Unknown user");
  });

  it("trims names when formatting", () => {
    const result = formatUserFullName({ firstName: " John ", lastName: " Doe " });
    expect(result).toBe("John Doe");
  });
});

describe("user/utils - toPublicUser", () => {
  it("returns PublicUser with resolved email", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", "john@example.com"]]);

    const result = toPublicUser(user, emailMap);

    expect(result).toEqual({
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
      email: "john@example.com",
      hasName: true,
      hasEmail: true,
      isEmailVerified: false,
    });
  });

  it("returns empty firstName when firstName is null", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: null,
      lastName: "Doe",
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", "john@example.com"]]);

    const result = toPublicUser(user, emailMap);

    expect(result.firstName).toBe("");
    expect(result.hasName).toBe(true); // lastName is non-empty
  });

  it("returns empty lastName when lastName is null", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: null,
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", "john@example.com"]]);

    const result = toPublicUser(user, emailMap);

    expect(result.lastName).toBe("");
    expect(result.hasName).toBe(true); // firstName is non-empty
  });

  it("returns empty email when authUserId is null", () => {
    const user = {
      id: "user-1",
      authUserId: null,
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const emailMap = new Map();

    const result = toPublicUser(user, emailMap);

    expect(result.email).toBe("");
    expect(result.hasEmail).toBe(false);
  });

  it("returns empty email when authUserId is undefined", () => {
    const user = {
      id: "user-1",
      authUserId: undefined as any,
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const emailMap = new Map();

    const result = toPublicUser(user, emailMap);

    expect(result.email).toBe("");
  });

  it("returns empty string for email when not in map", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-999",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", "john@example.com"]]);

    const result = toPublicUser(user, emailMap);

    expect(result.email).toBe("");
  });

  it("returns null email when map has null value", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", null]]);

    const result = toPublicUser(user, emailMap);

    expect(result.email).toBe("");
  });

  it("hasName is false when both firstName and lastName are empty", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "",
      lastName: "",
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", "john@example.com"]]);

    const result = toPublicUser(user, emailMap);

    expect(result.hasName).toBe(false);
  });

  it("hasName is true when firstName is just whitespace", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "  ",
      lastName: "",
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", "john@example.com"]]);

    const result = toPublicUser(user, emailMap);

    expect(result.hasName).toBe(false); // whitespace trims to empty
  });

  it("hasEmail is false when email is empty string", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const emailMap = new Map([["auth-1", ""]]);

    const result = toPublicUser(user, emailMap);

    expect(result.hasEmail).toBe(false);
  });
});

describe("user/utils - toPublicUserWithAuthSummary", () => {
  it("returns PublicUser with basic auth summary", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map([
      [
        "auth-1",
        {
          email: "john@example.com",
          bannedUntil: "",
          banReason: "",
          isBanned: false,
        },
      ],
    ]);

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result).toEqual({
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
      email: "john@example.com",
      isBanned: false,
      hasName: true,
      hasEmail: true,
      isEmailVerified: false,
    });
  });

  it("includes bannedUntil when present", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const authMap = new Map([
      [
        "auth-1",
        {
          email: "john@example.com",
          bannedUntil: futureDate,
          banReason: "Test ban",
          isBanned: true,
        },
      ],
    ]);

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.bannedUntil).toBe(futureDate);
    expect(result.banReason).toBe("Test ban");
    expect(result.isBanned).toBe(true);
  });

  it("excludes bannedUntil when falsy", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map([
      [
        "auth-1",
        {
          email: "john@example.com",
          bannedUntil: "",
          banReason: "",
          isBanned: false,
        },
      ],
    ]);

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.bannedUntil).toBeUndefined();
    expect(result.banReason).toBeUndefined();
  });

  it("handles null summary when authUserId exists but not in map", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-999",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map();

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result).toEqual({
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
      email: "",
      isBanned: false,
      hasName: true,
      hasEmail: false,
      isEmailVerified: false,
    });
  });

  it("handles null authUserId", () => {
    const user = {
      id: "user-1",
      authUserId: null,
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map();

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result).toEqual({
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
      email: "",
      isBanned: false,
      hasName: true,
      hasEmail: false,
      isEmailVerified: false,
    });
  });

  it("handles undefined authUserId", () => {
    const user = {
      id: "user-1",
      authUserId: undefined as any,
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map();

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.email).toBe("");
    expect(result.isBanned).toBe(false);
  });

  it("returns empty firstName when null", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: null,
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map();

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.firstName).toBe("");
  });

  it("returns empty lastName when null", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: null,
      role: "USER" as const,
    };
    const authMap = new Map();

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.lastName).toBe("");
  });

  it("hasName is false when both names are empty", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "",
      lastName: "",
      role: "USER" as const,
    };
    const authMap = new Map();

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.hasName).toBe(false);
  });

  it("hasEmail is false when email from summary is empty", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map([
      [
        "auth-1",
        {
          email: "",
          bannedUntil: "",
          banReason: "",
          isBanned: false,
        },
      ],
    ]);

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.hasEmail).toBe(false);
  });

  it("only includes banReason when it is truthy", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const authMap = new Map([
      [
        "auth-1",
        {
          email: "john@example.com",
          bannedUntil: "",
          banReason: "Test violation",
          isBanned: false,
        },
      ],
    ]);

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.banReason).toBe("Test violation");
  });

  it("only includes bannedUntil when it is truthy", () => {
    const user = {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER" as const,
    };
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const authMap = new Map([
      [
        "auth-1",
        {
          email: "john@example.com",
          bannedUntil: futureDate,
          banReason: "",
          isBanned: false,
        },
      ],
    ]);

    const result = toPublicUserWithAuthSummary(user, authMap);

    expect(result.bannedUntil).toBe(futureDate);
    expect(result.banReason).toBeUndefined();
  });
});
