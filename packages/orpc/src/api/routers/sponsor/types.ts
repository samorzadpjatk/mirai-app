import { z } from "zod";

export const idInputSchema = z.object({ id: z.string() });

export const tripIdInputSchema = z.object({ tripId: z.string() });

/**
 * Per-trip logo layout. `height`, `offsetX` and `offsetY` were moved off the
 * `sponsors` table into `trip_sponsor_display` by migration
 * `20260605202256_freezing_venom`, so they only exist in the context of a trip
 * and need a `tripId` to be persisted.
 */
const sponsorDisplayInputShape = {
  tripId: z.string().optional(),
  height: z.number().int().optional(),
  offsetX: z.number().int().optional(),
  offsetY: z.number().int().optional(),
};

export const createSponsorInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  logoPath: z.string(),
  isActive: z.boolean().default(true),
  ...sponsorDisplayInputShape,
});

export const updateSponsorInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  logoPath: z.string().optional(),
  isActive: z.boolean().optional(),
  ...sponsorDisplayInputShape,
});

export const tripSponsorInputSchema = z.object({
  tripId: z.string(),
  sponsorId: z.string(),
});
