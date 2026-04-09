import { describe, expect, test, beforeEach } from "bun:test";
import {
  judgementStore,
  type Submission,
  type ReviewStatus,
} from "../judgementStore";

const resetStore = () => {
  judgementStore.setState({
    tripId: "",
    challengeId: "",
    dismissedIds: [],
  });
};

beforeEach(() => {
  resetStore();
});

const createMockSubmission = (
  overrides: Partial<Submission> = {},
): Submission => ({
  id: "submission-123",
  status: "PENDING",
  imageIds: ["img-1", "img-2"],
  videoId: null,
  textContent: "Test submission content",
  latitude: 52.2297,
  longitude: 21.0122,
  createdAt: "2024-01-01T00:00:00Z",
  group: {
    id: "group-123",
    name: "Test Group",
    description: "A test group",
    image: null,
  },
  ...overrides,
});

describe("[UNIT] judgementStore initial state", () => {
  test("has correct initial state values", () => {
    const state = judgementStore.getState();
    expect(state.tripId).toBe("");
    expect(state.challengeId).toBe("");
    expect(state.dismissedIds).toEqual([]);
  });
});

describe("[UNIT] judgementStore setTripId action", () => {
  test("sets tripId to provided value", () => {
    const { setTripId } = judgementStore.getState();

    setTripId("trip-456");

    const state = judgementStore.getState();
    expect(state.tripId).toBe("trip-456");
  });

  test("updates tripId when changed", () => {
    const { setTripId } = judgementStore.getState();

    setTripId("trip-1");
    expect(judgementStore.getState().tripId).toBe("trip-1");

    setTripId("trip-2");
    expect(judgementStore.getState().tripId).toBe("trip-2");
  });

  test("accepts empty string", () => {
    const { setTripId } = judgementStore.getState();

    setTripId("trip-123");
    expect(judgementStore.getState().tripId).toBe("trip-123");

    setTripId("");
    expect(judgementStore.getState().tripId).toBe("");
  });
});

describe("[UNIT] judgementStore setChallengeId action", () => {
  test("sets challengeId to provided value", () => {
    const { setChallengeId } = judgementStore.getState();

    setChallengeId("challenge-789");

    const state = judgementStore.getState();
    expect(state.challengeId).toBe("challenge-789");
  });

  test("updates challengeId when changed", () => {
    const { setChallengeId } = judgementStore.getState();

    setChallengeId("challenge-1");
    expect(judgementStore.getState().challengeId).toBe("challenge-1");

    setChallengeId("challenge-2");
    expect(judgementStore.getState().challengeId).toBe("challenge-2");
  });

  test("accepts empty string", () => {
    const { setChallengeId } = judgementStore.getState();

    setChallengeId("challenge-123");
    expect(judgementStore.getState().challengeId).toBe("challenge-123");

    setChallengeId("");
    expect(judgementStore.getState().challengeId).toBe("");
  });
});

describe("[UNIT] judgementStore addDismissedId action", () => {
  test("adds a dismissed id to empty list", () => {
    const { addDismissedId } = judgementStore.getState();

    addDismissedId("submission-1");

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual(["submission-1"]);
  });

  test("adds multiple dismissed ids", () => {
    const { addDismissedId } = judgementStore.getState();

    addDismissedId("submission-1");
    addDismissedId("submission-2");
    addDismissedId("submission-3");

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual([
      "submission-1",
      "submission-2",
      "submission-3",
    ]);
  });

  test("does not add duplicate ids", () => {
    const { addDismissedId } = judgementStore.getState();

    addDismissedId("submission-1");
    addDismissedId("submission-1");
    addDismissedId("submission-2");

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual(["submission-1", "submission-2"]);
  });

  test("handles many unique ids", () => {
    const { addDismissedId } = judgementStore.getState();

    for (let i = 0; i < 100; i++) {
      addDismissedId(`submission-${i}`);
    }

    const state = judgementStore.getState();
    expect(state.dismissedIds).toHaveLength(100);
    expect(state.dismissedIds[0]).toBe("submission-0");
    expect(state.dismissedIds[99]).toBe("submission-99");
  });
});

describe("[UNIT] judgementStore removeDismissedId action", () => {
  test("removes an id from the list", () => {
    const { addDismissedId, removeDismissedId } = judgementStore.getState();

    addDismissedId("submission-1");
    addDismissedId("submission-2");
    addDismissedId("submission-3");

    removeDismissedId("submission-2");

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual(["submission-1", "submission-3"]);
  });

  test("removes the only id in the list", () => {
    const { addDismissedId, removeDismissedId } = judgementStore.getState();

    addDismissedId("submission-1");
    removeDismissedId("submission-1");

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual([]);
  });

  test("does nothing when removing non-existent id", () => {
    const { addDismissedId, removeDismissedId } = judgementStore.getState();

    addDismissedId("submission-1");
    addDismissedId("submission-2");

    removeDismissedId("non-existent-id");

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual(["submission-1", "submission-2"]);
  });

  test("handles removal from empty list", () => {
    const { removeDismissedId } = judgementStore.getState();

    removeDismissedId("any-id");

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual([]);
  });
});

describe("[UNIT] judgementStore resetDismissedIds action", () => {
  test("clears all dismissed ids", () => {
    const { addDismissedId, resetDismissedIds } = judgementStore.getState();

    addDismissedId("submission-1");
    addDismissedId("submission-2");
    addDismissedId("submission-3");

    expect(judgementStore.getState().dismissedIds).toHaveLength(3);

    resetDismissedIds();

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual([]);
  });

  test("works on already empty list", () => {
    const { resetDismissedIds } = judgementStore.getState();

    resetDismissedIds();

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual([]);
  });
});

describe("[UNIT] judgementStore state combinations", () => {
  test("maintains independent tripId and challengeId", () => {
    const { setTripId, setChallengeId } = judgementStore.getState();

    setTripId("trip-123");
    setChallengeId("challenge-456");

    const state = judgementStore.getState();
    expect(state.tripId).toBe("trip-123");
    expect(state.challengeId).toBe("challenge-456");
  });

  test("allows partial updates", () => {
    const { setTripId, setChallengeId, addDismissedId } =
      judgementStore.getState();

    setTripId("trip-123");
    addDismissedId("submission-1");

    const state1 = judgementStore.getState();
    expect(state1.tripId).toBe("trip-123");
    expect(state1.challengeId).toBe("");
    expect(state1.dismissedIds).toEqual(["submission-1"]);

    setChallengeId("challenge-456");

    const state2 = judgementStore.getState();
    expect(state2.tripId).toBe("trip-123");
    expect(state2.challengeId).toBe("challenge-456");
    expect(state2.dismissedIds).toEqual(["submission-1"]);
  });
});

describe("[UNIT] judgementStore voting workflow simulation", () => {
  test("simulates complete voting session", () => {
    const state = judgementStore.getState();

    // Setup judging session
    state.setTripId("trip-abc");
    state.setChallengeId("challenge-def");

    // Dismiss some submissions
    state.addDismissedId("submission-1");
    state.addDismissedId("submission-2");

    // User changes mind - undismiss one
    state.removeDismissedId("submission-2");

    // Continue dismissing more
    state.addDismissedId("submission-3");
    state.addDismissedId("submission-4");

    const midState = judgementStore.getState();
    expect(midState.tripId).toBe("trip-abc");
    expect(midState.challengeId).toBe("challenge-def");
    expect(midState.dismissedIds).toEqual([
      "submission-1",
      "submission-3",
      "submission-4",
    ]);

    // Reset for next challenge
    state.resetDismissedIds();
    state.setChallengeId("challenge-ghi");

    const finalState = judgementStore.getState();
    expect(finalState.challengeId).toBe("challenge-ghi");
    expect(finalState.dismissedIds).toEqual([]);
  });

  test("handles rapid add/remove cycles", () => {
    const { addDismissedId, removeDismissedId } = judgementStore.getState();

    const id = "submission-flip";

    // Rapidly add and remove same id
    addDismissedId(id);
    removeDismissedId(id);
    addDismissedId(id);
    removeDismissedId(id);
    addDismissedId(id);

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual([id]);
  });
});

describe("[UNIT] judgementStore edge cases", () => {
  test("handles special characters in ids", () => {
    const { addDismissedId } = judgementStore.getState();

    const specialIds = [
      "sub-with-dashes",
      "sub_with_underscores",
      "sub.with.dots",
      "sub:with:colons",
      "sub/with/slashes",
      "sub[with]brackets",
    ];

    specialIds.forEach((id) => addDismissedId(id));

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual(specialIds);
  });

  test("handles very long ids", () => {
    const { addDismissedId } = judgementStore.getState();

    const longId = "a".repeat(1000);
    addDismissedId(longId);

    const state = judgementStore.getState();
    expect(state.dismissedIds).toContain(longId);
    expect(state.dismissedIds).toHaveLength(1);
  });

  test("handles unicode ids", () => {
    const { addDismissedId } = judgementStore.getState();

    const unicodeIds = ["📝-submission", "提交-123", "π-submission"];

    unicodeIds.forEach((id) => addDismissedId(id));

    const state = judgementStore.getState();
    expect(state.dismissedIds).toEqual(unicodeIds);
  });
});
