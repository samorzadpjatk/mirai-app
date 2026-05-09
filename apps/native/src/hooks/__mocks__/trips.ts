import { jest } from "@jest/globals";

export const mockUseTrips = jest.fn(() => ({
  trips: [] as {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    backgroundImagePath?: string | null;
    groups?: unknown[];
  }[],
  isLoading: false,
  isRefetching: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(() => Promise.resolve()),
  isError: false,
  error: null as Error | null,
  refetch: jest.fn(() => Promise.resolve()),
}));

export const mockUseTripDetails = jest.fn((_tripId?: string | null) => ({
  currentUser: null as { id: string; firstName: string; lastName: string; role: string } | null,
  isLoadingUser: false,
  trip: null as {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    backgroundImagePath?: string | null;
    groups?: unknown[];
  } | null,
  isLoadingTrip: false,
  refetchTrip: jest.fn(() => Promise.resolve()),
  isErrorTrip: false,
  tripError: null as Error | null,
  isTripPast: false,
}));

export const mockUseSelectedTrip = jest.fn(() => ({
  selectedTripId: null as string | null,
  isLoadingSelectedTrip: false,
  setSelectedTripId: jest.fn(),
}));

export const mockUseTripResources = jest.fn((_tripId?: string | null) => ({
  resources: [] as { type: string; url: string; label?: string }[],
  insurance: null as { url: string; label?: string } | null,
  getResource: jest.fn(() => null as { type: string; url: string; label?: string } | null),
  isLoading: false,
  isError: false,
  error: null as Error | null,
  refetch: jest.fn(() => Promise.resolve()),
}));

export const useTrips = mockUseTrips;
export const useTripDetails = mockUseTripDetails;
export const useSelectedTrip = mockUseSelectedTrip;
export const useTripResources = mockUseTripResources;
