/**
 * @jest-environment node
 */

describe("useChallenges", () => {
  test("module exports useChallenges function", () => {
    const { useChallenges } = require("../useChallenges");
    expect(useChallenges).toBeDefined();
    expect(typeof useChallenges).toBe("function");
  });
  test("hook accepts tripId parameter", () => {
    const { useChallenges } = require("../useChallenges");
    expect(useChallenges.length).toBe(1);
  });
});

describe("useChallengeDetails", () => {
  test("module exports useChallengeDetails function", () => {
    const { useChallengeDetails } = require("../useChallengeDetails");
    expect(useChallengeDetails).toBeDefined();
    expect(typeof useChallengeDetails).toBe("function");
  });
  test("hook accepts challengeId and tripId parameters", () => {
    const { useChallengeDetails } = require("../useChallengeDetails");
    expect(useChallengeDetails.length).toBe(2);
  });
});

describe("useChallengeCapture", () => {
  test("module exports useChallengeCapture function", () => {
    const { useChallengeCapture } = require("../useChallengeCapture");
    expect(useChallengeCapture).toBeDefined();
    expect(typeof useChallengeCapture).toBe("function");
  });
  test("hook accepts options object parameter", () => {
    const { useChallengeCapture } = require("../useChallengeCapture");
    expect(useChallengeCapture.length).toBe(1);
  });
});
