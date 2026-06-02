import { describe, it, expect, beforeEach } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { useTripResources } from "../../trips/useTripResources";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, HttpResponse } from "../../../test-utils/msw/server";

const TRIP_RESOURCE_TYPES = {
  HERO_IMAGE: "hero_image",
  MAP_BG_IMAGE: "map_bg_image",
  INTERACTIVE_MAP: "interactive_map",
  PDF_MAP: "pdf_map",
  INFOPACK: "infopack",
  WHATSAPP: "whatsapp",
  SOS: "sos",
} as const;

describe("useTripResources (MSW)", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it("should return initial state when no tripId provided", async () => {
    const { result } = renderHookWithMSW(() => useTripResources(null));

    expect(result.current.resources).toEqual([]);
    expect(result.current.insurance).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should return empty resources when data is null", async () => {
    server.use(
      createORPCHandler(["trip", "getResources"], () => null),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.resources).toEqual([]);
    expect(result.current.insurance).toBeNull();
  });

  it("should return resources from API", async () => {
    const resourcesData = {
      resources: [
        { id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" },
        { id: "res-2", type: TRIP_RESOURCE_TYPES.PDF_MAP, url: "https://example.com/map.pdf" },
        { id: "res-3", type: TRIP_RESOURCE_TYPES.WHATSAPP, url: "https://chat.whatsapp.com/group" },
      ],
      insurance: {
        id: "ins-1",
        provider: "Insurance Co",
        policyNumber: "POL123456",
      },
    };

    server.use(
      createORPCHandler(["trip", "getResources"], () => resourcesData),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.resources).toHaveLength(3);
    expect(result.current.resources[0]!.type).toBe(TRIP_RESOURCE_TYPES.HERO_IMAGE);
    expect(result.current.insurance).toEqual(resourcesData.insurance);
  });

  it("should indicate loading state", async () => {
    server.use(
      createORPCHandler(["trip", "getResources"], () => ({
        resources: [],
        insurance: null,
      })),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle error state", async () => {
    server.use(
      createORPCHandler(["trip", "getResources"], () => {
        throw new Error("Failed to fetch resources");
      }),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });

  it("should call refetch when requested", async () => {
    let callCount = 0;

    server.use(
      createORPCHandler(["trip", "getResources"], () => {
        callCount++;
        return {
          resources: [{ id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" }],
          insurance: null,
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(callCount).toBe(1);

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(callCount).toBe(2);
  });

  it("should get resource by type using getResource helper", async () => {
    const resourcesData = {
      resources: [
        { id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" },
        { id: "res-2", type: TRIP_RESOURCE_TYPES.PDF_MAP, url: "https://example.com/map.pdf" },
      ],
      insurance: null,
    };

    server.use(
      createORPCHandler(["trip", "getResources"], () => resourcesData),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.resources).toHaveLength(2);
    });

    const heroImage = result.current.getResource("HERO_IMAGE");
    expect(heroImage).toBeTruthy();
    expect(heroImage?.id).toBe("res-1");

    const pdfMap = result.current.getResource("PDF_MAP");
    expect(pdfMap).toBeTruthy();
    expect(pdfMap?.id).toBe("res-2");
  });

  it("should return null when resource type not found", async () => {
    const resourcesData = {
      resources: [
        { id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" },
      ],
      insurance: null,
    };

    server.use(
      createORPCHandler(["trip", "getResources"], () => resourcesData),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.resources).toHaveLength(1);
    });

    const notFound = result.current.getResource("SOS");
    expect(notFound).toBeNull();
  });

  it("should return null from getResource when no resources data", async () => {
    server.use(
      createORPCHandler(["trip", "getResources"], () => null),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const resource = result.current.getResource("HERO_IMAGE");
    expect(resource).toBeNull();
  });

  it("should handle all resource types", async () => {
    const resourcesData = {
      resources: [
        { id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" },
        {
          id: "res-2",
          type: TRIP_RESOURCE_TYPES.MAP_BG_IMAGE,
          url: "https://example.com/map-bg.jpg",
        },
        {
          id: "res-3",
          type: TRIP_RESOURCE_TYPES.INTERACTIVE_MAP,
          url: "https://example.com/interactive",
        },
        { id: "res-4", type: TRIP_RESOURCE_TYPES.PDF_MAP, url: "https://example.com/map.pdf" },
        {
          id: "res-5",
          type: TRIP_RESOURCE_TYPES.INFOPACK,
          url: "https://example.com/infopack.pdf",
        },
        { id: "res-6", type: TRIP_RESOURCE_TYPES.WHATSAPP, url: "https://chat.whatsapp.com/group" },
        { id: "res-7", type: TRIP_RESOURCE_TYPES.SOS, url: "tel:+1234567890" },
      ],
      insurance: {
        id: "ins-1",
        provider: "Test Insurance",
        policyNumber: "TEST123",
      },
    };

    server.use(
      createORPCHandler(["trip", "getResources"], () => resourcesData),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.resources).toHaveLength(7);
    });

    expect(result.current.getResource("HERO_IMAGE")!.type).toBe(TRIP_RESOURCE_TYPES.HERO_IMAGE);
    expect(result.current.getResource("MAP_BG_IMAGE")!.type).toBe(TRIP_RESOURCE_TYPES.MAP_BG_IMAGE);
    expect(result.current.getResource("INTERACTIVE_MAP")!.type).toBe(
      TRIP_RESOURCE_TYPES.INTERACTIVE_MAP,
    );
    expect(result.current.getResource("PDF_MAP")!.type).toBe(TRIP_RESOURCE_TYPES.PDF_MAP);
    expect(result.current.getResource("INFOPACK")!.type).toBe(TRIP_RESOURCE_TYPES.INFOPACK);
    expect(result.current.getResource("WHATSAPP")!.type).toBe(TRIP_RESOURCE_TYPES.WHATSAPP);
    expect(result.current.getResource("SOS")!.type).toBe(TRIP_RESOURCE_TYPES.SOS);
  });

  it("should disable query when tripId is empty string", async () => {
    server.use(
      createORPCHandler(["trip", "getResources"], () => {
        throw new Error("Should not be called");
      }),
    );

    const { result } = renderHookWithMSW(() => useTripResources(""));

    // Should not be loading since query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.resources).toEqual([]);
    expect(result.current.insurance).toBeNull();
  });

  it("should enable query when tripId is provided", async () => {
    const resourcesData = {
      resources: [{ id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" }],
      insurance: null,
    };

    server.use(
      createORPCHandler(["trip", "getResources"], () => resourcesData),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    // Should start loading since query is enabled
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.resources).toHaveLength(1);
  });

  it("should handle resources with missing insurance data", async () => {
    const resourcesData = {
      resources: [
        { id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" },
      ],
      insurance: null,
    };

    server.use(
      createORPCHandler(["trip", "getResources"], () => resourcesData),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.insurance).toBeNull();
    expect(result.current.resources).toHaveLength(1);
  });

  it("should handle empty resources array", async () => {
    const resourcesData = {
      resources: [],
      insurance: null,
    };

    server.use(
      createORPCHandler(["trip", "getResources"], () => resourcesData),
    );

    const { result } = renderHookWithMSW(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.resources).toEqual([]);

    const resource = result.current.getResource("HERO_IMAGE");
    expect(resource).toBeNull();
  });
});
