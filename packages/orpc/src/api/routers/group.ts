import { z } from "zod";
import { ORPCError } from "@orpc/server";
import type { SupabaseClient } from "@mirai-app/supabase";

import {
  createORPCRouter,
  protectedProcedure,
  adminProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";
import { normalizeSupabaseStoragePath } from "../../utils/storage";
import { isValidHttpUrl } from "../../utils/url-validation";
import {
  captureTripRankingSnapshot,
  createRankChangeActivities,
} from "../../utils/activityFeed";
import { ensureTripNotEnded, ensureTripNotEndedByGroupId } from "../../utils/tripGuards";
import { eq, and, inArray, count } from "drizzle-orm";
import { groups, groupJoinRequests, tripParticipants, coinTransactions } from "@mirai-app/db";

const toUserWithEmail = <T extends { authUserId?: string | null }>(
  user: T,
  emailByAuthUserId: Map<string, string | null>,
) => {
  const { authUserId, ...rest } = user;
  return {
    ...rest,
    email: resolveAuthEmail(emailByAuthUserId, authUserId),
  };
};

// Optimized helper function to batch email lookups
const batchEmailLookup = async (
  supabase: SupabaseClient,
  groups: {
    organizer?: { authUserId?: string | null } | null;
    participants: { user: { authUserId?: string | null } }[];
  }[],
) => {
  // Collect all unique authUserIds
  const allAuthUserIds = new Set<string>();

  groups.forEach((group) => {
    if (group.organizer?.authUserId) {
      allAuthUserIds.add(group.organizer.authUserId);
    }
    group.participants.forEach((participant) => {
      if (participant.user.authUserId) {
        allAuthUserIds.add(participant.user.authUserId);
      }
    });
  });

  // Single batch lookup for all emails
  return await buildAuthEmailLookup(supabase, Array.from(allAuthUserIds));
};

const generateFourDigitCode = () => {
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return String(1000 + (array[0]! % 9000));
};

const GROUP_IMAGE_SIGNED_URL_SECONDS = 60 * 60 * 24;
const joinRequestDecisionSchema = z.enum(["ACCEPT", "REJECT"]);

const groupImageSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (normalizeSupabaseStoragePath(value)) {
      return true;
    }

    return isValidHttpUrl(value);
  }, "Image must be a valid HTTP/HTTPS URL or storage path")
  .optional();

const normalizeGroupImageInput = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeSupabaseStoragePath(value);
  if (normalized) {
    return normalized.storagePath;
  }
  return value;
};

const resolveGroupImage = async (supabase: SupabaseClient, image: string | null | undefined) => {
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

export const groupRouter = createORPCRouter({
  getAllNames: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      return await context.db.query.groups.findMany({
        columns: {
          id: true,
          name: true,
        },
        where: (g, { and, eq }) => and(eq(g.tripId, input.tripId), eq(g.isDeleted, false)),
      });
    }),
  getMy: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const participant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { and, eq }) =>
          and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
        columns: { groupId: true },
      });
      if (!participant?.groupId) return null;
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, participant.groupId!),
        with: {
          participants: {
            with: {
              user: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  authUserId: true,
                },
              },
            },
          },
          organizer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          coinTransactions: {
            with: {
              admin: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: (ct, { desc }) => [desc(ct.createdAt)],
          },
        },
      });

      if (!group || group.isDeleted) return null;

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        group.organizer?.authUserId,
        ...group.participants.map((participant) => participant.user.authUserId),
      ]);

      return {
        ...group,
        image: await resolveGroupImage(context.supabase, group.image),
        organizer: group.organizer
          ? toUserWithEmail(group.organizer, emailByAuthUserId)
          : group.organizer,
        participants: group.participants.map((participant) => ({
          ...participant,
          user: toUserWithEmail(participant.user, emailByAuthUserId),
        })),
      };
    }),
  getAll: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const limit = input.pagination?.limit ?? 30;
      const offset = input.pagination?.offset ?? 0;
      const whereExpr = and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false));

      const [groupsResult, totalResult] = await Promise.all([
        context.db.query.groups.findMany({
          where: whereExpr,
          with: {
            participants: {
              with: {
                user: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    authUserId: true,
                  },
                },
              },
            },
            organizer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                authUserId: true,
              },
            },
            coinTransactions: {
              with: {
                admin: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: (ct, { desc }) => [desc(ct.createdAt)],
              limit: 10,
            },
          },
          orderBy: (g, { asc }) => [asc(g.name)],
          limit,
          offset,
        }),
        context.db.select({ count: count() }).from(groups).where(whereExpr),
      ]);

      // Use optimized batch email lookup
      const emailByAuthUserId = await batchEmailLookup(context.supabase, groupsResult);

      return {
        groups: await Promise.all(
          groupsResult.map(async (group) => ({
            ...group,
            image: await resolveGroupImage(context.supabase, group.image),
            organizer: group.organizer
              ? toUserWithEmail(group.organizer, emailByAuthUserId)
              : group.organizer,
            participants: group.participants.map((participant) => ({
              ...participant,
              user: toUserWithEmail(participant.user, emailByAuthUserId),
            })),
          })),
        ),
        pagination: {
          total: totalResult[0]?.count ?? 0,
          limit,
          offset,
          hasMore: offset + limit < (totalResult[0]?.count ?? 0),
        },
      };
    }),
  getGroupList: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const groupsResult = await context.db.query.groups.findMany({
        where: (g, { and, eq }) => and(eq(g.tripId, input.tripId), eq(g.isDeleted, false)),
        columns: {
          id: true,
          name: true,
          description: true,
          image: true,
          code: true,
          coins: true,
        },
        with: {
          organizer: {
            columns: { id: true, firstName: true, lastName: true },
          },
        },
      });

      const groupIds = groupsResult.map((g) => g.id);
      const participantCounts =
        groupIds.length > 0
          ? await context.db
              .select({
                groupId: tripParticipants.groupId,
                count: count(tripParticipants.id),
              })
              .from(tripParticipants)
              .where(inArray(tripParticipants.groupId, groupIds))
              .groupBy(tripParticipants.groupId)
          : [];

      const countMap = new Map(participantCounts.map((c) => [c.groupId, c.count]));
      const groupsWithCount = groupsResult.map((g) => ({
        ...g,
        _count: { participants: countMap.get(g.id) ?? 0 },
      }));

      return await Promise.all(
        groupsWithCount.map(async (group) => ({
          ...group,
          image: await resolveGroupImage(context.supabase, group.image),
        })),
      );
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.id),
        with: {
          participants: {
            with: {
              user: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  hasAvatar: true,
                  authUserId: true,
                  role: true,
                },
              },
            },
          },
          organizer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          trip: {
            columns: {
              id: true,
              name: true,
            },
          },
          challengeSubmissions: {
            where: (cs, { eq }) => eq(cs.status, "APPROVED"),
            columns: {
              id: true,
              imageIds: true,
              createdAt: true,
              reviewedAt: true,
            },
            with: {
              challenge: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: (cs, { desc }) => [desc(cs.reviewedAt), desc(cs.createdAt)],
          },
        },
      });

      if (!group || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      const executionCountResult = await context.db
        .select({ count: count() })
        .from(tripParticipants)
        .where(eq(tripParticipants.groupId, input.id));

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        group.organizer?.authUserId,
        ...group.participants.map((participant) => participant.user.authUserId),
      ]);

      const approvedSubmissions = group.challengeSubmissions
        .filter((submission) => Boolean(submission.imageIds[0]))
        .map((submission) => ({
          submissionId: submission.id,
          challengeId: submission.challenge.id,
          challengeTitle: submission.challenge.name,
          imageStoragePath: submission.imageIds[0] ?? "",
          approvedAt: submission.reviewedAt ?? submission.createdAt,
        }));

      return {
        ...group,
        _count: { participants: executionCountResult[0]?.count ?? 0 },
        image: await resolveGroupImage(context.supabase, group.image),
        organizer: group.organizer
          ? toUserWithEmail(group.organizer, emailByAuthUserId)
          : group.organizer,
        participants: group.participants.map((participant) => ({
          ...participant,
          user: toUserWithEmail(participant.user, emailByAuthUserId),
        })),
        approvedSubmissions,
      };
    }),
  getByIdWithOrganizer: moderatorProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(async ({ context, input }) => {
      const group = await context.db.query.groups.findFirst({
        where: (g, { and, eq }) => and(eq(g.id, input.groupId), eq(g.isDeleted, false)),
        columns: {
          id: true,
          name: true,
          code: true,
          coins: true,
        },
        with: {
          organizer: { columns: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!group) return null;

      const countResult = await context.db
        .select({ count: count() })
        .from(tripParticipants)
        .where(eq(tripParticipants.groupId, input.groupId));

      return {
        ...group,
        _count: { participants: countResult[0]?.count ?? 0 },
      };
    }),
  // Create a new group
  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        image: groupImageSchema,
        organizerId: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEnded(context.db, input.tripId);
      const group = await (async () => {
        for (let attempt = 0; attempt < 30; attempt += 1) {
          const code = generateFourDigitCode();
          try {
            const [groupRow] = await context.db
              .insert(groups)
              .values({
                name: input.name,
                description: input.description,
                image: normalizeGroupImageInput(input.image),
                code,
                tripId: input.tripId,
                organizerId: input.organizerId ?? context.dbUser.id,
              })
              .returning();

            if (!groupRow) {
              throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create group" });
            }

            const groupWithOrganizer = await context.db.query.groups.findFirst({
              where: (g, { eq }) => eq(g.id, groupRow.id),
              with: {
                organizer: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    authUserId: true,
                  },
                },
              },
            });

            if (!groupWithOrganizer) {
              throw new ORPCError("INTERNAL_SERVER_ERROR", {
                message: "Failed to fetch created group",
              });
            }

            return groupWithOrganizer;
          } catch (error: unknown) {
            let dbErrorCode = "";
            if (error instanceof Error && "code" in error) {
              dbErrorCode = (error as { code: string }).code;
            }
            if (dbErrorCode === "P2002") {
              continue;
            }
            throw error;
          }
        }

        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to generate a unique group code",
        });
      })();

      // Add creator as a member of the group and clean up join requests atomically
      await context.db.transaction(async (tx) => {
        await tx
          .insert(tripParticipants)
          .values({
            userId: context.dbUser.id,
            tripId: input.tripId,
            groupId: group.id,
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: group.id },
          });

        await tx
          .delete(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.tripId, input.tripId),
              eq(groupJoinRequests.userId, context.dbUser.id),
            ),
          );
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        group.organizer?.authUserId,
      ]);

      return {
        ...group,
        image: await resolveGroupImage(context.supabase, group.image),
        organizer: group.organizer
          ? toUserWithEmail(group.organizer, emailByAuthUserId)
          : group.organizer,
      };
    }),

  // Update group information
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: groupImageSchema,
        organizerId: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEnded(context.db, input.tripId);
      const { id, tripId, ...updateData } = input;
      const group = await context.db.query.groups.findFirst({ where: (g, { eq }) => eq(g.id, id) });
      if (group?.tripId !== tripId || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      const isAdmin = context.dbUser.role === "ADMIN";
      const isOrganizer = group.organizerId === context.dbUser.id;

      if (!isAdmin && !isOrganizer) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only group organizer or admin can update this group",
        });
      }

      if (!isAdmin && updateData.organizerId && updateData.organizerId !== group.organizerId) {
        throw new ORPCError("FORBIDDEN", { message: "Only admin can change group organizer" });
      }

      await context.db
        .update(groups)
        .set({
          ...updateData,
          organizerId: isAdmin ? updateData.organizerId : undefined,
          image: normalizeGroupImageInput(input.image),
        })
        .where(eq(groups.id, id));

      const updatedGroup = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, id),
        with: {
          organizer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        updatedGroup?.organizer?.authUserId,
      ]);

      return {
        ...updatedGroup,
        image: await resolveGroupImage(context.supabase, updatedGroup?.image),
        organizer: updatedGroup?.organizer
          ? toUserWithEmail(updatedGroup.organizer, emailByAuthUserId)
          : updatedGroup?.organizer,
      };
    }),

  // Delete a group
  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ context, input }) => {
    const group = await context.db.query.groups.findFirst({
      where: (g, { eq }) => eq(g.id, input.id),
      columns: { id: true, isDeleted: true },
    });

    if (!group || group.isDeleted) {
      throw new ORPCError("NOT_FOUND", { message: "Group not found" });
    }

    await context.db.transaction(async (tx) => {
      await tx
        .update(tripParticipants)
        .set({ groupId: null })
        .where(eq(tripParticipants.groupId, input.id));

      await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, input.id));

      await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, input.id));
    });

    return { success: true };
  }),
  deleteMyGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureTripNotEndedByGroupId(context.db, input.groupId);

      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        columns: { id: true, organizerId: true, isDeleted: true, tripId: true },
      });

      if (!group || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      if (group.organizerId !== context.dbUser.id) {
        throw new ORPCError("FORBIDDEN", { message: "Only group organizer can delete this group" });
      }

      await context.db.transaction(async (tx) => {
        await tx
          .update(tripParticipants)
          .set({ groupId: null })
          .where(eq(tripParticipants.groupId, input.groupId));

        await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, input.groupId));

        await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, input.groupId));
      });

      return { success: true };
    }),
  join: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.id),
        with: {
          participants: {
            columns: { id: true, userId: true, tripId: true, groupId: true },
          },
        },
      });
      if (!group) throw new ORPCError("NOT_FOUND", { message: "Group not found" });

      if (group.tripId !== input.tripId || group.isDeleted) {
        throw new ORPCError("BAD_REQUEST", { message: "Group not in trip" });
      }

      // Check if user is already in the group
      const existingMembership = group.participants.find(
        (member) => member.userId === context.dbUser.id,
      );

      if (existingMembership) {
        throw new ORPCError("CONFLICT", { message: "Użytkownik już należy do tej grupy" });
      }

      const [participant] = await context.db.transaction(async (tx) => {
        const [upsertedParticipant] = await tx
          .insert(tripParticipants)
          .values({
            userId: context.dbUser.id,
            tripId: input.tripId,
            groupId: input.id,
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: input.id },
          })
          .returning();

        await tx
          .delete(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.tripId, input.tripId),
              eq(groupJoinRequests.userId, context.dbUser.id),
            ),
          );

        return [upsertedParticipant];
      });

      return participant;
    }),
  requestToJoin: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureTripNotEndedByGroupId(context.db, input.groupId);

      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        columns: { id: true, tripId: true, organizerId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      const participant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { and, eq }) =>
          and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, group.tripId)),
        columns: { groupId: true },
      });

      if (!participant) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only trip participants can request joining a group",
        });
      }

      if (participant.groupId) {
        throw new ORPCError("BAD_REQUEST", { message: "You are already in a group" });
      }

      const existingRequest = await context.db.query.groupJoinRequests.findFirst({
        where: (gjr, { and, eq }) =>
          and(eq(gjr.tripId, group.tripId), eq(gjr.userId, context.dbUser.id)),
      });

      if (existingRequest) {
        if (existingRequest.groupId === group.id) {
          throw new ORPCError("CONFLICT", {
            message: "Join request for this group is already pending",
          });
        }

        throw new ORPCError("CONFLICT", {
          message: "You already have a pending request for another group",
        });
      }

      const [request] = await context.db
        .insert(groupJoinRequests)
        .values({
          groupId: group.id,
          tripId: group.tripId,
          userId: context.dbUser.id,
        })
        .returning();

      return request;
    }),
  getMyJoinRequestForGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(async ({ context, input }) => {
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        columns: { id: true, tripId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      return await context.db.query.groupJoinRequests.findFirst({
        where: (gjr, { and, eq }) =>
          and(
            eq(gjr.groupId, group.id),
            eq(gjr.tripId, group.tripId),
            eq(gjr.userId, context.dbUser.id),
          ),
        orderBy: (gjr, { desc }) => [desc(gjr.createdAt)],
      });
    }),
  cancelMyJoinRequest: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureTripNotEndedByGroupId(context.db, input.groupId);

      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        columns: { id: true, tripId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      const existingRequest = await context.db.query.groupJoinRequests.findFirst({
        where: (gjr, { and, eq }) =>
          and(
            eq(gjr.groupId, group.id),
            eq(gjr.tripId, group.tripId),
            eq(gjr.userId, context.dbUser.id),
          ),
        columns: { id: true },
      });

      if (!existingRequest) {
        throw new ORPCError("NOT_FOUND", { message: "Join request not found" });
      }

      await context.db
        .delete(groupJoinRequests)
        .where(eq(groupJoinRequests.id, existingRequest.id));

      return { success: true };
    }),
  getPendingJoinRequests: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(async ({ context, input }) => {
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        columns: { id: true, organizerId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      if (group.organizerId !== context.dbUser.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only group organizer can view join requests",
        });
      }

      const requests = await context.db.query.groupJoinRequests.findMany({
        where: (gjr, { eq }) => eq(gjr.groupId, group.id),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
        orderBy: (gjr, { asc }) => [asc(gjr.createdAt)],
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        context.supabase,
        requests.map((request) => request.user.authUserId),
      );

      return requests.map((request) => ({
        ...request,
        user: toUserWithEmail(request.user, emailByAuthUserId),
      }));
    }),
  respondToJoinRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        decision: joinRequestDecisionSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.transaction(async (tx) => {
        const request = await tx.query.groupJoinRequests.findFirst({
          where: (gjr, { eq }) => eq(gjr.id, input.requestId),
          with: {
            group: {
              columns: {
                id: true,
                tripId: true,
                organizerId: true,
                isDeleted: true,
              },
            },
          },
        });

        if (!request) {
          throw new ORPCError("NOT_FOUND", { message: "Join request not found" });
        }

        await ensureTripNotEnded(context.db, request.tripId);

        if (request.group.organizerId !== context.dbUser.id) {
          throw new ORPCError("FORBIDDEN", {
            message: "Only group organizer can respond to join requests",
          });
        }

        if (request.group.isDeleted) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }

        if (input.decision === "REJECT") {
          await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.id, request.id));
          return { status: "REJECTED" as const };
        }

        const participant = await tx.query.tripParticipants.findFirst({
          where: (tp, { and, eq }) =>
            and(eq(tp.userId, request.userId), eq(tp.tripId, request.tripId)),
          columns: { id: true, groupId: true },
        });

        if (!participant) {
          throw new ORPCError("BAD_REQUEST", { message: "User is not a participant of this trip" });
        }

        if (participant.groupId && participant.groupId !== request.groupId) {
          throw new ORPCError("BAD_REQUEST", { message: "User is already in another group" });
        }

        await tx
          .update(tripParticipants)
          .set({ groupId: request.groupId })
          .where(eq(tripParticipants.id, participant.id));

        await tx
          .delete(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.tripId, request.tripId),
              eq(groupJoinRequests.userId, request.userId),
            ),
          );

        return { status: "ACCEPTED" as const };
      });
    }),
  assignUserToGroup: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
        groupId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEnded(context.db, input.tripId);
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        with: {
          participants: true,
        },
      });
      if (!group) throw new ORPCError("NOT_FOUND", { message: "Group not found" });

      if (group.tripId !== input.tripId || group.isDeleted) {
        throw new ORPCError("BAD_REQUEST", { message: "Group not in trip" });
      }

      // Check if user is already in the group
      const existingMembership = group.participants.find(
        (member) => member.userId === input.userId,
      );

      if (existingMembership) {
        throw new ORPCError("CONFLICT", { message: "Użytkownik już należy do tej grupy" });
      }

      const [participant] = await context.db.transaction(async (tx) => {
        const [upsertedParticipant] = await tx
          .insert(tripParticipants)
          .values({
            userId: input.userId,
            tripId: input.tripId,
            groupId: input.groupId,
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: input.groupId },
          })
          .returning();

        await tx
          .delete(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.tripId, input.tripId),
              eq(groupJoinRequests.userId, input.userId),
            ),
          );

        return [upsertedParticipant];
      });

      return participant;
    }),

  bulkAssignUsersToGroup: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        userIds: z.array(z.string()).min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEnded(context.db, input.tripId);
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        columns: { organizerId: true, tripId: true, isDeleted: true },
      });

      if (group?.tripId !== input.tripId || group?.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      if (group?.organizerId !== context.dbUser.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only the organizer can assign users to this group",
        });
      }

      const uniqueUserIds = Array.from(new Set(input.userIds));

      await context.db.transaction(async (tx) => {
        await Promise.all(
          uniqueUserIds.map((userId) =>
            tx
              .insert(tripParticipants)
              .values({
                userId,
                tripId: input.tripId,
                groupId: input.groupId,
              })
              .onConflictDoUpdate({
                target: [tripParticipants.userId, tripParticipants.tripId],
                set: { groupId: input.groupId },
              }),
          ),
        );
        await tx
          .delete(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.tripId, input.tripId),
              inArray(groupJoinRequests.userId, uniqueUserIds),
            ),
          );
      });

      const participants = await context.db.query.tripParticipants.findMany({
        where: (tp, { and, eq, inArray }) =>
          and(eq(tp.tripId, input.tripId), inArray(tp.userId, uniqueUserIds)),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        context.supabase,
        participants.map((participant) => participant.user.authUserId),
      );

      return {
        count: participants.length,
        participants: participants.map((participant) => ({
          ...participant,
          user: toUserWithEmail(participant.user, emailByAuthUserId),
        })),
      };
    }),

  // Remove user from a group
  removeUserFromGroup: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEnded(context.db, input.tripId);
      return await context.db.transaction(async (tx) => {
        const participant = await tx.query.tripParticipants.findFirst({
          where: (tp, { and, eq }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
          columns: { id: true, groupId: true, userId: true },
        });

        if (!participant) {
          throw new ORPCError("NOT_FOUND", { message: "Participant not found" });
        }

        const group = participant.groupId
          ? await tx.query.groups.findFirst({
              where: (g, { eq }) => eq(g.id, participant.groupId!),
              columns: {
                id: true,
                tripId: true,
                organizerId: true,
                isDeleted: true,
              },
            })
          : null;

        if (
          participant.groupId &&
          (!group?.tripId || group.tripId !== input.tripId || group.isDeleted)
        ) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }

        const isAdmin = context.dbUser.role === "ADMIN";
        const isOrganizer = Boolean(group?.organizerId && group.organizerId === context.dbUser.id);

        if (!isAdmin && !isOrganizer) {
          throw new ORPCError("FORBIDDEN", {
            message: "Only group organizer or admin can remove members",
          });
        }

        if (!isAdmin && participant.userId === group?.organizerId) {
          throw new ORPCError("FORBIDDEN", {
            message: "Group leader cannot be removed by organizer",
          });
        }

        const [updated] = await tx
          .update(tripParticipants)
          .set({ groupId: null })
          .where(eq(tripParticipants.id, participant.id))
          .returning();

        if (participant.groupId) {
          const membersLeftResult = await tx
            .select({ count: count() })
            .from(tripParticipants)
            .where(
              and(
                eq(tripParticipants.tripId, input.tripId),
                eq(tripParticipants.groupId, participant.groupId),
              ),
            );
          const membersLeft = membersLeftResult[0]?.count ?? 0;

          if (membersLeft === 0) {
            await tx
              .delete(groupJoinRequests)
              .where(eq(groupJoinRequests.groupId, participant.groupId));
            await tx
              .update(groups)
              .set({ isDeleted: true })
              .where(eq(groups.id, participant.groupId));
          } else if (group?.organizerId && participant.userId === group.organizerId) {
            const nextOrganizer = await tx.query.tripParticipants.findFirst({
              where: (tp, { and, eq }) =>
                and(eq(tp.tripId, input.tripId), eq(tp.groupId, participant.groupId!)),
              orderBy: (tp, { asc }) => [asc(tp.createdAt)],
              columns: { userId: true },
            });

            if (nextOrganizer) {
              await tx
                .update(groups)
                .set({ organizerId: nextOrganizer.userId })
                .where(eq(groups.id, participant.groupId));
            }
          }
        }

        return updated;
      });
    }),
  leaveMyGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEndedByGroupId(context.db, input.groupId);

      const group = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, input.groupId),
        columns: { id: true, tripId: true, organizerId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new ORPCError("NOT_FOUND", { message: "Group not found" });
      }

      const membership = await context.db.query.tripParticipants.findFirst({
        where: (tp, { and, eq }) =>
          and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, group.tripId)),
        columns: { groupId: true },
      });

      if (membership?.groupId !== group.id) {
        throw new ORPCError("FORBIDDEN", { message: "You are not a member of this group" });
      }

      const isOrganizer = group.organizerId === context.dbUser.id;

      if (!isOrganizer) {
        return await context.db.transaction(async (tx) => {
          await tx
            .update(tripParticipants)
            .set({ groupId: null })
            .where(
              and(
                eq(tripParticipants.userId, context.dbUser.id),
                eq(tripParticipants.tripId, group.tripId),
              ),
            );

          const membersLeftResult = await tx
            .select({ count: count() })
            .from(tripParticipants)
            .where(
              and(
                eq(tripParticipants.tripId, group.tripId),
                eq(tripParticipants.groupId, group.id),
              ),
            );
          const membersLeft = membersLeftResult[0]?.count ?? 0;

          if (membersLeft === 0) {
            await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, group.id));
            await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, group.id));
            return {
              left: true,
              reassignedOrganizerId: null,
              groupDeleted: true,
            };
          }

          return {
            left: true,
            reassignedOrganizerId: null,
            groupDeleted: false,
          };
        });
      }

      const remainingParticipants = await context.db.query.tripParticipants.findMany({
        where: (tp, { and, eq, ne }) =>
          and(
            eq(tp.tripId, group.tripId),
            eq(tp.groupId, group.id),
            ne(tp.userId, context.dbUser.id),
          ),
        orderBy: (tp, { asc }) => [asc(tp.createdAt)],
        columns: { userId: true },
      });

      const nextOrganizerId = remainingParticipants[0]?.userId ?? null;

      await context.db.transaction(async (tx) => {
        if (nextOrganizerId) {
          await tx
            .update(groups)
            .set({ organizerId: nextOrganizerId })
            .where(eq(groups.id, group.id));
        } else {
          await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, group.id));
          await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, group.id));
        }

        await tx
          .update(tripParticipants)
          .set({ groupId: null })
          .where(
            and(
              eq(tripParticipants.userId, context.dbUser.id),
              eq(tripParticipants.tripId, group.tripId),
            ),
          );
      });

      return {
        left: true,
        reassignedOrganizerId: nextOrganizerId,
        groupDeleted: !nextOrganizerId,
      };
    }),
  addCoins: moderatorProcedure
    .input(z.object({ groupId: z.string(), amount: z.number(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      return await context.db.transaction(async (tx) => {
        const previousRankingSnapshot = await captureTripRankingSnapshot(tx, input.tripId);

        const group = await tx.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
          columns: { id: true, tripId: true, isDeleted: true, coins: true },
        });
        if (group?.tripId !== input.tripId || group?.isDeleted) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }
        // Update group coins
        await tx
          .update(groups)
          .set({ coins: (group.coins ?? 0) + input.amount })
          .where(eq(groups.id, input.groupId));

        // Create transaction record
        const [transaction] = await tx
          .insert(coinTransactions)
          .values({
            groupId: input.groupId,
            amount: input.amount,
            adminId: context.dbUser.id,
          })
          .returning();

        if (!transaction) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create transaction" });
        }

        const transactionWithGroup = await tx.query.coinTransactions.findFirst({
          where: (ct, { eq }) => eq(ct.id, transaction.id),
          with: {
            group: {
              columns: {
                id: true,
                name: true,
                coins: true,
              },
            },
          },
        });

        await createRankChangeActivities({
          tx,
          tripId: input.tripId,
          previousSnapshot: previousRankingSnapshot,
          createdByAdmin: context.dbUser.id,
        });

        return transactionWithGroup;
      });
    }),
  ranking: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const currentDate = new Date();
      const data = await context.db.query.groups.findMany({
        where: (g, { and, eq }) => and(eq(g.tripId, input.tripId), eq(g.isDeleted, false)),
        orderBy: (g, { desc }) => [desc(g.coins)],
        with: {
          organizer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          participants: {
            with: {
              user: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  authUserId: true,
                },
              },
            },
          },
          coinTransactions: {
            with: {
              admin: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: (ct, { desc }) => [desc(ct.createdAt)],
          },
        },
      });

      // Use optimized batch email lookup
      const emailByAuthUserId = await batchEmailLookup(context.supabase, data);

      return {
        data: await Promise.all(
          data.map(async (group) => ({
            ...group,
            image: await resolveGroupImage(context.supabase, group.image),
            organizer: group.organizer
              ? toUserWithEmail(group.organizer, emailByAuthUserId)
              : group.organizer,
            participants: group.participants.map((participant) => ({
              ...participant,
              user: toUserWithEmail(participant.user, emailByAuthUserId),
            })),
          })),
        ),
        currentDate,
      };
    }),
});
