/**
 * @jest-environment node
 */

describe("useChallenges", () => {
  test("module exports useChallenges function", async () => {
    const { useChallenges } = await import("../useChallenges");
    expect(useChallenges).toBeDefined();
    expect(typeof useChallenges).toBe("function");
  });
  test("hook accepts tripId parameter", async () => {
    const { useChallenges } = await import("../useChallenges");
    expect(useChallenges.length).toBe(1);
  });
});

describe("useChallengeDetails", () => {
  test("module exports useChallengeDetails function", async () => {
    const { useChallengeDetails } = await import("../useChallengeDetails");
    expect(useChallengeDetails).toBeDefined();
    expect(typeof useChallengeDetails).toBe("function");
  });
  test("hook accepts challengeId parameter", async () => {
    const { useChallengeDetails } = await import("../useChallengeDetails");
    expect(useChallengeDetails.length).toBe(1);
  });
});

describe("useChallengeCapture", () => {
  test("module exports useChallengeCapture function", async () => {
    const { useChallengeCapture } = await import("../useChallengeCapture");
    expect(useChallengeCapture).toBeDefined();
    expect(typeof useChallengeCapture).toBe("function");
  });
  test("hook accepts tripId and challengeId parameters", async () => {
    const { useChallengeCapture } = await import("../useChallengeCapture");
    expect(useChallengeCapture.length).toBe(2);
  });
});
