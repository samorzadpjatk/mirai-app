import { describe, it, expect } from "@jest/globals";
import {
  statusColors,
  getSubmissionTypeMeta,
  getScoringMeta,
} from "../admin/challenges/AdminChallengeListCard";

describe("statusColors", () => {
  it("should have colors for known statuses", () => {
    expect(statusColors.HIDDEN).toBe("#64748b");
    expect(statusColors.VISIBLE).toBe("#0ea5e9");
    expect(statusColors.ACTIVE).toBe("#22c55e");
    expect(statusColors.VOTING_PHASE).toBe("#f59e0b");
    expect(statusColors.COMPLETED).toBe("#10b981");
  });
});

describe("getSubmissionTypeMeta", () => {
  it("should map known submission types", () => {
    expect(getSubmissionTypeMeta("IMAGE")).toEqual({ label: "Photo", icon: "image-outline" });
    expect(getSubmissionTypeMeta("MULTI_IMAGE")).toEqual({
      label: "Multi",
      icon: "images-outline",
    });
    expect(getSubmissionTypeMeta("VIDEO")).toEqual({ label: "Video", icon: "videocam-outline" });
    expect(getSubmissionTypeMeta("TEXT")).toEqual({ label: "Text", icon: "document-text-outline" });
    expect(getSubmissionTypeMeta("LOCATION")).toEqual({ label: "GPS", icon: "location-outline" });
    expect(getSubmissionTypeMeta("QR_CODE")).toEqual({ label: "QR", icon: "qr-code-outline" });
  });

  it("should map IMAGE_LOCATION with secondary icon", () => {
    expect(getSubmissionTypeMeta("IMAGE_LOCATION")).toEqual({
      label: "Photo+GPS",
      icon: "camera-outline",
      secondaryIcon: "location-outline",
    });
  });

  it("should default to Photo for unknown types", () => {
    expect(getSubmissionTypeMeta("UNKNOWN" as never)).toEqual({
      label: "Photo",
      icon: "image-outline",
    });
  });
});

describe("getScoringMeta", () => {
  it("should map known scoring categories", () => {
    expect(getScoringMeta("SPEED")).toEqual({ label: "Speed", icon: "flash-outline" });
    expect(getScoringMeta("UNLIMITED")).toEqual({ label: "Unlimited", icon: "infinite-outline" });
    expect(getScoringMeta("PEER_VOTING")).toEqual({ label: "Voting", icon: "people-outline" });
    expect(getScoringMeta("JUDGED_STAFF")).toEqual({
      label: "Staff",
      icon: "shield-checkmark-outline",
    });
  });

  it("should default to Staff for unknown categories", () => {
    expect(getScoringMeta("UNKNOWN" as never)).toEqual({
      label: "Staff",
      icon: "shield-checkmark-outline",
    });
  });
});
