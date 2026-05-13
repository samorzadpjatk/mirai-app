import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useTripResources } from "../../trips/useTripResources";

const TRIP_RESOURCE_TYPES = {
  HERO_IMAGE: "hero_image",
  MAP_BG_IMAGE: "map_bg_image",
  INTERACTIVE_MAP: "interactive_map",
  PDF_MAP: "pdf_map",
  INFOPACK: "infopack",
  WHATSAPP: "whatsapp",
  SOS: "sos",
} as const;

jest.mock("@mirai-app/shared", () => ({
  TRIP_RESOURCE_TYPES: {
    HERO_IMAGE: "hero_image",
    MAP_BG_IMAGE: "map_bg_image",
    INTERACTIVE_MAP: "interactive_map",
    PDF_MAP: "pdf_map",
    INFOPACK: "infopack",
    WHATSAPP: "whatsapp",
    SOS: "sos",
  },
}));

interface MockQueryOptions {
  input: {
    tripId: string;
  };
  enabled?: boolean;
}

interface MockQueryResult {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: jest.Mock;
}

const mockUseQuery = jest.fn<(options?: MockQueryOptions) => MockQueryResult>();

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    trip: {
      getResources: {
        queryOptions: jest.fn(({ input, enabled }: MockQueryOptions) => ({
          queryKey: ["trip", "getResources", input.tripId],
          enabled: enabled ?? true,
        })),
      },
    },
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: [MockQueryOptions]) => mockUseQuery(...args),
}));

describe("useTripResources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial state when no tripId provided", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources(null));

    expect(result.current.resources).toEqual([]);
    expect(result.current.insurance).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should return empty resources when data is null", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

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

    mockUseQuery.mockReturnValue({
      data: resourcesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.resources).toHaveLength(3);
    });

    expect(result.current.resources[0]!.type).toBe(TRIP_RESOURCE_TYPES.HERO_IMAGE);
    expect(result.current.insurance).toEqual(resourcesData.insurance);
  });

  it("should indicate loading state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle error state", () => {
    const error = new Error("Failed to fetch resources");

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
  });

  it("should call refetch when requested", async () => {
    const refetch = jest.fn();

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

    await result.current.refetch();

    expect(refetch).toHaveBeenCalled();
  });

  it("should get resource by type using getResource helper", async () => {
    const resourcesData = {
      resources: [
        { id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" },
        { id: "res-2", type: TRIP_RESOURCE_TYPES.PDF_MAP, url: "https://example.com/map.pdf" },
      ],
      insurance: null,
    };

    mockUseQuery.mockReturnValue({
      data: resourcesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

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

    mockUseQuery.mockReturnValue({
      data: resourcesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.resources).toHaveLength(1);
    });

    const notFound = result.current.getResource("SOS");
    expect(notFound).toBeNull();
  });

  it("should return null from getResource when no resources data", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

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

    mockUseQuery.mockReturnValue({
      data: resourcesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

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

  it("should disable query when tripId is empty string", () => {
    let capturedOptions: MockQueryOptions = { input: { tripId: "" } };

    mockUseQuery.mockImplementation((options?: MockQueryOptions): MockQueryResult => {
      capturedOptions = options ?? { input: { tripId: "" } };
      return {
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    renderHook(() => useTripResources(""));

    expect(capturedOptions.enabled).toBe(false);
  });

  it("should enable query when tripId is provided", () => {
    let capturedOptions: MockQueryOptions = { input: { tripId: "" } };

    mockUseQuery.mockImplementation((options?: MockQueryOptions): MockQueryResult => {
      capturedOptions = options ?? { input: { tripId: "" } };
      return {
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    renderHook(() => useTripResources("trip-1"));

    expect(capturedOptions.enabled).toBe(true);
  });

  it("should handle resources with missing insurance data", async () => {
    const resourcesData = {
      resources: [
        { id: "res-1", type: TRIP_RESOURCE_TYPES.HERO_IMAGE, url: "https://example.com/hero.jpg" },
      ],
      insurance: null,
    };

    mockUseQuery.mockReturnValue({
      data: resourcesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.insurance).toBeNull();
    });

    expect(result.current.resources).toHaveLength(1);
  });

  it("should handle empty resources array", async () => {
    const resourcesData = {
      resources: [],
      insurance: null,
    };

    mockUseQuery.mockReturnValue({
      data: resourcesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTripResources("trip-1"));

    await waitFor(() => {
      expect(result.current.resources).toEqual([]);
    });

    const resource = result.current.getResource("HERO_IMAGE");
    expect(resource).toBeNull();
  });
});
