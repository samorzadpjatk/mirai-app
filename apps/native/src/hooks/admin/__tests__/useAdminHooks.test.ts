/**
 * @jest-environment node
 */

describe("useAdminChallengesByTrip", () => {
  test("module exports useAdminChallengesByTrip function", () => {
    const { useAdminChallengesByTrip } = require("../useAdminChallengesByTrip");
    expect(useAdminChallengesByTrip).toBeDefined();
    expect(typeof useAdminChallengesByTrip).toBe("function");
  });
});

describe("useChallengeForm", () => {
  test("module exports useChallengeForm function", () => {
    const { useChallengeForm } = require("../useChallengeForm");
    expect(useChallengeForm).toBeDefined();
    expect(typeof useChallengeForm).toBe("function");
  });
});

describe("useStaffVoting", () => {
  test("module exports useStaffVoting function", () => {
    const { useStaffVoting } = require("../useStaffVoting");
    expect(useStaffVoting).toBeDefined();
    expect(typeof useStaffVoting).toBe("function");
  });
});
