/**
 * @jest-environment node
 */

describe("useAdminChallengesByTrip", () => {
  test("module exports useAdminChallengesByTrip function", async () => {
    const { useAdminChallengesByTrip } = await import("../useAdminChallengesByTrip");
    expect(useAdminChallengesByTrip).toBeDefined();
    expect(typeof useAdminChallengesByTrip).toBe("function");
  });
});

describe("useChallengeForm", () => {
  test("module exports useChallengeForm function", async () => {
    const { useChallengeForm } = await import("../useChallengeForm");
    expect(useChallengeForm).toBeDefined();
    expect(typeof useChallengeForm).toBe("function");
  });
});

describe("useStaffVoting", () => {
  test("module exports useStaffVoting function", async () => {
    const { useStaffVoting } = await import("../useStaffVoting");
    expect(useStaffVoting).toBeDefined();
    expect(typeof useStaffVoting).toBe("function");
  });
});
