import { z } from "zod";

export const idInputSchema = z.object({ id: z.string() });

export const tripIdInputSchema = z.object({ tripId: z.string() });

export const createSponsorInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  logoPath: z.string(),
  height: z.number().int().optional(),
  offsetX: z.number().int().optional(),
  offsetY: z.number().int().optional(),
  isActive: z.boolean().default(true),
});

export const updateSponsorInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  logoPath: z.string().optional(),
  height: z.number().int().optional(),
  offsetX: z.number().int().optional(),
  offsetY: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const tripSponsorInputSchema = z.object({
  tripId: z.string(),
  sponsorId: z.string(),
});
