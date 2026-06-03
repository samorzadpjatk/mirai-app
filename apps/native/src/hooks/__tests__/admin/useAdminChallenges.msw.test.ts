import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import {
  buildChallengeStats,
  buildCreateChallengeInput,
  transformRawChallenge,
  useAdminChallenges,
} from "../../admin/useAdminChallenges";
import type { AdminChallengeUI } from "../../admin/useAdminChallenges";

describe("useAdminChallenges (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return loading state initially", async () => {
    server.use(
      createORPCHandler(
        ["challenge", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.challenges).toEqual([]);
  });

  it("should return challenges from API", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Photo Challenge",
        title: "Photo Challenge",
        description: "Take a great photo",
        points: 100,
        category: "standard",
        icon: "camera",
        status: "active",
        tripId: "trip-123",
      },
      {
        id: "challenge-2",
        name: "Wintegral Task",
        title: "Wintegral Task",
        description: "Complete the wintegral",
        points: 200,
        category: "wintegral",
        icon: "star",
        status: "active",
        tripId: "trip-123",
      },
    ];

    server.use(createORPCHandler(["challenge", "getAll"], () => mockChallenges));

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(2);
    expect(result.current.challenges[0]!.id).toBe("challenge-1");
    expect(result.current.challenges[0]!.title).toBe("Photo Challenge");
    expect(result.current.challenges[1]!.category).toBe("wintegral");
  });

  it("should handle challenges with null values", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: null,
        title: null,
        description: null,
        points: null,
        category: null,
        icon: null,
        status: null,
        tripId: "trip-123",
      },
    ];

    server.use(createORPCHandler(["challenge", "getAll"], () => mockChallenges));

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges[0]!.title).toBe("");
    expect(result.current.challenges[0]!.description).toBe("");
    expect(result.current.challenges[0]!.points).toBe(0);
    expect(result.current.challenges[0]!.category).toBe("standard");
    expect(result.current.challenges[0]!.icon).toBe("star");
    expect(result.current.challenges[0]!.status).toBe("active");
  });

  it("should calculate stats correctly", async () => {
    const mockChallenges = [
      { id: "1", name: "C1", status: "active", category: "standard" },
      { id: "2", name: "C2", status: "active", category: "wintegral" },
      { id: "3", name: "C3", status: "inactive", category: "wintegral" },
      { id: "4", name: "C4", status: "active", category: "special" },
    ];

    server.use(createORPCHandler(["challenge", "getAll"], () => mockChallenges));

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.activeChallenges).toBe(3);
    expect(result.current.stats.wintegralChallenges).toBe(2);
  });

  it("should create challenge", async () => {
    server.use(
      createORPCHandler(["challenge", "getAll"], () => []),
      createORPCHandler(["challenge", "create"], (data) => {
        expect(data).toMatchObject({
          tripId: "trip-123",
          name: "New Challenge",
          description: "Description",
          submissionType: "IMAGE",
          scoringCategory: "JUDGED_STAFF",
          targetLatitude: 52.2297,
          targetLongitude: 21.0122,
        });
        return { id: "challenge-new", name: "New Challenge" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createChallenge({
        tripId: "trip-123",
        title: "New Challenge",
        description: "Description",
        submissionType: "IMAGE",
        scoringCategory: "JUDGED_STAFF",
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
      });
    });
  });

  it("should convert MULTI_IMAGE submission type to IMAGE", async () => {
    server.use(
      createORPCHandler(["challenge", "getAll"], () => []),
      createORPCHandler(["challenge", "create"], (data) => {
        expect(data.submissionType).toBe("IMAGE");
        return { id: "challenge-new", name: "New Challenge" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createChallenge({
        tripId: "trip-123",
        title: "New Challenge",
        submissionType: "MULTI_IMAGE",
      });
    });
  });

  it("should update challenge", async () => {
    server.use(
      createORPCHandler(["challenge", "getAll"], () => []),
      createORPCHandler(["challenge", "update"], (data) => {
        expect(data).toMatchObject({
          id: "challenge-1",
          tripId: "trip-123",
          name: "Updated Challenge",
          description: "Updated Description",
        });
        return { id: "challenge-1", name: "Updated Challenge" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateChallenge("challenge-1", {
        tripId: "trip-123",
        title: "Updated Challenge",
        description: "Updated Description",
      });
    });
  });

  it("should delete challenge", async () => {
    server.use(
      createORPCHandler(["challenge", "getAll"], () => []),
      createORPCHandler(["challenge", "delete"], ({ id, tripId }) => {
        expect(id).toBe("challenge-1");
        expect(tripId).toBe("trip-123");
        return { id: "challenge-1" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteChallenge("challenge-1", "trip-123");
    });
  });

  it("should indicate loading states for mutations", async () => {
    server.use(
      createORPCHandler(["challenge", "getAll"], () => []),
      createORPCHandler(
        ["challenge", "create"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["challenge", "update"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["challenge", "delete"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.createChallenge({ tripId: "trip-123", title: "Test" }).catch(() => {
      /* no-op */
    });
    result.current
      .updateChallenge("challenge-1", { tripId: "trip-123", title: "Updated" })
      .catch(() => {
        /* no-op */
      });
    result.current.deleteChallenge("challenge-1", "trip-123").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(true);
      expect(result.current.isUpdating).toBe(true);
      expect(result.current.isDeleting).toBe(true);
    });
  });

  it("should handle empty challenges array", async () => {
    server.use(createORPCHandler(["challenge", "getAll"], () => []));

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toEqual([]);
    expect(result.current.stats.activeChallenges).toBe(0);
    expect(result.current.stats.wintegralChallenges).toBe(0);
  });

  it("should handle non-array data", async () => {
    server.use(createORPCHandler(["challenge", "getAll"], () => null));

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toEqual([]);
  });

  it("should use default submission type and scoring category", async () => {
    server.use(
      createORPCHandler(["challenge", "getAll"], () => []),
      createORPCHandler(["challenge", "create"], (data) => {
        expect(data.submissionType).toBe("IMAGE");
        expect(data.scoringCategory).toBe("JUDGED_STAFF");
        return { id: "challenge-new", name: "New Challenge" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createChallenge({
        tripId: "trip-123",
        title: "New Challenge",
      });
    });
  });
});

describe("transformRawChallenge", () => {
  it("should transform a complete raw challenge", () => {
    const raw = {
      id: "c1",
      tripId: "trip-1",
      name: "Photo Challenge",
      title: "Photo",
      description: "Take a photo",
      points: 100,
      category: "standard",
      icon: "camera",
      status: "active",
    };

    const result = transformRawChallenge(raw);

    expect(result.id).toBe("c1");
    expect(result.title).toBe("Photo Challenge");
    expect(result.description).toBe("Take a photo");
    expect(result.points).toBe(100);
    expect(result.category).toBe("standard");
    expect(result.icon).toBe("camera");
    expect(result.status).toBe("active");
    expect(result.submissionType).toBe("IMAGE");
    expect(result.scoringCategory).toBe("JUDGED_STAFF");
  });

  it("should use title when name is null", () => {
    const raw = {
      id: "c1",
      tripId: "trip-1",
      name: null,
      title: "Photo",
      description: null,
      points: null,
      category: null,
      icon: null,
      status: null,
    };

    const result = transformRawChallenge(raw);

    expect(result.title).toBe("Photo");
    expect(result.description).toBe("");
    expect(result.points).toBe(0);
    expect(result.category).toBe("standard");
    expect(result.icon).toBe("star");
    expect(result.status).toBe("active");
  });

  it("should use defaults when all optional fields are null", () => {
    const raw = {
      id: "c1",
      tripId: "trip-1",
      name: null,
      title: null,
      description: null,
      points: null,
      category: null,
      icon: null,
      status: null,
    };

    const result = transformRawChallenge(raw);

    expect(result.title).toBe("");
    expect(result.points).toBe(0);
  });
});

describe("buildCreateChallengeInput", () => {
  it("should build input with all fields", () => {
    const payload = {
      tripId: "trip-1",
      title: "Challenge",
      description: "Desc",
      submissionType: "IMAGE" as const,
      scoringCategory: "JUDGED_STAFF" as const,
      targetLatitude: 52.0,
      targetLongitude: 21.0,
    };

    const result = buildCreateChallengeInput(payload);

    expect(result).toEqual({
      tripId: "trip-1",
      name: "Challenge",
      description: "Desc",
      submissionType: "IMAGE",
      scoringCategory: "JUDGED_STAFF",
      targetLatitude: 52.0,
      targetLongitude: 21.0,
    });
  });

  it("should convert MULTI_IMAGE to IMAGE", () => {
    const result = buildCreateChallengeInput({
      tripId: "trip-1",
      submissionType: "MULTI_IMAGE",
    });

    expect(result.submissionType).toBe("IMAGE");
  });

  it("should use defaults when optional fields are missing", () => {
    const result = buildCreateChallengeInput({ tripId: "trip-1" });

    expect(result.name).toBe("");
    expect(result.description).toBe("");
    expect(result.submissionType).toBe("IMAGE");
    expect(result.scoringCategory).toBe("JUDGED_STAFF");
    expect(result.targetLatitude).toBeUndefined();
    expect(result.targetLongitude).toBeUndefined();
  });
});

describe("buildChallengeStats", () => {
  it("should count active and wintegral challenges", () => {
    const challenges: AdminChallengeUI[] = [
      { id: "1", title: "C1", status: "active", category: "wintegral" } as AdminChallengeUI,
      { id: "2", title: "C2", status: "active", category: "standard" } as AdminChallengeUI,
      { id: "3", title: "C3", status: "inactive", category: "wintegral" } as AdminChallengeUI,
    ];

    const result = buildChallengeStats(challenges);

    expect(result.activeChallenges).toBe(2);
    expect(result.wintegralChallenges).toBe(2);
  });

  it("should return zeros for empty array", () => {
    const result = buildChallengeStats([]);

    expect(result.activeChallenges).toBe(0);
    expect(result.wintegralChallenges).toBe(0);
  });
});
