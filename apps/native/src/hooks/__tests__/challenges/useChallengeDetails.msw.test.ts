import { describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useChallengeDetails } from "../../challenges/useChallengeDetails";

describe("useChallengeDetails (MSW)", () => {
  it("should return challenge details when loaded", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Test Challenge",
      description: "A test challenge description",
      submissionType: "IMAGE",
      basePoints: 10,
      firstPlacePoints: 20,
      scoringCategory: "INDIVIDUAL",
      status: "ACTIVE",
      tripId: "trip-123",
    };

    server.use(
      createORPCHandler(["challenge", "getById"], () => mockChallenge),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "John" })),
    );

    const { result } = renderHookWithMSW(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenge).toEqual(mockChallenge);
    expect(result.current.isAssignedToUser).toBe(false);
  });

  it("should not fetch when challengeId is null", async () => {
    server.use(createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "John" })));

    const { result } = renderHookWithMSW(() => useChallengeDetails(null, "trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenge).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should not fetch when tripId is null", async () => {
    server.use(createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "John" })));

    const { result } = renderHookWithMSW(() => useChallengeDetails("challenge-123", null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenge).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should not fetch when both ids are null", async () => {
    server.use(createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "John" })));

    const { result } = renderHookWithMSW(() => useChallengeDetails(null, null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenge).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});
