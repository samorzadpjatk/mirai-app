import { describe, expect, it } from "vitest";
import {
  assembleParticipantWithUser,
  buildWristNumberConflictMessage,
  toPublicUser,
} from "../participantResult";

describe("buildWristNumberConflictMessage", () => {
  it("formats conflict message with full name", () => {
    const message = buildWristNumberConflictMessage("123", {
      firstName: "Jan",
      lastName: "Kowalski",
    });
    expect(message).toBe("Numer opaski 123 jest już przypisany do użytkownika: Jan Kowalski");
  });

  it("formats conflict message with only first name", () => {
    const message = buildWristNumberConflictMessage("456", {
      firstName: "Anna",
      lastName: null,
    });
    expect(message).toBe("Numer opaski 456 jest już przypisany do użytkownika: Anna");
  });

  it("formats conflict message with only last name", () => {
    const message = buildWristNumberConflictMessage("789", {
      firstName: null,
      lastName: "Nowak",
    });
    expect(message).toBe("Numer opaski 789 jest już przypisany do użytkownika: Nowak");
  });

  it("uses fallback for unknown user when both names are null", () => {
    const message = buildWristNumberConflictMessage("000", {
      firstName: null,
      lastName: null,
    });
    expect(message).toBe(
      "Numer opaski 000 jest już przypisany do użytkownika: Nieznany użytkownik",
    );
  });

  it("uses fallback for unknown user when both names are empty", () => {
    const message = buildWristNumberConflictMessage("000", {
      firstName: "",
      lastName: "",
    });
    expect(message).toBe(
      "Numer opaski 000 jest już przypisany do użytkownika: Nieznany użytkownik",
    );
  });
});

describe("toPublicUser", () => {
  it("maps user fields and resolves email from map", () => {
    const emailMap = new Map([["auth-1", "user@example.com"]]);
    const user = {
      id: "u1",
      authUserId: "auth-1",
      firstName: "Jan",
      lastName: "Kowalski",
      role: "USER" as const,
    };

    const result = toPublicUser(user, emailMap);

    expect(result).toEqual({
      id: "u1",
      firstName: "Jan",
      lastName: "Kowalski",
      email: "user@example.com",
      role: "USER",
    });
  });

  it("returns null email when authUserId is missing", () => {
    const emailMap = new Map<string, string | null>();
    const user = {
      id: "u2",
      firstName: "Anna",
      lastName: "Nowak",
      role: "ADMIN" as const,
    };

    const result = toPublicUser(user, emailMap);

    expect(result.email).toBeNull();
  });

  it("returns null email when authUserId not in map", () => {
    const emailMap = new Map([["other-auth", "other@example.com"]]);
    const user = {
      id: "u3",
      authUserId: "auth-3",
      firstName: null,
      lastName: null,
      role: "MODERATOR" as const,
    };

    const result = toPublicUser(user, emailMap);

    expect(result.email).toBeNull();
  });

  it("coerces undefined names to null", () => {
    const emailMap = new Map<string, string | null>();
    const user = {
      id: "u4",
      authUserId: "auth-4",
      role: "SERVICE" as const,
    };

    const result = toPublicUser(user, emailMap);

    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
  });
});

describe("assembleParticipantWithUser", () => {
  it("assembles participant result with public user", () => {
    const emailMap = new Map([["auth-1", "user@example.com"]]);
    const participant = {
      user: {
        id: "u1",
        authUserId: "auth-1",
        firstName: "Jan",
        lastName: "Kowalski",
        role: "USER" as const,
      },
      wristNumber: "123",
      houseNumber: "5",
      groupId: "g1",
      tripId: "t1",
    };

    const result = assembleParticipantWithUser(participant, emailMap);

    expect(result).toEqual({
      user: {
        id: "u1",
        firstName: "Jan",
        lastName: "Kowalski",
        email: "user@example.com",
        role: "USER",
      },
      wristNumber: "123",
      houseNumber: "5",
      groupId: "g1",
      tripId: "t1",
    });
  });

  it("handles null participant fields", () => {
    const emailMap = new Map<string, string | null>();
    const participant = {
      user: {
        id: "u2",
        authUserId: "auth-2",
        firstName: null,
        lastName: null,
        role: "ADMIN" as const,
      },
      wristNumber: null,
      houseNumber: null,
      groupId: null,
      tripId: null,
    };

    const result = assembleParticipantWithUser(participant, emailMap);

    expect(result.user.email).toBeNull();
    expect(result.wristNumber).toBeNull();
    expect(result.houseNumber).toBeNull();
    expect(result.groupId).toBeNull();
    expect(result.tripId).toBeNull();
  });

  it("preserves participant fields unchanged", () => {
    const emailMap = new Map([["auth-3", "mod@example.com"]]);
    const participant = {
      user: {
        id: "u3",
        authUserId: "auth-3",
        firstName: "Piotr",
        lastName: "Zieliński",
        role: "MODERATOR" as const,
      },
      wristNumber: "999",
      houseNumber: "12A",
      groupId: "g2",
      tripId: "t2",
    };

    const result = assembleParticipantWithUser(participant, emailMap);

    expect(result.wristNumber).toBe("999");
    expect(result.houseNumber).toBe("12A");
    expect(result.groupId).toBe("g2");
    expect(result.tripId).toBe("t2");
    expect(result.user.role).toBe("MODERATOR");
  });
});
