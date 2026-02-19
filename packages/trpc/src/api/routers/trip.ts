import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";
import { normalizeSupabaseStoragePath } from "../../utils/storage";

const GROUP_IMAGE_SIGNED_URL_SECONDS = 60 * 60 * 24;

const resolveGroupImage = async (
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
      };
    };
  },
  image: string | null | undefined,
) => {
  if (!image) return null;

  const parsed = normalizeSupabaseStoragePath(image);
  if (!parsed) {
    return image;
  }

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, GROUP_IMAGE_SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
};

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
          where: { isDeleted: false },
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
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              code: true,
              image: true,
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
                  image: true,
                  coins: true,
                  isDeleted: true,
                  _count: {
                    select: { participants: true }
                  }
                },
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
        groups: await Promise.all(
          trip.groups.map(async (group) => ({
            ...group,
            image: await resolveGroupImage(ctx.supabase, group.image),
          })),
        ),
        participants: trip.participants.map((participant) => {
          const { authUserId, ...user } = participant.user;
          return {
            ...participant,
            group: participant.group
              ? participant.group.isDeleted
                ? null
                : {
                  ...participant.group,
                  image: participant.group.image,
                }
              : participant.group,
            user: {
              ...user,
              email: resolveAuthEmail(emailByAuthUserId, authUserId),
            },
          };
        }),
      };
    }),
  getByIdAdmin: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.id },
        include: {
          groups: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              code: true,
              image: true,
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
                  image: true,
                  coins: true,
                  isDeleted: true,
                  _count: {
                    select: { participants: true }
                  }
                },
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
        groups: await Promise.all(
          trip.groups.map(async (group) => ({
            ...group,
            image: await resolveGroupImage(ctx.supabase, group.image),
          })),
        ),
        participants: trip.participants.map((participant) => {
          const { authUserId, ...user } = participant.user;
          return {
            ...participant,
            group: participant.group
              ? participant.group.isDeleted
                ? null
                : {
                  ...participant.group,
                  image: participant.group.image,
                }
              : participant.group,
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
        backgroundImagePath: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trip.create({
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          backgroundImagePath: input.backgroundImagePath,
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
        backgroundImagePath: z.string().optional(),
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
