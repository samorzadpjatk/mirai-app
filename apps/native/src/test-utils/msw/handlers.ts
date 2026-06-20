import { createORPCHandler } from "./server";

/**
 * Default mock shapes for consolidated oRPC procedures.
 * These are intentionally minimal; tests can override fields as needed.
 */
export const defaultHomeFullResponse = {
  user: {
    id: "user-1",
    authUserId: "auth-1",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    role: "USER",
    hasAvatar: false,
  },
  trips: {
    trips: [
      {
        id: "trip-1",
        name: "Test Trip",
        description: "A test trip",
        startDate: "2025-06-01",
        endDate: "2025-06-07",
        backgroundImagePath: null,
        groups: [],
        tripSponsors: [],
      },
    ],
    pagination: {
      total: 1,
      limit: 30,
      offset: 0,
      hasMore: false,
    },
  },
  notifications: {
    unreadCount: 0,
  },
};

export const defaultTripByIdFullResponse = {
  trip: {
    id: "trip-1",
    name: "Test Trip",
    description: "A test trip",
    startDate: "2025-06-01",
    endDate: "2025-06-07",
    backgroundImagePath: null,
    groups: [],
    participants: [],
    tripSponsors: [],
  },
  groups: [],
  challenges: [],
  sponsors: [],
  latestNews: [],
};

export const defaultCommunityFullResponse = {
  feed: {
    activities: [],
    pagination: {
      total: null,
      page: null,
      pageSize: 30,
      totalPages: null,
      hasMore: false,
    },
    nextCursor: null,
  },
  ranking: {
    data: [],
    currentDate: "2025-06-01T00:00:00.000Z",
  },
  activeChallenges: [],
  avatarUrls: {},
};

export const defaultJudgedStaffProgressByTripResponse = {};

/**
 * Creates an MSW handler for `home.getHomeFull`.
 * @param resolver - Function returning the mocked response. Defaults to {@link defaultHomeFullResponse}.
 */
export function createHomeFullHandler(resolver: () => unknown = () => defaultHomeFullResponse) {
  return createORPCHandler(["home", "getHomeFull"], resolver);
}

/**
 * Creates an MSW handler for `trip.getByIdFull`.
 * @param resolver - Function receiving `{ id: string }` and returning the mocked response.
 *                   Defaults to {@link defaultTripByIdFullResponse}.
 */
export function createTripByIdFullHandler(
  resolver: (input: Record<string, unknown>) => unknown = () => defaultTripByIdFullResponse,
) {
  return createORPCHandler(["trip", "getByIdFull"], resolver);
}

/**
 * Creates an MSW handler for `storage.createDownloadUrl`.
 * @param resolver - Function receiving `{ storagePath, expiresInSeconds? }` and returning the mocked response.
 *                   Defaults to a stable placeholder signed URL.
 */
export function createDownloadUrlHandler(
  resolver: (input: Record<string, unknown>) => unknown = () => ({
    signedUrl: "https://cdn.example.com/signed/file.jpg",
  }),
) {
  return createORPCHandler(["storage", "createDownloadUrl"], resolver);
}

/**
 * Creates an MSW handler for `community.getCommunityFull`.
 * @param resolver - Function receiving `{ tripId, pageSize, cursor }` and returning the mocked response.
 *                   Defaults to {@link defaultCommunityFullResponse}.
 */
export function createCommunityFullHandler(
  resolver: (input: Record<string, unknown>) => unknown = () => defaultCommunityFullResponse,
) {
  return createORPCHandler(["community", "getCommunityFull"], resolver);
}

/**
 * Creates an MSW handler for `challengeVote.getJudgedStaffProgressByTrip`.
 * @param resolver - Function receiving `{ tripId }` and returning the mocked response.
 *                   Defaults to {@link defaultJudgedStaffProgressByTripResponse}.
 */
export function createJudgedStaffProgressByTripHandler(
  resolver: (input: Record<string, unknown>) => unknown = () =>
    defaultJudgedStaffProgressByTripResponse,
) {
  return createORPCHandler(["challengeVote", "getJudgedStaffProgressByTrip"], resolver);
}
