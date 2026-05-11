import { z } from "zod";
import { TRPCError } from "../../api/trpc";
import {
  createORPCRouter,
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

export const tripRouter = createORPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(30),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const limit = input?.pagination?.limit ?? 30;
      const offset = input?.pagination?.offset ?? 0;
      const where = {
        participants: {
          some: { userId: context.dbUser.id },
        },
      };

      const [trips, total] = await Promise.all([
        context.db.trip.findMany({
          where,
          orderBy: { startDate: "asc" },
          include: {
            groups: {
              where: { isDeleted: false },
              select: { id: true, name: true },
            },
            tripSponsors: {
              where: {
                sponsor: { isActive: true }
              },
              include: {
                sponsor: true,
              },
            },
          },
          take: limit,
          skip: offset,
        }),
        context.db.trip.count({ where }),
      ]);

      return {
        trips,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const isParticipant = await context.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: context.dbUser.id,
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

      const trip = await context.db.trip.findUnique({
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
          tripSponsors: {
            where: {
              sponsor: { isActive: true }
            },
            include: {
              sponsor: true,
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
        context.supabase,
        trip.participants.map((participant) => participant.user.authUserId),
      );

      return {
        ...trip,
        tripSponsors: trip.tripSponsors,
        groups: await Promise.all(
          trip.groups.map(async (group) => ({
            ...group,
            image: await resolveGroupImage(context.supabase, group.image),
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
    .handler(async ({ context, input }) => {
      const trip = await context.db.trip.findUnique({
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
          tripSponsors: {
            where: {
              sponsor: { isActive: true }
            },
            include: {
              sponsor: true,
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
        context.supabase,
        trip.participants.map((participant) => participant.user.authUserId),
      );

      return {
        ...trip,
        groups: await Promise.all(
          trip.groups.map(async (group) => ({
            ...group,
            image: await resolveGroupImage(context.supabase, group.image),
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
    .handler(async ({ context, input }) => {
      return context.db.trip.create({
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
    .handler(async ({ context, input }) => {
      const { id, ...data } = input;
      const trip = await context.db.trip.findUnique({ where: { id } });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }
      return context.db.trip.update({
        where: { id },
        data,
      });
    }),
  getResources: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      // verify participant access
      const isParticipant = await context.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: context.dbUser.id,
            tripId: input.tripId,
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

      const resources = await context.db.tripResource.findMany({
        where: { tripId: input.tripId },
        orderBy: { sortOrder: "asc" },
      });
      const insurance = await context.db.tripInsurance.findUnique({
        where: { tripId: input.tripId },
        include: { steps: { orderBy: { stepNumber: "asc" } } },
      });
      return { resources, insurance };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      return context.db.trip.delete({ where: { id: input.id } });
    }),
});
