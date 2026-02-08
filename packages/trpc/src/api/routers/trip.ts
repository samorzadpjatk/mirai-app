import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";

export const tripRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.trip.findMany({
      where: {
        participants: {
          some: { userId: ctx.dbUser.id },
        },
      },
      orderBy: { startDate: "asc" },
      include: {
        groups: {
          select: { id: true, name: true },
        },
      },
    });
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isParticipant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.id,
          },
        },
        select: { userId: true },
      });

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant of this trip",
        });
      }

      const trip = await ctx.db.trip.findUnique({
        where: { id: input.id },
        include: {
          groups: {
            select: {
              id: true,
              name: true,
              code: true,
              coins: true,
              _count: {
                select: { participants: true }
              }
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  authUserId: true,
                  role: true,
                },
              },
              group: {
                select: {
                  id: true,
                  name: true,
                  coins: true,
                  _count: {
                    select: { participants: true }
                  }
                }
              },
            },
          },
        },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        trip.participants.map((participant) => participant.user.authUserId),
      );

      return {
        ...trip,
        participants: trip.participants.map((participant) => {
          const { authUserId, ...user } = participant.user;
          return {
            ...participant,
            user: {
              ...user,
              email: resolveAuthEmail(emailByAuthUserId, authUserId),
            },
          };
        }),
      };
    }),
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trip.create({
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const trip = await ctx.db.trip.findUnique({ where: { id } });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }
      return ctx.db.trip.update({
        where: { id },
        data,
      });
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trip.delete({ where: { id: input.id } });
    }),
});
