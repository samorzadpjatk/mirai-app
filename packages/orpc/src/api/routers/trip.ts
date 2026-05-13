import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  createORPCRouter,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";
import {
  trips,
  tripParticipants,
} from "@mirai-app/db";
import { eq, inArray, sql } from "drizzle-orm";
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

      const participantRows = await context.db.select({ tripId: tripParticipants.tripId })
        .from(tripParticipants)
        .where(eq(tripParticipants.userId, context.dbUser.id));
      const tripIds = participantRows.map((r) => r.tripId);

      if (tripIds.length === 0) {
        return {
          trips: [],
          pagination: { total: 0, limit, offset, hasMore: false },
        };
      }

      const [tripsList, totalRows] = await Promise.all([
        context.db.query.trips.findMany({
          where: (t, { inArray }) => inArray(t.id, tripIds),
          with: {
            groups: {
              where: (g, { eq }) => eq(g.isDeleted, false),
            },
            tripSponsors: {
              with: {
                sponsor: true,
              },
            },
          },
          orderBy: (t, { asc }) => asc(t.startDate),
          limit,
          offset,
        }),
        context.db.select({ count: sql<number>`count(*)` }).from(trips)
          .where(inArray(trips.id, tripIds)),
      ]);

      const total = totalRows[0]?.count ?? 0;

      return {
        trips: tripsList.map((trip) => ({
          ...trip,
          tripSponsors: trip.tripSponsors.filter((ts) => ts.sponsor?.isActive),
        })),
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
      const isParticipant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.id)),
      });

      if (!isParticipant) {
        throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
      }

      const trip = await context.db.query.trips.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
        with: {
          groups: {
            where: (g, { eq }) => eq(g.isDeleted, false),
          },
          tripSponsors: {
            with: {
              sponsor: true,
            },
          },
          participants: {
            with: {
              user: true,
              group: true,
            },
          },
        },
      });
      if (!trip) {
        throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
      }

      const groupIds = trip.groups.map((g) => g.id);
      let countMap = new Map<string, number>();
      if (groupIds.length > 0) {
        const participantCounts = await context.db.select({
          groupId: tripParticipants.groupId,
          count: sql<number>`count(*)`,
        }).from(tripParticipants)
          .where(inArray(tripParticipants.groupId, groupIds))
          .groupBy(tripParticipants.groupId);
        countMap = new Map(participantCounts.map((c) => [c.groupId!, c.count]));
      }

      const emailByAuthUserId = await buildAuthEmailLookup(
        context.supabase,
        trip.participants.map((participant) => participant.user?.authUserId).filter(Boolean),
      );

      return {
        ...trip,
        tripSponsors: trip.tripSponsors.filter((ts) => ts.sponsor?.isActive),
        groups: await Promise.all(
          trip.groups.map(async (group) => ({
            ...group,
            _count: { participants: countMap.get(group.id) ?? 0 },
            image: await resolveGroupImage(context.supabase, group.image),
          })),
        ),
        participants: trip.participants.map((participant) => {
          if (!participant.user) {
            return participant;
          }
          const { authUserId, ...user } = participant.user;
          return {
            ...participant,
            group: participant.group
              ? participant.group.isDeleted
                ? null
                : {
                  ...participant.group,
                  _count: { participants: countMap.get(participant.group.id) ?? 0 },
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
      const trip = await context.db.query.trips.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
        with: {
          groups: {
            where: (g, { eq }) => eq(g.isDeleted, false),
          },
          tripSponsors: {
            with: {
              sponsor: true,
            },
          },
          participants: {
            with: {
              user: true,
              group: true,
            },
          },
        },
      });
      if (!trip) {
        throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
      }

      const groupIds = trip.groups.map((g) => g.id);
      let countMap = new Map<string, number>();
      if (groupIds.length > 0) {
        const participantCounts = await context.db.select({
          groupId: tripParticipants.groupId,
          count: sql<number>`count(*)`,
        }).from(tripParticipants)
          .where(inArray(tripParticipants.groupId, groupIds))
          .groupBy(tripParticipants.groupId);
        countMap = new Map(participantCounts.map((c) => [c.groupId!, c.count]));
      }

      const emailByAuthUserId = await buildAuthEmailLookup(
        context.supabase,
        trip.participants.map((participant) => participant.user?.authUserId).filter(Boolean),
      );

      return {
        ...trip,
        tripSponsors: trip.tripSponsors.filter((ts) => ts.sponsor?.isActive),
        groups: await Promise.all(
          trip.groups.map(async (group) => ({
            ...group,
            _count: { participants: countMap.get(group.id) ?? 0 },
            image: await resolveGroupImage(context.supabase, group.image),
          })),
        ),
        participants: trip.participants.map((participant) => {
          if (!participant.user) {
            return participant;
          }
          const { authUserId, ...user } = participant.user;
          return {
            ...participant,
            group: participant.group
              ? participant.group.isDeleted
                ? null
                : {
                  ...participant.group,
                  _count: { participants: countMap.get(participant.group.id) ?? 0 },
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
      const [trip] = await context.db.insert(trips).values({
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        backgroundImagePath: input.backgroundImagePath,
      }).returning();
      return trip;
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
      const trip = await context.db.query.trips.findFirst({
        where: (t, { eq }) => eq(t.id, id),
      });
      if (!trip) {
        throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
      }
      const [updated] = await context.db.update(trips).set(data).where(eq(trips.id, id)).returning();
      return updated;
    }),
  getResources: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const isParticipant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
      });

      if (!isParticipant) {
        throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
      }

      const resources = await context.db.query.tripResources.findMany({
        where: (tr, { eq }) => eq(tr.tripId, input.tripId),
        orderBy: (tr, { asc }) => asc(tr.sortOrder),
      });
      const insurance = await context.db.query.tripInsurances.findFirst({
        where: (ti, { eq }) => eq(ti.tripId, input.tripId),
        with: {
          steps: {
            orderBy: (s, { asc }) => asc(s.stepNumber),
          },
        },
      });
      return { resources, insurance };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [deleted] = await context.db.delete(trips).where(eq(trips.id, input.id)).returning();
      return deleted;
    }),
});
