import type { TripSponsorDisplay } from "@mirai-app/db";
import { sponsors, tripSponsorDisplay, tripSponsors } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import type { SponsorContext } from "./queries";

/**
 * Per-trip logo layout. Lives on `trip_sponsor_display` since migration
 * `20260605202256_freezing_venom` dropped `height`/`offset_x`/`offset_y`
 * from the `sponsors` table.
 */
type SponsorDisplayInput = {
  tripId?: string;
  height?: number;
  offsetX?: number;
  offsetY?: number;
};

const hasDisplayValues = (input: SponsorDisplayInput): boolean =>
  input.height !== undefined || input.offsetX !== undefined || input.offsetY !== undefined;

const assertTripIdForDisplay = (input: SponsorDisplayInput): void => {
  if (hasDisplayValues(input) && !input.tripId) {
    throw new ORPCError("BAD_REQUEST", {
      message:
        "height, offsetX and offsetY are per-trip display settings and require a tripId to be saved",
    });
  }
};

const requireTrip = async (context: SponsorContext, tripId: string): Promise<void> => {
  const trip = await context.db.query.trips.findFirst({
    where: (t, { eq }) => eq(t.id, tripId),
  });
  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }
};

/**
 * Upserts the per-trip logo layout. Only the fields the caller actually sent are
 * overwritten on conflict, so a partial update never clobbers the other offsets.
 */
const upsertSponsorDisplay = async (
  context: SponsorContext,
  sponsorId: string,
  input: SponsorDisplayInput & { tripId: string },
): Promise<TripSponsorDisplay> => {
  const set: Partial<Pick<TripSponsorDisplay, "height" | "offsetX" | "offsetY">> = {};
  if (input.height !== undefined) set.height = input.height;
  if (input.offsetX !== undefined) set.offsetX = input.offsetX;
  if (input.offsetY !== undefined) set.offsetY = input.offsetY;

  const [display] = await context.db
    .insert(tripSponsorDisplay)
    .values({
      tripId: input.tripId,
      sponsorId,
      height: input.height ?? 0,
      offsetX: input.offsetX ?? 0,
      offsetY: input.offsetY ?? 0,
    })
    .onConflictDoUpdate({
      target: [tripSponsorDisplay.tripId, tripSponsorDisplay.sponsorId],
      set,
    })
    .returning();

  if (!display) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to save sponsor display settings",
    });
  }

  return display;
};

export const create = async (
  context: SponsorContext,
  input: {
    name: string;
    description: string;
    logoPath: string;
    isActive: boolean;
  } & SponsorDisplayInput,
) => {
  const { tripId, height, offsetX, offsetY, ...sponsorData } = input;
  assertTripIdForDisplay(input);

  if (tripId) {
    await requireTrip(context, tripId);
  }

  const [sponsor] = await context.db.insert(sponsors).values(sponsorData).returning();

  if (!sponsor) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create sponsor" });
  }

  if (!tripId) {
    return { ...sponsor, display: null };
  }

  await context.db
    .insert(tripSponsors)
    .values({ tripId, sponsorId: sponsor.id })
    .onConflictDoNothing({ target: [tripSponsors.tripId, tripSponsors.sponsorId] });

  const display = await upsertSponsorDisplay(context, sponsor.id, {
    tripId,
    height,
    offsetX,
    offsetY,
  });

  return { ...sponsor, display };
};

export const update = async (
  context: SponsorContext,
  input: {
    id: string;
    name?: string;
    description?: string;
    logoPath?: string;
    isActive?: boolean;
  } & SponsorDisplayInput,
) => {
  const { id, tripId, height, offsetX, offsetY, ...data } = input;
  assertTripIdForDisplay(input);

  const sponsor = await context.db.query.sponsors.findFirst({
    where: (s, { eq }) => eq(s.id, id),
  });
  if (!sponsor) {
    throw new ORPCError("NOT_FOUND", { message: "Sponsor not found" });
  }

  if (tripId) {
    await requireTrip(context, tripId);
  }

  let updated = sponsor;
  if (Object.keys(data).length > 0) {
    const [row] = await context.db
      .update(sponsors)
      .set(data)
      .where(eq(sponsors.id, id))
      .returning();
    if (!row) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update sponsor" });
    }
    updated = row;
  }

  const display =
    tripId && hasDisplayValues(input)
      ? await upsertSponsorDisplay(context, id, { tripId, height, offsetX, offsetY })
      : null;

  return { ...updated, display };
};

export const deleteSponsor = async (context: SponsorContext, input: { id: string }) => {
  const [sponsor] = await context.db.delete(sponsors).where(eq(sponsors.id, input.id)).returning();
  return sponsor;
};

export const addToTrip = async (
  context: SponsorContext,
  input: { tripId: string; sponsorId: string },
) => {
  const trip = await context.db.query.trips.findFirst({
    where: (t, { eq }) => eq(t.id, input.tripId),
  });
  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  const sponsor = await context.db.query.sponsors.findFirst({
    where: (s, { eq }) => eq(s.id, input.sponsorId),
  });
  if (!sponsor) {
    throw new ORPCError("NOT_FOUND", { message: "Sponsor not found" });
  }

  const existing = await context.db.query.tripSponsors.findFirst({
    where: (ts, { eq, and }) => and(eq(ts.tripId, input.tripId), eq(ts.sponsorId, input.sponsorId)),
  });

  if (existing) {
    throw new ORPCError("CONFLICT", {
      message: "Sponsor is already associated with this trip",
    });
  }

  const [tripSponsor] = await context.db
    .insert(tripSponsors)
    .values({
      tripId: input.tripId,
      sponsorId: input.sponsorId,
    })
    .returning();
  return tripSponsor;
};

export const removeFromTrip = async (
  context: SponsorContext,
  input: { tripId: string; sponsorId: string },
) => {
  const [tripSponsor] = await context.db
    .delete(tripSponsors)
    .where(and(eq(tripSponsors.tripId, input.tripId), eq(tripSponsors.sponsorId, input.sponsorId)))
    .returning();
  return tripSponsor;
};
