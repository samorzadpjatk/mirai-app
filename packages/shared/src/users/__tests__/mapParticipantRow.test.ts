import { describe, expect, it } from "vitest";
import { mapParticipantRow } from "../mapParticipantRow";

function createRow(overrides?: {
  groups?: { id: string; name: string } | null;
  wristNumber?: string | null;
  houseNumber?: string | null;
}) {
  return {
    trip_participants: {
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: overrides?.groups ? overrides.groups.id : null,
      wristNumber: overrides?.wristNumber ?? null,
      houseNumber: overrides?.houseNumber ?? null,
      role: "MEMBER",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    },
    users: {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    },
    groups: overrides?.groups ?? null,
  };
}

describe("mapParticipantRow", () => {
  it("maps a row with a group", () => {
    const row = createRow({
      groups: { id: "group-1", name: "Alpha" },
      wristNumber: "W001",
      houseNumber: "H42",
    });

    const result = mapParticipantRow(row);

    expect(result).toEqual({
      user: {
        id: "user-1",
        authUserId: "auth-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      },
      group: { id: "group-1", name: "Alpha" },
      wristNumber: "W001",
      houseNumber: "H42",
      tripId: "trip-1",
    });
  });

  it("maps a row without a group", () => {
    const row = createRow({
      groups: null,
      wristNumber: "W002",
      houseNumber: null,
    });

    const result = mapParticipantRow(row);

    expect(result).toEqual({
      user: {
        id: "user-1",
        authUserId: "auth-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      },
      group: null,
      wristNumber: "W002",
      houseNumber: null,
      tripId: "trip-1",
    });
  });

  it("maps a row with null wrist and house numbers", () => {
    const row = createRow({
      groups: null,
      wristNumber: null,
      houseNumber: null,
    });

    const result = mapParticipantRow(row);

    expect(result.wristNumber).toBeNull();
    expect(result.houseNumber).toBeNull();
  });
});
