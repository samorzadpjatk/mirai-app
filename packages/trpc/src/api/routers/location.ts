import { z } from "zod";
import { EventEmitter } from "node:events";
import { observable } from "@trpc/server/observable";
import { createTRPCRouter, protectedProcedure } from "../../api/trpc";

const LOCATION_EVENT = "location:update";
const locationEmitter = new EventEmitter();

const locationUpdateInput = z.object({
  latitude: z.number(),
  longitude: z.number(),
  updatedAt: z.union([z.string(), z.number(), z.date()]).optional(),
});

const locationPayloadSchema = z.object({
  userId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  updatedAt: z.date(),
});

type LocationPayload = z.infer<typeof locationPayloadSchema>;

const toDate = (value?: string | number | Date): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
};

export const locationRouter = createTRPCRouter({
  updateMy: protectedProcedure
    .input(locationUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const timestamp = toDate(input.updatedAt);
      await ctx.db.location.upsert({
        where: { userId: ctx.dbUser.id },
        update: {
          latitude: input.latitude,
          longitude: input.longitude,
          timestamp,
          isSharingLocation: true,
        },
        create: {
          userId: ctx.dbUser.id,
          latitude: input.latitude,
          longitude: input.longitude,
          timestamp,
          isSharingLocation: true,
        },
      });

      const payload: LocationPayload = {
        userId: ctx.dbUser.id,
        latitude: input.latitude,
        longitude: input.longitude,
        updatedAt: timestamp,
      };
      locationEmitter.emit(LOCATION_EVENT, payload);
      return { success: true };
    }),
  subscribe: protectedProcedure.subscription(() => {
    return observable<LocationPayload>((emit) => {
      const onUpdate = (payload: LocationPayload) => {
        emit.next(payload);
      };
      locationEmitter.on(LOCATION_EVENT, onUpdate);
      return () => {
        locationEmitter.off(LOCATION_EVENT, onUpdate);
      };
    });
  }),
});
