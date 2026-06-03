import { describe, it, expect } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { useSponsors, useSponsorById, useTripSponsors } from "../../sponsors/useSponsors";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";

describe("useSponsors (MSW)", () => {
  it("should return all sponsors", async () => {
    const mockSponsors = [
      { id: "sponsor-1", name: "Sponsor One", logoPath: "https://example.com/logo1.png" },
      { id: "sponsor-2", name: "Sponsor Two", logoPath: "https://example.com/logo2.png" },
    ];

    server.use(createORPCHandler(["sponsor", "getAll"], () => mockSponsors));

    const { result } = renderHookWithMSW(() => useSponsors());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsors);
    expect(result.current.error).toBeNull();
  });

  it("should show loading state while fetching", async () => {
    const mockSponsors = [
      { id: "sponsor-1", name: "Sponsor One", logoPath: "https://example.com/logo1.png" },
    ];

    server.use(createORPCHandler(["sponsor", "getAll"], () => mockSponsors));

    const { result } = renderHookWithMSW(() => useSponsors());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsors);
  });

  it("should handle empty sponsors list", async () => {
    server.use(createORPCHandler(["sponsor", "getAll"], () => []));

    const { result } = renderHookWithMSW(() => useSponsors());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle sponsors with minimal data", async () => {
    const mockSponsors = [{ id: "sponsor-min", name: "Minimal Sponsor", logoPath: null }];

    server.use(createORPCHandler(["sponsor", "getAll"], () => mockSponsors));

    const { result } = renderHookWithMSW(() => useSponsors());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsors);
    expect(result.current.data![0]!.logoPath).toBeNull();
  });
});

describe("useSponsorById (MSW)", () => {
  it("should return sponsor by ID", async () => {
    const mockSponsor = {
      id: "sponsor-1",
      name: "Sponsor One",
      description: "A great sponsor",
      logoPath: "https://example.com/logo.png",
    };

    server.use(createORPCHandler(["sponsor", "getById"], () => mockSponsor));

    const { result } = renderHookWithMSW(() => useSponsorById("sponsor-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsor);
    expect(result.current.error).toBeNull();
  });

  it("should show loading state while fetching", async () => {
    const mockSponsor = {
      id: "sponsor-1",
      name: "Sponsor One",
      description: "A great sponsor",
      logoPath: "https://example.com/logo.png",
    };

    server.use(createORPCHandler(["sponsor", "getById"], () => mockSponsor));

    const { result } = renderHookWithMSW(() => useSponsorById("sponsor-1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsor);
  });

  it("should pass correct id to API", async () => {
    server.use(
      createORPCHandler(["sponsor", "getById"], (input) => {
        const typedInput = input as { id: string };
        return {
          id: typedInput.id,
          name: "Sponsor for ID",
          description: "Resolved sponsor",
          logoPath: "https://example.com/logo.png",
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useSponsorById("sponsor-456"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.id).toBe("sponsor-456");
  });

  it("should not fetch sponsor by ID when id is empty", async () => {
    const { result } = renderHookWithMSW(() => useSponsorById(""));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should handle sponsor with null fields", async () => {
    const mockSponsor = {
      id: "sponsor-null",
      name: "Null Sponsor",
      description: null,
      logoPath: null,
    };

    server.use(createORPCHandler(["sponsor", "getById"], () => mockSponsor));

    const { result } = renderHookWithMSW(() => useSponsorById("sponsor-null"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsor);
    expect(result.current.data!.description).toBeNull();
    expect(result.current.data!.logoPath).toBeNull();
  });
});

describe("useTripSponsors (MSW)", () => {
  it("should return sponsors for a trip", async () => {
    const mockSponsors = [
      { id: "sponsor-1", name: "Trip Sponsor", logoPath: "gold.png" },
      { id: "sponsor-2", name: "Another Sponsor", logoPath: "silver.png" },
    ];

    server.use(createORPCHandler(["sponsor", "getByTripId"], () => mockSponsors));

    const { result } = renderHookWithMSW(() => useTripSponsors("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsors);
    expect(result.current.error).toBeNull();
  });

  it("should show loading state while fetching", async () => {
    const mockSponsors = [{ id: "sponsor-1", name: "Trip Sponsor", logoPath: "gold.png" }];

    server.use(createORPCHandler(["sponsor", "getByTripId"], () => mockSponsors));

    const { result } = renderHookWithMSW(() => useTripSponsors("trip-1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSponsors);
  });

  it("should pass correct tripId to API", async () => {
    server.use(
      createORPCHandler(["sponsor", "getByTripId"], (input) => {
        const typedInput = input as { tripId: string };
        return [
          {
            id: "sponsor-trip",
            name: `Sponsors for ${typedInput.tripId}`,
            logoPath: "gold.png",
          },
        ];
      }),
    );

    const { result } = renderHookWithMSW(() => useTripSponsors("trip-789"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]!.name).toBe("Sponsors for trip-789");
  });

  it("should not fetch trip sponsors when tripId is empty", async () => {
    const { result } = renderHookWithMSW(() => useTripSponsors(""));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should handle empty sponsors list for a trip", async () => {
    server.use(createORPCHandler(["sponsor", "getByTripId"], () => []));

    const { result } = renderHookWithMSW(() => useTripSponsors("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle sponsors with varying tiers", async () => {
    const mockSponsors = [
      { id: "sponsor-1", name: "Gold Sponsor", logoPath: "gold.png" },
      { id: "sponsor-2", name: "Silver Sponsor", logoPath: "silver.png" },
      { id: "sponsor-3", name: "Bronze Sponsor", logoPath: "bronze.png" },
    ];

    server.use(createORPCHandler(["sponsor", "getByTripId"], () => mockSponsors));

    const { result } = renderHookWithMSW(() => useTripSponsors("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0]!.logoPath).toBe("gold.png");
    expect(result.current.data![1]!.logoPath).toBe("silver.png");
    expect(result.current.data![2]!.logoPath).toBe("bronze.png");
  });
});
