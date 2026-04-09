/// <reference lib="dom" />

import { describe, test, expect, beforeEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useChallengeForm } from "../admin/useChallengeForm";
import type { ChallengeFormState } from "../../components/admin/challenges/challengeFormConstants";

describe("[UNIT] useChallengeForm", () => {
  describe("initial state", () => {
    test("has default empty form state for new challenge", () => {
      const { result } = renderHook(() => useChallengeForm());

      expect(result.current.form.title).toBe("");
      expect(result.current.form.description).toBe("");
      expect(result.current.form.submissionType).toBe("IMAGE");
      expect(result.current.form.scoringCategory).toBe("SPEED");
      expect(result.current.form.status).toBe("HIDDEN");
      expect(result.current.form.autoApprove).toBe(false);
    });

    test("applies initialData when provided", () => {
      const initialData: Partial<ChallengeFormState> = {
        title: "Test Challenge",
        description: "Test Description",
        basePoints: "100",
      };

      const { result } = renderHook(() => useChallengeForm({ initialData }));

      expect(result.current.form.title).toBe("Test Challenge");
      expect(result.current.form.description).toBe("Test Description");
      expect(result.current.form.basePoints).toBe("100");
    });

    test("isNewChallenge defaults to true", () => {
      const { result } = renderHook(() => useChallengeForm());

      expect(result.current.statusOptions).toHaveLength(2); // HIDDEN, VISIBLE only
      expect(result.current.statusOptions.map((o) => o.value)).toContain(
        "HIDDEN",
      );
      expect(result.current.statusOptions.map((o) => o.value)).toContain(
        "VISIBLE",
      );
    });

    test("isNewChallenge false provides all status options", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ isNewChallenge: false }),
      );

      expect(result.current.statusOptions).toHaveLength(6); // All statuses
      expect(result.current.statusOptions.map((o) => o.value)).toContain(
        "ACTIVE",
      );
      expect(result.current.statusOptions.map((o) => o.value)).toContain(
        "COMPLETED",
      );
    });
  });

  describe("updateField", () => {
    test("updates a single field", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.updateField("title", "New Title");
      });

      expect(result.current.form.title).toBe("New Title");
    });

    test("preserves other fields when updating one", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.updateField("title", "Title");
        result.current.updateField("description", "Description");
      });

      expect(result.current.form.title).toBe("Title");
      expect(result.current.form.description).toBe("Description");
      expect(result.current.form.submissionType).toBe("IMAGE"); // Unchanged
    });

    test("updates numeric fields as strings", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.updateField("basePoints", "500");
      });

      expect(result.current.form.basePoints).toBe("500");
    });

    test("updates boolean fields", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.updateField("isRecurring", true);
      });

      expect(result.current.form.isRecurring).toBe(true);
    });
  });

  describe("setSubmissionType", () => {
    test("updates submission type", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.setSubmissionType("VIDEO");
      });

      expect(result.current.form.submissionType).toBe("VIDEO");
    });

    test("clears qrCodeValue when changing from QR_CODE", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: { submissionType: "QR_CODE", qrCodeValue: "test-qr" },
        }),
      );

      act(() => {
        result.current.setSubmissionType("IMAGE");
      });

      expect(result.current.form.qrCodeValue).toBe("");
    });

    test("clears textExpectedPhrase when changing from TEXT", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: {
            submissionType: "TEXT",
            textExpectedPhrase: "expected",
          },
        }),
      );

      act(() => {
        result.current.setSubmissionType("IMAGE");
      });

      expect(result.current.form.textExpectedPhrase).toBe("");
    });

    test("clears location when changing from LOCATION", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: {
            submissionType: "LOCATION",
            targetLatitude: "52.0",
            targetLongitude: "21.0",
          },
        }),
      );

      act(() => {
        result.current.setSubmissionType("IMAGE");
      });

      expect(result.current.form.targetLatitude).toBe("");
      expect(result.current.form.targetLongitude).toBe("");
    });

    test("switches scoring from PEER_VOTING when type doesn't support it", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: {
            submissionType: "IMAGE",
            scoringCategory: "PEER_VOTING",
            votingDurationValue: "24",
          },
        }),
      );

      act(() => {
        result.current.setSubmissionType("TEXT"); // TEXT doesn't support PEER_VOTING
      });

      expect(result.current.form.scoringCategory).toBe("SPEED");
      expect(result.current.form.votingDurationValue).toBe("");
    });

    test("preserves PEER_VOTING when switching to IMAGE type", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: {
            submissionType: "TEXT",
            scoringCategory: "SPEED",
          },
        }),
      );

      // First change to PEER_VOTING
      act(() => {
        result.current.setScoringCategory("PEER_VOTING");
      });

      // Then switch to IMAGE
      act(() => {
        result.current.setSubmissionType("IMAGE");
      });

      // PEER_VOTING should be preserved since IMAGE supports it
      expect(result.current.form.scoringCategory).toBe("PEER_VOTING");
    });
  });

  describe("setScoringCategory", () => {
    test("updates scoring category", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.setScoringCategory("UNLIMITED");
      });

      expect(result.current.form.scoringCategory).toBe("UNLIMITED");
    });

    test("clears podium points when selecting UNLIMITED", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: {
            scoringCategory: "SPEED",
            firstPlacePoints: "100",
            secondPlacePoints: "50",
            thirdPlacePoints: "25",
          },
        }),
      );

      act(() => {
        result.current.setScoringCategory("UNLIMITED");
      });

      expect(result.current.form.firstPlacePoints).toBe("");
      expect(result.current.form.secondPlacePoints).toBe("");
      expect(result.current.form.thirdPlacePoints).toBe("");
    });

    test("clears voting duration when not PEER_VOTING", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: {
            scoringCategory: "PEER_VOTING",
            votingDurationValue: "24",
            votingDurationUnit: "HOURS",
          },
        }),
      );

      act(() => {
        result.current.setScoringCategory("SPEED");
      });

      expect(result.current.form.votingDurationValue).toBe("");
      expect(result.current.form.votingDurationUnit).toBe("HOURS");
    });
  });

  describe("setStatus", () => {
    test("sets valid status for new challenge", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ isNewChallenge: true }),
      );

      act(() => {
        result.current.setStatus("VISIBLE");
      });

      expect(result.current.form.status).toBe("VISIBLE");
    });

    test("ignores invalid status for new challenge", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ isNewChallenge: true }),
      );

      act(() => {
        result.current.setStatus("ACTIVE"); // Not allowed for new challenge
      });

      expect(result.current.form.status).toBe("HIDDEN"); // Unchanged from default
    });

    test("allows all statuses for existing challenge", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ isNewChallenge: false }),
      );

      act(() => {
        result.current.setStatus("COMPLETED");
      });

      expect(result.current.form.status).toBe("COMPLETED");
    });
  });

  describe("setAutoApprove", () => {
    test("sets autoApprove when allowed (TEXT type)", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { submissionType: "TEXT" } }),
      );

      act(() => {
        result.current.setAutoApprove(true);
      });

      expect(result.current.form.autoApprove).toBe(true);
    });

    test("forces autoApprove true for QR_CODE", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { submissionType: "QR_CODE" } }),
      );

      expect(result.current.isAutoApproveForced).toBe(true);

      act(() => {
        result.current.setAutoApprove(false);
      });

      expect(result.current.form.autoApprove).toBe(true);
    });

    test("forces autoApprove true for LOCATION", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { submissionType: "LOCATION" } }),
      );

      act(() => {
        result.current.setAutoApprove(false);
      });

      expect(result.current.form.autoApprove).toBe(true);
    });

    test("forces autoApprove false for IMAGE", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: { submissionType: "IMAGE", autoApprove: true },
        }),
      );

      expect(result.current.isAutoApproveDisabled).toBe(true);

      act(() => {
        result.current.setAutoApprove(true);
      });

      expect(result.current.form.autoApprove).toBe(false);
    });
  });

  describe("resetForm", () => {
    test("resets form to defaults", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.updateField("title", "Changed");
        result.current.updateField("basePoints", "500");
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.form.title).toBe("");
      expect(result.current.form.basePoints).toBe("");
    });

    test("resets with provided data", () => {
      const { result } = renderHook(() => useChallengeForm());

      act(() => {
        result.current.updateField("title", "Changed");
      });

      act(() => {
        result.current.resetForm({ title: "Reset Title", basePoints: "200" });
      });

      expect(result.current.form.title).toBe("Reset Title");
      expect(result.current.form.basePoints).toBe("200");
    });

    test("preserves initialData on reset", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { title: "Initial" } }),
      );

      act(() => {
        result.current.updateField("title", "Changed");
        result.current.updateField("description", "Desc");
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.form.title).toBe("Initial");
      expect(result.current.form.description).toBe("");
    });
  });

  describe("computed values", () => {
    test("isPeerVoting is true when scoringCategory is PEER_VOTING", () => {
      const { result } = renderHook(() =>
        useChallengeForm({
          initialData: {
            submissionType: "IMAGE",
            scoringCategory: "PEER_VOTING",
          },
        }),
      );

      expect(result.current.isPeerVoting).toBe(true);
    });

    test("showPodiumPoints is false when UNLIMITED", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { scoringCategory: "UNLIMITED" } }),
      );

      expect(result.current.showPodiumPoints).toBe(false);
    });

    test("needsLocation is true for IMAGE_LOCATION", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { submissionType: "IMAGE_LOCATION" } }),
      );

      expect(result.current.needsLocation).toBe(true);
    });

    test("needsLocation is true for LOCATION", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { submissionType: "LOCATION" } }),
      );

      expect(result.current.needsLocation).toBe(true);
    });

    test("scoringOptions filters PEER_VOTING for non-supported types", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { submissionType: "TEXT" } }),
      );

      const hasPeerVoting = result.current.scoringOptions.some(
        (opt) => opt.value === "PEER_VOTING",
      );
      expect(hasPeerVoting).toBe(false);
    });

    test("scoringOptions includes PEER_VOTING for IMAGE", () => {
      const { result } = renderHook(() =>
        useChallengeForm({ initialData: { submissionType: "IMAGE" } }),
      );

      const hasPeerVoting = result.current.scoringOptions.some(
        (opt) => opt.value === "PEER_VOTING",
      );
      expect(hasPeerVoting).toBe(true);
    });
  });

  describe("form workflow", () => {
    test("complete form setup workflow", () => {
      const { result } = renderHook(() => useChallengeForm());

      // Set basic info
      act(() => {
        result.current.updateField("title", "Photo Challenge");
        result.current.updateField("description", "Submit your best photo");
        result.current.updateField("basePoints", "100");
      });

      // Configure submission type
      act(() => {
        result.current.setSubmissionType("IMAGE");
      });

      // Set status
      act(() => {
        result.current.setStatus("VISIBLE");
      });

      expect(result.current.form.title).toBe("Photo Challenge");
      expect(result.current.form.description).toBe("Submit your best photo");
      expect(result.current.form.submissionType).toBe("IMAGE");
      expect(result.current.form.status).toBe("VISIBLE");
    });

    test("peer voting challenge workflow", () => {
      const { result } = renderHook(() => useChallengeForm());

      // Set up peer voting
      act(() => {
        result.current.setSubmissionType("IMAGE");
        result.current.setScoringCategory("PEER_VOTING");
        result.current.updateField("votingDurationValue", "48");
      });

      expect(result.current.isPeerVoting).toBe(true);
      expect(result.current.form.votingDurationValue).toBe("48");
      expect(result.current.showPodiumPoints).toBe(true);
    });
  });
});
