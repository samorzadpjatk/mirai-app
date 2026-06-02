import { filterActiveSponsors, type TripSponsorEntry } from "./filters";

export interface TripGroupInput {
  id: string;
  image?: string | null;
}

/**
 * Shapes a trip group by attaching participant count and resolved image.
 */
export function shapeTripGroup<T extends TripGroupInput>(
  group: T,
  countMap: Map<string | null, number>,
  resolvedImage: string | null | undefined,
): T & { _count: { participants: number }; image: string | null | undefined } {
  return {
    ...group,
    _count: { participants: countMap.get(group.id) ?? 0 },
    image: resolvedImage,
  };
}

export interface TripParticipantUserInput {
  authUserId?: string | null;
}

export interface TripParticipantGroupInput {
  id: string;
  isDeleted: boolean;
  image?: string | null;
}

export interface TripParticipantInput {
  user?: (TripParticipantUserInput & Record<string, unknown>) | null;
  group?: (TripParticipantGroupInput & Record<string, unknown>) | null;
}

export interface ShapedTripParticipantUser {
  email: string | null;
}

export interface ShapedTripParticipantGroup {
  _count: { participants: number };
  image: string | null | undefined;
}

export interface ShapedTripParticipant {
  user: (ShapedTripParticipantUser & Record<string, unknown>) | null;
  group: (ShapedTripParticipantGroup & Record<string, unknown>) | null;
}

/**
 * Shapes a trip participant by resolving user email and group info.
 * Removes authUserId from the user object and attaches email from the lookup map.
 * Filters out deleted groups.
 */
export function shapeTripParticipant(
  participant: TripParticipantInput,
  countMap: Map<string | null, number>,
  emailByAuthUserId: Map<string, string | null>,
): ShapedTripParticipant {
  const shapedGroup = participant.group
    ? participant.group.isDeleted
      ? null
      : {
          ...participant.group,
          _count: { participants: countMap.get(participant.group.id) ?? 0 },
          image: participant.group.image,
        }
    : null;

  if (!participant.user) {
    return {
      ...participant,
      user: null,
      group: shapedGroup,
    } as ShapedTripParticipant;
  }

  const { authUserId, ...userRest } = participant.user;
  return {
    ...participant,
    group: shapedGroup,
    user: {
      ...userRest,
      email: authUserId ? emailByAuthUserId.get(authUserId) ?? null : null,
    },
  } as ShapedTripParticipant;
}

export interface TripWithDetailRelations {
  tripSponsors: TripSponsorEntry[];
  groups: TripGroupInput[];
  participants: TripParticipantInput[];
}

export interface TripDetailResponse {
  tripSponsors: TripSponsorEntry[];
  groups: Array<TripGroupInput & { _count: { participants: number }; image: string | null | undefined }>;
  participants: ShapedTripParticipant[];
}

/**
 * Builds a complete trip detail response by shaping sponsors, groups, and participants.
 * All external data (image URLs, email lookups, participant counts) must be resolved
 * before calling this function — it is fully pure.
 */
export function buildTripDetailResponse(
  trip: TripWithDetailRelations,
  countMap: Map<string | null, number>,
  emailByAuthUserId: Map<string, string | null>,
  resolvedGroupImages: Map<string, string | null | undefined>,
): TripDetailResponse {
  return {
    tripSponsors: filterActiveSponsors(trip.tripSponsors),
    groups: trip.groups.map((group) => ({
      ...group,
      _count: { participants: countMap.get(group.id) ?? 0 },
      image: resolvedGroupImages.has(group.id) ? resolvedGroupImages.get(group.id) : group.image,
    })),
    participants: trip.participants.map((participant) =>
      shapeTripParticipant(participant, countMap, emailByAuthUserId),
    ),
  };
}

export interface TripListItemInput {
  tripSponsors: TripSponsorEntry[];
}

/**
 * Builds a trip list item by filtering inactive sponsors.
 * Generic to preserve all input fields (id, name, startDate, etc.) from the DB query.
 */
export function buildTripListItem<T extends TripListItemInput>(trip: T): T {
  return {
    ...trip,
    tripSponsors: filterActiveSponsors(trip.tripSponsors),
  };
}
