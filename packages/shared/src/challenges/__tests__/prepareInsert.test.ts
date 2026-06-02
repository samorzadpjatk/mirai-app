import { describe, it, expect } from "vitest";
import { prepareChallengeInsert } from "../prepareInsert";
import { startOfDay, endOfDay, addDays } from "../dateUtils";

describe("prepareChallengeInsert", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  it("prepares basic challenge insert", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Test Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      },
      now,
    );

    expect(result.tripId).toBe("trip-1");
    expect(result.name).toBe("Test Challenge");
    expect(result.submissionType).toBe("IMAGE");
    expect(result.scoringCategory).toBe("SPEED");
    expect(result.status).toBe("HIDDEN");
    expect(result.isRecurring).toBeUndefined();
  });

  it("normalizes autoApprove for QR_CODE", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "QR Challenge",
        submissionType: "QR_CODE",
        scoringCategory: "SPEED",
        autoApprove: false,
      },
      now,
    );
    expect(result.autoApprove).toBe(true);
  });

  it("normalizes autoApprove for LOCATION", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Loc Challenge",
        submissionType: "LOCATION",
        scoringCategory: "SPEED",
        autoApprove: false,
      },
      now,
    );
    expect(result.autoApprove).toBe(true);
  });

  it("normalizes autoApprove for IMAGE_LOCATION", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "ImgLoc Challenge",
        submissionType: "IMAGE_LOCATION",
        scoringCategory: "SPEED",
        autoApprove: true,
      },
      now,
    );
    expect(result.autoApprove).toBe(false);
  });

  it("preserves autoApprove for TEXT", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Text Challenge",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        autoApprove: true,
      },
      now,
    );
    expect(result.autoApprove).toBe(true);
  });

  it("sets expectedValue for QR_CODE", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "QR Challenge",
        submissionType: "QR_CODE",
        scoringCategory: "SPEED",
        qrCodeValue: "SECRET123",
      },
      now,
    );
    expect(result.expectedValue).toBe("SECRET123");
  });

  it("sets expectedValue for TEXT", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Text Challenge",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        textExpectedPhrase: "hello world",
      },
      now,
    );
    expect(result.expectedValue).toBe("hello world");
  });

  it("returns null expectedValue for IMAGE", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Image Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      },
      now,
    );
    expect(result.expectedValue).toBeNull();
  });

  it("computes recurring window when recurring", () => {
    const startTime = new Date("2024-06-15T10:00:00Z");
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Recurring Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        isRecurring: true,
        recurringDays: 3,
        startTime,
      },
      now,
    );

    expect(result.isRecurring).toBe(true);
    const anchorDay = startOfDay(startTime);
    expect(result.startTime).toEqual(anchorDay);
    expect(result.endTime).toEqual(endOfDay(addDays(anchorDay, 2)));
  });

  it("computes peer voting window", () => {
    const endTime = new Date("2024-06-15T18:00:00Z");
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Voting Challenge",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        endTime,
        votingDurationHours: 4,
      },
      now,
    );

    expect(result.votingStartTime).toEqual(endTime);
    expect(result.votingEndTime).toEqual(new Date(endTime.getTime() + 4 * 60 * 60 * 1000));
  });

  it("sets voting times to null for non-peer-voting", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Speed Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      },
      now,
    );
    expect(result.votingStartTime).toBeNull();
    expect(result.votingEndTime).toBeNull();
  });

  it("computes ACTIVE status for immediate activation", () => {
    const startTime = new Date("2024-06-15T10:00:00Z");
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Active Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "VISIBLE",
        startTime,
      },
      now,
    );
    expect(result.status).toBe("ACTIVE");
  });

  it("keeps VISIBLE status when start time is future", () => {
    const startTime = new Date("2024-06-15T14:00:00Z");
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Future Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "VISIBLE",
        startTime,
      },
      now,
    );
    expect(result.status).toBe("VISIBLE");
  });

  it("normalizes image input", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Image Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        image: "https://example.com/image.png",
      },
      now,
    );
    expect(result.image).toBe("https://example.com/image.png");
  });

  it("returns undefined image when not provided", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "No Image Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      },
      now,
    );
    expect(result.image).toBeUndefined();
  });

  it("preserves optional fields", () => {
    const result = prepareChallengeInsert(
      {
        tripId: "trip-1",
        name: "Full Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        description: "A test challenge",
        basePoints: 10,
        firstPlacePoints: 20,
        secondPlacePoints: 15,
        thirdPlacePoints: 10,
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
      },
      now,
    );

    expect(result.description).toBe("A test challenge");
    expect(result.basePoints).toBe(10);
    expect(result.firstPlacePoints).toBe(20);
    expect(result.secondPlacePoints).toBe(15);
    expect(result.thirdPlacePoints).toBe(10);
    expect(result.targetLatitude).toBe(52.2297);
    expect(result.targetLongitude).toBe(21.0122);
    expect(result.dailyStartTime).toBe("09:00");
    expect(result.dailyEndTime).toBe("18:00");
  });
});
