import { locationShares } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import type { RealtimeChannel, SupabaseClient } from "@mirai-app/supabase";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { tracked } from "~/api/orpc";
import { calculateDistance } from "../../../utils/location-validation";
import { logger } from "../../../utils/logger";
import {
  LOCATION_REALTIME_TABLE,
  buildFriendLocationFilter,
  createChannelSubscriptionGate,
  extractRealtimeUserId,
  shouldKeepStreaming,
} from "./realtime";
import type { FriendLocationEvent, SharingUser } from "./types";
import { mapUserWithAvatar, toLocationWithUser } from "./utils";

/** How often the generator drains the realtime event queue. */
const LOCATION_STREAM_POLL_INTERVAL_MS = 100;

/**
 * Shape of a raw `locations` row as delivered by Supabase Realtime. Only the
 * owning user is read from the payload; everything else is re-read via Drizzle.
 */
type RealtimeLocationRow = { user_id: string };

export type LocationContext = {
  db: DB;
  supabase: SupabaseClient;
  dbUser: { id: string };
};

export const getMyLocation = async (context: LocationContext) => {
  const location = await context.db.query.locations.findFirst({
    where: (l, { eq }) => eq(l.userId, context.dbUser.id),
  });

  return location;
};

export const getFriendsLocations = async (context: LocationContext) => {
  const shareEntries = await context.db
    .select({ locationId: locationShares.locationId })
    .from(locationShares)
    .where(eq(locationShares.userId, context.dbUser.id));

  const locationIds = shareEntries.map((s) => s.locationId);

  const dbLocations =
    locationIds.length > 0
      ? await context.db.query.locations.findMany({
          where: (l, { and, eq, inArray }) =>
            and(eq(l.isSharingLocation, true), inArray(l.id, locationIds)),
          with: {
            user: {
              columns: { id: true, firstName: true, lastName: true, hasAvatar: true },
            },
          },
        })
      : [];

  const mapped = await Promise.all(
    dbLocations.map(async (location) => ({
      ...location,
      user: (await mapUserWithAvatar(context.supabase, location.user)) ?? undefined,
    })),
  );

  return mapped;
};

export const getMySharingSettings = async (
  context: LocationContext,
): Promise<{
  isSharingLocation: boolean;
  usersToShareWith: SharingUser[];
}> => {
  const location = await context.db.query.locations.findFirst({
    where: (l, { eq }) => eq(l.userId, context.dbUser.id),
    with: {
      usersToShareWith: {
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
      },
    },
  });

  if (!location) {
    return {
      isSharingLocation: false,
      usersToShareWith: [],
    };
  }

  const usersToShareWith = Array.isArray(location.usersToShareWith)
    ? location.usersToShareWith.map((share) => share.user).filter(Boolean)
    : [];

  const usersWithAvatars = await Promise.all(
    usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
  );

  return {
    isSharingLocation: Boolean(location.isSharingLocation),
    usersToShareWith: usersWithAvatars.filter(Boolean) as SharingUser[],
  };
};

export const getAllUsersForSharing = async (
  context: LocationContext,
  input: { tripId?: string } | undefined,
) => {
  const { getShareableUserIdsForCurrentUser } = await import("./utils");

  const shareableUserIds = await getShareableUserIdsForCurrentUser({
    db: context.db,
    currentUserId: context.dbUser.id,
    tripId: input?.tripId,
  });

  if (shareableUserIds.size === 0) {
    return [];
  }

  const dbUsers = await context.db.query.users.findMany({
    where: (u, { inArray }) => inArray(u.id, [...shareableUserIds]),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      hasAvatar: true,
    },
    orderBy: (u, { asc }) => [asc(u.firstName), asc(u.lastName)],
  });

  const safeUsers = Array.isArray(dbUsers) ? dbUsers : [];

  const usersWithAvatars = await Promise.all(
    safeUsers.map((user) => mapUserWithAvatar(context.supabase, user)),
  );

  return usersWithAvatars.filter(Boolean) as SharingUser[];
};

export const getPendingLocationSharingRequests = async (context: LocationContext) => {
  const requests = await context.db.query.locationSharingRequests.findMany({
    where: (lsr, { and, eq }) =>
      and(eq(lsr.receiverId, context.dbUser.id), eq(lsr.status, "PENDING")),
    with: {
      sender: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          hasAvatar: true,
        },
      },
    },
    orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
  });

  return await Promise.all(
    requests.map(async (request) => ({
      ...request,
      sender: await mapUserWithAvatar(context.supabase, request.sender),
    })),
  );
};

export const getMyLocationSharingRequests = async (context: LocationContext) => {
  const [sent, received] = await Promise.all([
    context.db.query.locationSharingRequests.findMany({
      where: (lsr, { eq }) => eq(lsr.senderId, context.dbUser.id),
      with: {
        receiver: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            hasAvatar: true,
          },
        },
      },
      orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
    }),
    context.db.query.locationSharingRequests.findMany({
      where: (lsr, { eq }) => eq(lsr.receiverId, context.dbUser.id),
      with: {
        sender: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            hasAvatar: true,
          },
        },
      },
      orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
    }),
  ]);

  return {
    sent: await Promise.all(
      sent.map(async (request) => ({
        ...request,
        receiver: await mapUserWithAvatar(context.supabase, request.receiver),
      })),
    ),
    received: await Promise.all(
      received.map(async (request) => ({
        ...request,
        sender: await mapUserWithAvatar(context.supabase, request.sender),
      })),
    ),
  };
};

export async function* getFriendsLocationsStream(
  context: LocationContext,
  input: {
    connectionId: string | null;
    radiusKm?: number;
    latitude?: number;
    longitude?: number;
  },
) {
  const supabase = context.supabase;
  let channel: RealtimeChannel | null = null;
  const queue: FriendLocationEvent[] = [];
  const connectionId = input.connectionId ?? crypto.randomUUID();

  const { radiusKm, latitude, longitude } = input;
  if (radiusKm !== undefined && (latitude === undefined || longitude === undefined)) {
    throw new ORPCError("BAD_REQUEST", {
      message: "When providing radiusKm, both latitude and longitude are required",
    });
  }

  // Emituj początkowe lokalizacje znajomych (filtrowane jeśli radius podany)
  const shareEntries = await context.db
    .select({ locationId: locationShares.locationId })
    .from(locationShares)
    .where(eq(locationShares.userId, context.dbUser.id));

  const locationIds = shareEntries.map((s) => s.locationId);

  const dbLocations =
    locationIds.length > 0
      ? await context.db.query.locations.findMany({
          where: (l, { and, eq, inArray }) =>
            and(eq(l.isSharingLocation, true), inArray(l.id, locationIds)),
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })
      : [];

  // Track which friends are currently within the radius (when radius filtering is used)
  const inRadius = new Set<string>();

  for (const dbLocation of dbLocations) {
    const lw = await toLocationWithUser(context.db, context.supabase, dbLocation);
    if (radiusKm !== undefined) {
      if (!dbLocation.latitude || !dbLocation.longitude) continue;
      const dist = calculateDistance(
        latitude!,
        longitude!,
        Number(dbLocation.latitude),
        Number(dbLocation.longitude),
      );
      if (dist <= radiusKm) {
        inRadius.add(dbLocation.userId);
        yield tracked(connectionId, {
          type: "upsert",
          location: { ...lw },
        });
      }
    } else {
      yield tracked(connectionId, { type: "upsert", location: lw });
    }
  }

  const friendIds = dbLocations.map((l) => l.userId);
  const allowedFriendIds = new Set(friendIds);

  logger.info(
    { userId: context.dbUser.id, friendCount: friendIds.length },
    "Setting up location subscription",
  );

  const enqueueDelete = (userId: string) => {
    // With radius filtering we only announce a removal for friends we had
    // previously reported as inside the radius.
    if (radiusKm !== undefined && !inRadius.delete(userId)) return;
    queue.push({ id: connectionId, type: "delete", userId });
  };

  const enqueueUpsert = async (userId: string) => {
    // Realtime payloads carry raw Postgres rows, so we re-read the row through
    // Drizzle instead of trusting the payload shape.
    const dbLocation = await context.db.query.locations.findFirst({
      where: (l, { eq }) => eq(l.userId, userId),
    });

    if (!dbLocation || !dbLocation.isSharingLocation) {
      enqueueDelete(userId);
      return;
    }

    const location = await toLocationWithUser(context.db, context.supabase, dbLocation);

    if (radiusKm === undefined) {
      queue.push({ id: connectionId, type: "upsert", location });
      return;
    }

    const distance = calculateDistance(
      latitude!,
      longitude!,
      Number(dbLocation.latitude),
      Number(dbLocation.longitude),
    );

    if (distance <= radiusKm) {
      inRadius.add(userId);
      queue.push({ id: connectionId, type: "upsert", location });
      return;
    }

    if (inRadius.delete(userId)) {
      queue.push({ id: connectionId, type: "delete", userId });
    }
  };

  let isSubscribed = false;

  if (friendIds.length > 0) {
    // Subskrybuj zmiany tylko dla lokalizacji znajomych (jeden kanał, filtr in)
    const gate = createChannelSubscriptionGate();

    channel = supabase
      .channel(`friends_locations_${context.dbUser.id}`)
      .on<RealtimeLocationRow>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: LOCATION_REALTIME_TABLE,
          filter: buildFriendLocationFilter(friendIds),
        },
        (payload) => {
          const userId = extractRealtimeUserId(payload);
          if (!userId || !allowedFriendIds.has(userId)) return;

          if (payload.eventType === "DELETE") {
            enqueueDelete(userId);
            return;
          }

          void enqueueUpsert(userId).catch((error: unknown) => {
            logger.error({ err: error, userId }, "Failed to process location realtime event");
          });
        },
      )
      .subscribe((status, err) => {
        logger.info({ status }, "Location stream subscription status");
        if (err) {
          logger.error(err, "Location stream subscription error");
        }
        gate.onStatus(status);
      });

    // `subscribe()` only moves the channel to "joining"; wait for the websocket
    // join to actually complete before entering the pump loop, otherwise the
    // generator returns immediately and the client stream closes.
    isSubscribed = await gate.wait();

    if (!isSubscribed) {
      logger.error(
        { userId: context.dbUser.id },
        "Location stream subscription failed to establish",
      );
    }
  }

  try {
    while ((isSubscribed && shouldKeepStreaming(channel)) || queue.length > 0) {
      if (queue.length === 0) {
        // Wait for new events
        await new Promise((resolve) => setTimeout(resolve, LOCATION_STREAM_POLL_INTERVAL_MS));
        continue;
      }
      const event = queue.shift();
      if (event) yield tracked(connectionId, event);
    }
  } finally {
    if (channel) {
      void supabase.removeChannel(channel);
    }
  }
}
