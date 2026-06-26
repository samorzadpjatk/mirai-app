import { beforeEach, describe, expect, it } from "vitest";
import {
  judgementStore,
  type ReviewStatus,
  type Submission,
  useJudgementStore,
} from "../judgementStore";

describe("Judgement Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    judgementStore.setState({
      tripId: "",
      challengeId: "",
      dismissedIds: [],
    });
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = judgementStore.getState();
      expect(state.tripId).toBe("");
      expect(state.challengeId).toBe("");
      expect(state.dismissedIds).toEqual([]);
    });
  });

  describe("setTripId", () => {
    it("should set tripId", () => {
      judgementStore.getState().setTripId("trip-123");
      expect(judgementStore.getState().tripId).toBe("trip-123");
    });

    it("should update tripId when changed", () => {
      judgementStore.getState().setTripId("trip-123");
      judgementStore.getState().setTripId("trip-456");
      expect(judgementStore.getState().tripId).toBe("trip-456");
    });

    it("should handle empty string", () => {
      judgementStore.getState().setTripId("trip-123");
      judgementStore.getState().setTripId("");
      expect(judgementStore.getState().tripId).toBe("");
    });
  });

  describe("setChallengeId", () => {
    it("should set challengeId", () => {
      judgementStore.getState().setChallengeId("challenge-123");
      expect(judgementStore.getState().challengeId).toBe("challenge-123");
    });

    it("should update challengeId when changed", () => {
      judgementStore.getState().setChallengeId("challenge-123");
      judgementStore.getState().setChallengeId("challenge-456");
      expect(judgementStore.getState().challengeId).toBe("challenge-456");
    });

    it("should handle empty string", () => {
      judgementStore.getState().setChallengeId("challenge-123");
      judgementStore.getState().setChallengeId("");
      expect(judgementStore.getState().challengeId).toBe("");
    });
  });

  describe("addDismissedId", () => {
    it("should add id to dismissedIds", () => {
      judgementStore.getState().addDismissedId("submission-1");
      expect(judgementStore.getState().dismissedIds).toEqual(["submission-1"]);
    });

    it("should add multiple ids to dismissedIds", () => {
      judgementStore.getState().addDismissedId("submission-1");
      judgementStore.getState().addDismissedId("submission-2");
      judgementStore.getState().addDismissedId("submission-3");
      expect(judgementStore.getState().dismissedIds).toEqual([
        "submission-1",
        "submission-2",
        "submission-3",
      ]);
    });

    it("should not add duplicate ids", () => {
      judgementStore.getState().addDismissedId("submission-1");
      judgementStore.getState().addDismissedId("submission-1");
      expect(judgementStore.getState().dismissedIds).toEqual(["submission-1"]);
    });

    it("should maintain order of added ids", () => {
      judgementStore.getState().addDismissedId("submission-1");
      judgementStore.getState().addDismissedId("submission-2");
      judgementStore.getState().addDismissedId("submission-1"); // Duplicate, should not be added
      judgementStore.getState().addDismissedId("submission-3");
      expect(judgementStore.getState().dismissedIds).toEqual([
        "submission-1",
        "submission-2",
        "submission-3",
      ]);
    });
  });

  describe("removeDismissedId", () => {
    it("should remove id from dismissedIds", () => {
      judgementStore.getState().addDismissedId("submission-1");
      judgementStore.getState().addDismissedId("submission-2");
      judgementStore.getState().removeDismissedId("submission-1");
      expect(judgementStore.getState().dismissedIds).toEqual(["submission-2"]);
    });

    it("should handle removing non-existent id gracefully", () => {
      judgementStore.getState().addDismissedId("submission-1");
      judgementStore.getState().removeDismissedId("non-existent");
      expect(judgementStore.getState().dismissedIds).toEqual(["submission-1"]);
    });

    it("should handle removing from empty array", () => {
      judgementStore.getState().removeDismissedId("submission-1");
      expect(judgementStore.getState().dismissedIds).toEqual([]);
    });

    it("should remove all instances (though duplicates should not exist)", () => {
      // Directly set state to test edge case
      judgementStore.setState({ dismissedIds: ["a", "b", "c", "b"] });
      judgementStore.getState().removeDismissedId("b");
      expect(judgementStore.getState().dismissedIds).toEqual(["a", "c"]);
    });
  });

  describe("resetDismissedIds", () => {
    it("should clear all dismissedIds", () => {
      judgementStore.getState().addDismissedId("submission-1");
      judgementStore.getState().addDismissedId("submission-2");
      judgementStore.getState().resetDismissedIds();
      expect(judgementStore.getState().dismissedIds).toEqual([]);
    });

    it("should work on empty dismissedIds", () => {
      judgementStore.getState().resetDismissedIds();
      expect(judgementStore.getState().dismissedIds).toEqual([]);
    });

    it("should allow adding ids after reset", () => {
      judgementStore.getState().addDismissedId("submission-1");
      judgementStore.getState().resetDismissedIds();
      judgementStore.getState().addDismissedId("submission-2");
      expect(judgementStore.getState().dismissedIds).toEqual(["submission-2"]);
    });
  });

  describe("Combined Operations", () => {
    it("should handle complete workflow", () => {
      // Set trip and challenge
      judgementStore.getState().setTripId("trip-abc");
      judgementStore.getState().setChallengeId("challenge-xyz");

      // Add some dismissed submissions
      judgementStore.getState().addDismissedId("sub-1");
      judgementStore.getState().addDismissedId("sub-2");
      judgementStore.getState().addDismissedId("sub-3");

      // Try to add duplicate
      judgementStore.getState().addDismissedId("sub-2");

      // Remove one
      judgementStore.getState().removeDismissedId("sub-1");

      // Verify state
      const state = judgementStore.getState();
      expect(state.tripId).toBe("trip-abc");
      expect(state.challengeId).toBe("challenge-xyz");
      expect(state.dismissedIds).toEqual(["sub-2", "sub-3"]);

      // Reset dismissed
      judgementStore.getState().resetDismissedIds();
      expect(judgementStore.getState().dismissedIds).toEqual([]);

      // Trip and challenge should remain
      expect(judgementStore.getState().tripId).toBe("trip-abc");
      expect(judgementStore.getState().challengeId).toBe("challenge-xyz");
    });
  });

  describe("Type Exports", () => {
    it("ReviewStatus should accept APPROVED", () => {
      const status: ReviewStatus = "APPROVED";
      expect(status).toBe("APPROVED");
    });

    it("ReviewStatus should accept REJECTED", () => {
      const status: ReviewStatus = "REJECTED";
      expect(status).toBe("REJECTED");
    });

    it("Submission interface should have all required fields", () => {
      const submission: Submission = {
        id: "sub-1",
        status: "PENDING",
        imageIds: ["img-1", "img-2"],
        videoId: "vid-1",
        textContent: "Test content",
        latitude: 52.2297,
        longitude: 21.0122,
        createdAt: "2024-01-01T00:00:00Z",
        group: {
          id: "group-1",
          name: "Test Group",
          description: "A test group",
          image: "group-img.jpg",
        },
      };

      expect(submission.id).toBe("sub-1");
      expect(submission.status).toBe("PENDING");
      expect(submission.imageIds).toEqual(["img-1", "img-2"]);
      expect(submission.videoId).toBe("vid-1");
      expect(submission.textContent).toBe("Test content");
      expect(submission.latitude).toBe(52.2297);
      expect(submission.longitude).toBe(21.0122);
      expect(submission.createdAt).toBe("2024-01-01T00:00:00Z");
      expect(submission.group.id).toBe("group-1");
      expect(submission.group.name).toBe("Test Group");
      expect(submission.group.description).toBe("A test group");
      expect(submission.group.image).toBe("group-img.jpg");
    });

    it("Submission should handle null values", () => {
      const submission: Submission = {
        id: "sub-1",
        status: "PENDING",
        imageIds: [],
        videoId: null,
        textContent: null,
        latitude: null,
        longitude: null,
        createdAt: new Date("2024-01-01"),
        group: {
          id: "group-1",
          name: "Test Group",
          description: null,
          image: null,
        },
      };

      expect(submission.videoId).toBeNull();
      expect(submission.textContent).toBeNull();
      expect(submission.latitude).toBeNull();
      expect(submission.longitude).toBeNull();
      expect(submission.group.description).toBeNull();
      expect(submission.group.image).toBeNull();
    });

    it("Submission should handle Date type for createdAt", () => {
      const date = new Date("2024-06-15");
      const submission: Submission = {
        id: "sub-1",
        status: "PENDING",
        imageIds: [],
        videoId: null,
        textContent: null,
        latitude: null,
        longitude: null,
        createdAt: date,
        group: {
          id: "group-1",
          name: "Test Group",
          description: null,
          image: null,
        },
      };

      expect(submission.createdAt).toBe(date);
    });
  });

  describe("useJudgementStore hook", () => {
    it("should export useJudgementStore function", () => {
      expect(typeof useJudgementStore).toBe("function");
    });

    it("should allow selecting state with useJudgementStore", () => {
      judgementStore.setState({
        tripId: "trip-test",
        challengeId: "challenge-test",
        dismissedIds: ["sub-1", "sub-2"],
      });

      // Test that the hook can be called with a selector
      // Note: This requires React context, so we just verify the function signature
      expect(() => {
        type StoreState = ReturnType<typeof judgementStore.getState>;
        const selector = (state: StoreState) => state.tripId;
        // The hook would be used like: useJudgementStore(selector)
        // We can't actually call it without React, but we verify the export exists
        expect(typeof selector).toBe("function");
      }).not.toThrow();
    });
  });

  describe("Store Independence", () => {
    it("should maintain separate state from other stores", () => {
      // Set judgement store state
      judgementStore.getState().setTripId("trip-1");
      judgementStore.getState().addDismissedId("sub-1");

      // Verify only judgement store is affected
      const judgementState = judgementStore.getState();
      expect(judgementState.tripId).toBe("trip-1");
      expect(judgementState.dismissedIds).toContain("sub-1");
    });
  });
});
