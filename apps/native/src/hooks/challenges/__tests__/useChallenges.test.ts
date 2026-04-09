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
  test("hook accepts challengeId and tripId parameters", async () => {
    const { useChallengeDetails } = await import("../useChallengeDetails");
    expect(useChallengeDetails.length).toBe(2);
  });
});

describe("useChallengeCapture", () => {
  test("module exports useChallengeCapture function", async () => {
    const { useChallengeCapture } = await import("../useChallengeCapture");
    expect(useChallengeCapture).toBeDefined();
    expect(typeof useChallengeCapture).toBe("function");
  });
  test("hook accepts options object parameter", async () => {
    const { useChallengeCapture } = await import("../useChallengeCapture");
    expect(useChallengeCapture.length).toBe(1);
  });
});
