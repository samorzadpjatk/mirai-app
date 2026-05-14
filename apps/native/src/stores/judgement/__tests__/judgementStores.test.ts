import { describe, it, expect, beforeEach } from "@jest/globals";
import { judgementStore } from "../judgementStores";

describe("judgementStore", () => {
  beforeEach(() => {
    judgementStore.setState({
      tripId: "",
      challengeId: "",
      dismissedIds: [],
    });
  });

  describe("initial state", () => {
    it("should have empty tripId", () => {
      const state = judgementStore.getState();
      expect(state.tripId).toBe("");
    });

    it("should have empty challengeId", () => {
      const state = judgementStore.getState();
      expect(state.challengeId).toBe("");
    });

    it("should have empty dismissedIds array", () => {
      const state = judgementStore.getState();
      expect(state.dismissedIds).toEqual([]);
    });
  });

  describe("actions", () => {
    describe("setTripId", () => {
      it("should set trip id", () => {
        const { setTripId } = judgementStore.getState();
        setTripId("trip-123");

        expect(judgementStore.getState().tripId).toBe("trip-123");
      });

      it("should update trip id", () => {
        const { setTripId } = judgementStore.getState();
        setTripId("trip-123");
        setTripId("trip-456");

        expect(judgementStore.getState().tripId).toBe("trip-456");
      });

      it("should handle empty string", () => {
        const { setTripId } = judgementStore.getState();
        setTripId("trip-123");
        setTripId("");

        expect(judgementStore.getState().tripId).toBe("");
      });
    });

    describe("setChallengeId", () => {
      it("should set challenge id", () => {
        const { setChallengeId } = judgementStore.getState();
        setChallengeId("challenge-123");

        expect(judgementStore.getState().challengeId).toBe("challenge-123");
      });

      it("should update challenge id", () => {
        const { setChallengeId } = judgementStore.getState();
        setChallengeId("challenge-123");
        setChallengeId("challenge-456");

        expect(judgementStore.getState().challengeId).toBe("challenge-456");
      });
    });

    describe("addDismissedId", () => {
      it("should add dismissed id", () => {
        const { addDismissedId } = judgementStore.getState();
        addDismissedId("submission-1");

        expect(judgementStore.getState().dismissedIds).toEqual(["submission-1"]);
      });

      it("should add multiple dismissed ids", () => {
        const { addDismissedId } = judgementStore.getState();
        addDismissedId("submission-1");
        addDismissedId("submission-2");
        addDismissedId("submission-3");

        expect(judgementStore.getState().dismissedIds).toEqual([
          "submission-1",
          "submission-2",
          "submission-3",
        ]);
      });

      it("should not add duplicate ids", () => {
        const { addDismissedId } = judgementStore.getState();
        addDismissedId("submission-1");
        addDismissedId("submission-1");

        expect(judgementStore.getState().dismissedIds).toEqual(["submission-1"]);
      });

      it("should handle multiple duplicates correctly", () => {
        const { addDismissedId } = judgementStore.getState();
        addDismissedId("submission-1");
        addDismissedId("submission-2");
        addDismissedId("submission-1");
        addDismissedId("submission-2");
        addDismissedId("submission-3");

        expect(judgementStore.getState().dismissedIds).toEqual([
          "submission-1",
          "submission-2",
          "submission-3",
        ]);
      });
    });

    describe("removeDismissedId", () => {
      it("should remove dismissed id", () => {
        const { addDismissedId, removeDismissedId } = judgementStore.getState();
        addDismissedId("submission-1");
        addDismissedId("submission-2");
        removeDismissedId("submission-1");

        expect(judgementStore.getState().dismissedIds).toEqual(["submission-2"]);
      });

      it("should handle removing non-existent id", () => {
        const { addDismissedId, removeDismissedId } = judgementStore.getState();
        addDismissedId("submission-1");
        removeDismissedId("submission-999");

        expect(judgementStore.getState().dismissedIds).toEqual(["submission-1"]);
      });

      it("should handle removing from empty array", () => {
        const { removeDismissedId } = judgementStore.getState();
        removeDismissedId("submission-1");

        expect(judgementStore.getState().dismissedIds).toEqual([]);
      });

      it("should remove all ids one by one", () => {
        const { addDismissedId, removeDismissedId } = judgementStore.getState();
        addDismissedId("submission-1");
        addDismissedId("submission-2");
        addDismissedId("submission-3");

        removeDismissedId("submission-2");
        expect(judgementStore.getState().dismissedIds).toEqual(["submission-1", "submission-3"]);

        removeDismissedId("submission-1");
        expect(judgementStore.getState().dismissedIds).toEqual(["submission-3"]);

        removeDismissedId("submission-3");
        expect(judgementStore.getState().dismissedIds).toEqual([]);
      });
    });

    describe("resetDismissedIds", () => {
      it("should reset dismissed ids to empty array", () => {
        const { addDismissedId, resetDismissedIds } = judgementStore.getState();
        addDismissedId("submission-1");
        addDismissedId("submission-2");

        resetDismissedIds();

        expect(judgementStore.getState().dismissedIds).toEqual([]);
      });

      it("should handle reset on empty array", () => {
        const { resetDismissedIds } = judgementStore.getState();
        resetDismissedIds();

        expect(judgementStore.getState().dismissedIds).toEqual([]);
      });
    });
  });

  describe("complex interactions", () => {
    it("should handle complete judgement workflow", () => {
      const state = judgementStore.getState();

      state.setTripId("trip-abc");
      state.setChallengeId("challenge-xyz");

      expect(judgementStore.getState().tripId).toBe("trip-abc");
      expect(judgementStore.getState().challengeId).toBe("challenge-xyz");

      state.addDismissedId("submission-1");
      state.addDismissedId("submission-2");
      state.addDismissedId("submission-3");

      expect(judgementStore.getState().dismissedIds).toEqual([
        "submission-1",
        "submission-2",
        "submission-3",
      ]);

      state.removeDismissedId("submission-2");

      expect(judgementStore.getState().dismissedIds).toEqual(["submission-1", "submission-3"]);

      state.resetDismissedIds();

      expect(judgementStore.getState().dismissedIds).toEqual([]);
    });

    it("should handle switching trips and challenges", () => {
      const state = judgementStore.getState();

      state.setTripId("trip-1");
      state.setChallengeId("challenge-1");
      state.addDismissedId("submission-1");

      expect(judgementStore.getState().tripId).toBe("trip-1");
      expect(judgementStore.getState().challengeId).toBe("challenge-1");

      state.setTripId("trip-2");
      state.setChallengeId("challenge-2");
      state.resetDismissedIds();

      expect(judgementStore.getState().tripId).toBe("trip-2");
      expect(judgementStore.getState().challengeId).toBe("challenge-2");
      expect(judgementStore.getState().dismissedIds).toEqual([]);
    });

    it("should maintain unique dismissed ids across many additions", () => {
      const { addDismissedId } = judgementStore.getState();

      for (let i = 0; i < 5; i++) {
        addDismissedId("submission-1");
        addDismissedId("submission-2");
        addDismissedId("submission-3");
      }

      expect(judgementStore.getState().dismissedIds).toEqual([
        "submission-1",
        "submission-2",
        "submission-3",
      ]);
    });
  });
});
