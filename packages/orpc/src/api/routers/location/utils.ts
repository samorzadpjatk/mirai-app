import { toExpoLocation } from "@mirai-app/common/locations";
import type { DB, Location as DbLocation } from "@mirai-app/db";
import { tripParticipants } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { ORPCError } from "@orpc/server";
import { and, inArray, ne } from "drizzle-orm";
import { IMAGE_BUCKET } from "../../../utils/storage";
import { ensureTripNotEnded } from "../../../utils/tripGuards";
import type { LocationWithUser } from "./types";
import { AVATAR_FILE_EXTENSION, AVATAR_SIGNED_URL_SECONDS } from "./types";

export const getUserAvatarPath = (userId: string): string =>
  `avatar/${userId}.${AVATAR_FILE_EXTENSION}`;

const getUserAvatarUrl = async (
  supabase: SupabaseClient,
  userId: string | null | undefined,
  hasAvatar: boolean | null | undefined,
): Promise<string | null> => {
  if (!userId || !hasAvatar) return null;

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(getUserAvatarPath(userId), AVATAR_SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) return null;

  return data.signedUrl;
};

export const mapUserWithAvatar = async (
  supabase: SupabaseClient,
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    hasAvatar: boolean | null;
  } | null,
): Promise<LocationWithUser["user"] | null> => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    image: await getUserAvatarUrl(supabase, user.id, user.hasAvatar),
  };
};

/**
 * Convert database location with user to extended format
 */
export async function toLocationWithUser(
  db: DB,
  supabase: SupabaseClient,
  dbLocation: DbLocation,
): Promise<LocationWithUser> {
  const expoLocation = toExpoLocation(dbLocation);
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, dbLocation.userId),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      hasAvatar: true,
    },
  });

  if (!user) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "User not found for location" });
  }

  return {
    ...expoLocation,
    isSharingLocation: dbLocation.isSharingLocation,
    user: (await mapUserWithAvatar(supabase, user)) ?? undefined,
  };
}

/**
 * Check if user is in any active trips (not ended)
 */
export async function ensureUserInActiveTrip(db: DB, userId: string): Promise<void> {
  const memberships = await db.query.tripParticipants.findMany({
    where: (tp, { eq }) => eq(tp.userId, userId),
    with: {
      trip: {
        columns: { id: true, endDate: true },
      },
    },
  });

  if (memberships.length === 0) {
    throw new ORPCError("FORBIDDEN", { message: "Location sharing requires trip participation" });
  }

  // Check if all user's trips have ended
  for (const membership of memberships) {
    try {
      await ensureTripNotEnded(db, membership.trip.id);
      // If we find any active trip, allow the operation
      return;
    } catch {
      // Trip has ended, continue checking other trips
    }
  }

  // All trips have ended
  throw new ORPCError("FORBIDDEN", { message: "Location sharing is not available for past trips" });
}

export async function getShareableUserIdsForCurrentUser({
  db,
  currentUserId,
  tripId,
}: {
  db: DB;
  currentUserId: string;
  tripId?: string;
}): Promise<Set<string>> {
  let scopedTripIds: string[] = [];

  if (tripId) {
    const isMember = await db.query.tripParticipants.findFirst({
      where: (tp, { and, eq }) => and(eq(tp.tripId, tripId), eq(tp.userId, currentUserId)),
      columns: { id: true },
    });

    if (!isMember) {
      return new Set();
    }

    scopedTripIds = [tripId];
  } else {
    const memberships = await db.query.tripParticipants.findMany({
      where: (tp, { eq }) => eq(tp.userId, currentUserId),
      columns: { tripId: true },
    });
    scopedTripIds = memberships.map((membership) => membership.tripId);
  }

  if (scopedTripIds.length === 0) {
    return new Set();
  }

  const participants = await db
    .select({ userId: tripParticipants.userId })
    .from(tripParticipants)
    .where(
      and(
        inArray(tripParticipants.tripId, scopedTripIds),
        ne(tripParticipants.userId, currentUserId),
      ),
    )
    .groupBy(tripParticipants.userId);

  return new Set(participants.map((participant) => participant.userId));
}

export async function assertShareableTargets({
  db,
  currentUserId,
  targetUserIds,
  tripId,
  allowAlreadyShared = false,
}: {
  db: DB;
  currentUserId: string;
  targetUserIds: string[];
  tripId?: string;
  allowAlreadyShared?: boolean;
}): Promise<void> {
  const uniqueTargetUserIds = [...new Set(targetUserIds)];
  if (uniqueTargetUserIds.length === 0) return;

  if (uniqueTargetUserIds.some((targetId) => targetId === currentUserId)) {
    throw new ORPCError("BAD_REQUEST", {
      message: "You cannot share location settings with yourself",
    });
  }

  const allowedIds = await getShareableUserIdsForCurrentUser({
    db,
    currentUserId,
    tripId,
  });

  if (allowAlreadyShared) {
    const location = await db.query.locations.findFirst({
      where: (l, { eq }) => eq(l.userId, currentUserId),
      with: {
        usersToShareWith: {
          columns: { userId: true },
        },
      },
    });

    for (const share of location?.usersToShareWith ?? []) {
      allowedIds.add(share.userId);
    }
  }

  const invalidTargetIds = uniqueTargetUserIds.filter((targetId) => !allowedIds.has(targetId));

  if (invalidTargetIds.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: "One or more selected users are outside your allowed sharing scope",
    });
  }
}
