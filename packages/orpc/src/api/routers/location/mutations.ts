import { locationShares, locationSharingRequests, locations } from "@mirai-app/db";
import { toExpoLocation } from "@mirai-app/shared/locations";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { ensureTripNotEnded } from "../../../utils/tripGuards";
import type { LocationContext } from "./queries";
import type { SharingUser } from "./types";
import { assertShareableTargets, ensureUserInActiveTrip, mapUserWithAvatar } from "./utils";

type LocationDataInput = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
};

export async function* updateLocationStream(context: LocationContext, input: LocationDataInput) {
  const [location] = await context.db
    .insert(locations)
    .values({
      userId: context.dbUser.id,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? 0,
      altitude: input.altitude,
      altitudeAccuracy: input.altitudeAccuracy,
      heading: input.heading,
      speed: input.speed,
      timestamp: new Date(),
      isSharingLocation: true,
    })
    .onConflictDoUpdate({
      target: locations.userId,
      set: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? 0,
        altitude: input.altitude,
        altitudeAccuracy: input.altitudeAccuracy,
        heading: input.heading,
        speed: input.speed,
        timestamp: new Date(),
        isSharingLocation: true,
      },
    })
    .returning();

  if (!location) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update location" });
  }

  yield toExpoLocation(location);
}

export const updateSharingSettings = async (
  context: LocationContext,
  input: {
    isSharingLocation: boolean;
    userIdsToShareWith?: string[];
    tripId?: string;
  },
) => {
  const { isSharingLocation, userIdsToShareWith, tripId } = input;

  if (tripId) {
    await ensureTripNotEnded(context.db, tripId);
  } else {
    await ensureUserInActiveTrip(context.db, context.dbUser.id);
  }

  if ((userIdsToShareWith?.length ?? 0) > 0) {
    await assertShareableTargets({
      db: context.db,
      currentUserId: context.dbUser.id,
      targetUserIds: userIdsToShareWith ?? [],
      tripId,
      allowAlreadyShared: true,
    });
  }

  // Upsert location for user
  const [locationRow] = await context.db
    .insert(locations)
    .values({
      userId: context.dbUser.id,
      isSharingLocation,
      timestamp: new Date(),
      latitude: 0,
      longitude: 0,
    })
    .onConflictDoUpdate({
      target: locations.userId,
      set: {
        isSharingLocation,
        timestamp: new Date(),
      },
    })
    .returning();

  if (!locationRow) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to upsert location" });
  }

  // Update shares if userIdsToShareWith provided
  if (userIdsToShareWith && userIdsToShareWith.length > 0) {
    await context.db.delete(locationShares).where(eq(locationShares.locationId, locationRow.id));

    await context.db
      .insert(locationShares)
      .values(userIdsToShareWith.map((id) => ({ locationId: locationRow.id, userId: id })));
  }

  // Query users to share with
  const shareUserIds = await context.db
    .select({ userId: locationShares.userId })
    .from(locationShares)
    .where(eq(locationShares.locationId, locationRow.id));

  const usersToShareWith =
    shareUserIds.length > 0
      ? await context.db.query.users.findMany({
          where: (u, { inArray }) =>
            inArray(
              u.id,
              shareUserIds.map((s) => s.userId),
            ),
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            hasAvatar: true,
          },
        })
      : [];

  return {
    isSharingLocation: Boolean(locationRow.isSharingLocation),
    usersToShareWith,
  };
};

export const updateLocation = async (context: LocationContext, input: LocationDataInput) => {
  const [location] = await context.db
    .insert(locations)
    .values({
      userId: context.dbUser.id,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? 0,
      altitude: input.altitude,
      altitudeAccuracy: input.altitudeAccuracy,
      heading: input.heading,
      speed: input.speed,
      timestamp: new Date(),
    })
    .onConflictDoUpdate({
      target: locations.userId,
      set: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? 0,
        altitude: input.altitude,
        altitudeAccuracy: input.altitudeAccuracy,
        heading: input.heading,
        speed: input.speed,
        timestamp: new Date(),
      },
    })
    .returning();

  return location;
};

export const addUserToSharing = async (context: LocationContext, input: { userId: string }) => {
  await ensureUserInActiveTrip(context.db, context.dbUser.id);
  await assertShareableTargets({
    db: context.db,
    currentUserId: context.dbUser.id,
    targetUserIds: [input.userId],
  });

  const [locationRow] = await context.db
    .insert(locations)
    .values({
      userId: context.dbUser.id,
      timestamp: new Date(),
      isSharingLocation: true,
      latitude: 0,
      longitude: 0,
    })
    .onConflictDoUpdate({
      target: locations.userId,
      set: {
        timestamp: new Date(),
        isSharingLocation: true,
      },
    })
    .returning();

  if (!locationRow) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to upsert location" });
  }

  await context.db
    .insert(locationShares)
    .values({ locationId: locationRow.id, userId: input.userId })
    .onConflictDoNothing();

  const shareUserIds = await context.db
    .select({ userId: locationShares.userId })
    .from(locationShares)
    .where(eq(locationShares.locationId, locationRow.id));

  const usersToShareWith =
    shareUserIds.length > 0
      ? await context.db.query.users.findMany({
          where: (u, { inArray }) =>
            inArray(
              u.id,
              shareUserIds.map((s) => s.userId),
            ),
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            hasAvatar: true,
          },
        })
      : [];

  const usersWithAvatars = await Promise.all(
    usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
  );

  return {
    success: true,
    usersToShareWith: usersWithAvatars.filter(Boolean) as SharingUser[],
  };
};

export const removeUserFromSharing = async (
  context: LocationContext,
  input: { userId: string },
) => {
  await ensureUserInActiveTrip(context.db, context.dbUser.id);

  const location = await context.db.query.locations.findFirst({
    where: (l, { eq }) => eq(l.userId, context.dbUser.id),
    columns: { id: true },
  });

  if (!location) {
    return {
      success: true,
      usersToShareWith: [],
    };
  }

  await context.db
    .delete(locationShares)
    .where(
      and(eq(locationShares.locationId, location.id), eq(locationShares.userId, input.userId)),
    );

  const shareUserIds = await context.db
    .select({ userId: locationShares.userId })
    .from(locationShares)
    .where(eq(locationShares.locationId, location.id));

  const usersToShareWith =
    shareUserIds.length > 0
      ? await context.db.query.users.findMany({
          where: (u, { inArray }) =>
            inArray(
              u.id,
              shareUserIds.map((s) => s.userId),
            ),
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            hasAvatar: true,
          },
        })
      : [];

  const usersWithAvatars = await Promise.all(
    usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
  );

  return {
    success: true,
    usersToShareWith: usersWithAvatars.filter(Boolean) as SharingUser[],
  };
};

export const requestLocationSharing = async (
  context: LocationContext,
  input: { receiverId: string },
) => {
  await ensureUserInActiveTrip(context.db, context.dbUser.id);
  if (input.receiverId === context.dbUser.id) {
    throw new ORPCError("BAD_REQUEST", { message: "You cannot send a request to yourself" });
  }

  await assertShareableTargets({
    db: context.db,
    currentUserId: context.dbUser.id,
    targetUserIds: [input.receiverId],
  });

  const existingRequest = await context.db.query.locationSharingRequests.findFirst({
    where: (lsr, { and, eq }) =>
      and(eq(lsr.senderId, context.dbUser.id), eq(lsr.receiverId, input.receiverId)),
    orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
  });

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      throw new ORPCError("BAD_REQUEST", { message: "Request already sent" });
    }
    if (existingRequest.status === "ACCEPTED") {
      throw new ORPCError("BAD_REQUEST", { message: "Location sharing already enabled" });
    }

    const [updated] = await context.db
      .update(locationSharingRequests)
      .set({ status: "PENDING", updatedAt: new Date() })
      .where(eq(locationSharingRequests.id, existingRequest.id))
      .returning();

    return { success: true, request: updated };
  }

  const [request] = await context.db
    .insert(locationSharingRequests)
    .values({
      senderId: context.dbUser.id,
      receiverId: input.receiverId,
      status: "PENDING",
    })
    .returning();

  return { success: true, request };
};

export const acceptLocationSharingRequest = async (
  context: LocationContext,
  input: { requestId: string },
) => {
  await ensureUserInActiveTrip(context.db, context.dbUser.id);
  const request = await context.db.query.locationSharingRequests.findFirst({
    where: (lsr, { eq }) => eq(lsr.id, input.requestId),
  });

  if (!request) {
    throw new ORPCError("NOT_FOUND", { message: "Request not found" });
  }

  if (request.receiverId !== context.dbUser.id) {
    throw new ORPCError("FORBIDDEN", { message: "You can only accept requests sent to you" });
  }

  if (request.status !== "PENDING") {
    throw new ORPCError("BAD_REQUEST", { message: "Request is not pending" });
  }

  // Wrap all operations in a transaction for atomicity
  const result = await context.db.transaction(async (tx) => {
    // Update request status
    const [updatedRequest] = await tx
      .update(locationSharingRequests)
      .set({ status: "ACCEPTED" })
      .where(eq(locationSharingRequests.id, input.requestId))
      .returning();

    // Upsert sender location
    const [senderLocation] = await tx
      .insert(locations)
      .values({
        userId: request.senderId,
        timestamp: new Date(),
        isSharingLocation: true,
        latitude: 0,
        longitude: 0,
      })
      .onConflictDoUpdate({
        target: locations.userId,
        set: { timestamp: new Date(), isSharingLocation: true },
      })
      .returning();

    if (!senderLocation) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to upsert sender location",
      });
    }

    // Add sender -> receiver share
    await tx
      .insert(locationShares)
      .values({ locationId: senderLocation.id, userId: request.receiverId })
      .onConflictDoNothing();

    // Upsert receiver location
    const [receiverLocation] = await tx
      .insert(locations)
      .values({
        userId: request.receiverId,
        timestamp: new Date(),
        isSharingLocation: true,
        latitude: 0,
        longitude: 0,
      })
      .onConflictDoUpdate({
        target: locations.userId,
        set: { timestamp: new Date(), isSharingLocation: true },
      })
      .returning();

    if (!receiverLocation) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to upsert receiver location",
      });
    }

    // Add receiver -> sender share
    await tx
      .insert(locationShares)
      .values({ locationId: receiverLocation.id, userId: request.senderId })
      .onConflictDoNothing();

    return updatedRequest;
  });

  return { success: true, request: result };
};

export const rejectLocationSharingRequest = async (
  context: LocationContext,
  input: { requestId: string },
) => {
  await ensureUserInActiveTrip(context.db, context.dbUser.id);
  const request = await context.db.query.locationSharingRequests.findFirst({
    where: (lsr, { eq }) => eq(lsr.id, input.requestId),
  });

  if (!request) {
    throw new ORPCError("NOT_FOUND", { message: "Request not found" });
  }

  if (request.receiverId !== context.dbUser.id) {
    throw new ORPCError("FORBIDDEN", { message: "You can only reject requests sent to you" });
  }

  const [updatedRequest] = await context.db
    .update(locationSharingRequests)
    .set({ status: "REJECTED" })
    .where(eq(locationSharingRequests.id, input.requestId))
    .returning();

  return { success: true, request: updatedRequest };
};
