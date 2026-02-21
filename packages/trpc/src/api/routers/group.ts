import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@integral-2025-app/supabase";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";
import { normalizeSupabaseStoragePath } from "../../utils/storage";
import {
  captureTripRankingSnapshot,
  createRankChangeActivities,
} from "../../utils/activityFeed";

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

const generateFourDigitCode = () =>
  String(Math.floor(1000 + Math.random() * 9000));

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

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Image must be a valid URL or storage path")
  .optional();

const normalizeGroupImageInput = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeSupabaseStoragePath(value);
  if (normalized) {
    return normalized.storagePath;
  }
  return value;
};

const resolveGroupImage = async (
  supabase: SupabaseClient,
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

export const groupRouter = createTRPCRouter({
  getAllNames: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findMany({
        select: {
          id: true,
          name: true,
        },
        where: { tripId: input.tripId, isDeleted: false },
      });
    }),
  getMy: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: { userId: ctx.dbUser.id, tripId: input.tripId },
        },
        select: { groupId: true },
      });
      if (!participant?.groupId) return null;
      const group = await ctx.db.group.findUnique({
        where: { id: participant.groupId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  authUserId: true,
                },
              },
            },
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          coinTransactions: {
            include: {
              admin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!group || group.isDeleted) return null;

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        group.organizer?.authUserId,
        ...group.participants.map((participant) => participant.user.authUserId),
      ]);

      return {
        ...group,
        image: await resolveGroupImage(ctx.supabase, group.image),
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
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const groups = await ctx.db.group.findMany({
        where: { tripId: input.tripId, isDeleted: false },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  authUserId: true,
                },
              },
            },
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          coinTransactions: {
            include: {
              admin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10, // Last 10 transactions
          },
        },
        orderBy: { name: "asc" },
      });

      // Use optimized batch email lookup
      const emailByAuthUserId = await batchEmailLookup(ctx.supabase, groups);

      return await Promise.all(
        groups.map(async (group) => ({
          ...group,
          image: await resolveGroupImage(ctx.supabase, group.image),
          organizer: group.organizer
            ? toUserWithEmail(group.organizer, emailByAuthUserId)
            : group.organizer,
          participants: group.participants.map((participant) => ({
            ...participant,
            user: toUserWithEmail(participant.user, emailByAuthUserId),
          })),
        })),
      );
    }),
  getGroupList: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const groups = await ctx.db.group.findMany({
        where: { tripId: input.tripId, isDeleted: false },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          code: true,
          coins: true,
          organizer: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { participants: true },
          },
        },
      });

      return await Promise.all(
        groups.map(async (group) => ({
          ...group,
          image: await resolveGroupImage(ctx.supabase, group.image),
        })),
      );
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: {
              user: {
                select: {
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
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          trip: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { participants: true },
          },
          challengeSubmissions: {
            where: {
              status: "APPROVED",
            },
            select: {
              id: true,
              imageIds: true,
              createdAt: true,
              reviewedAt: true,
              challenge: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
          },
        },
      });

      if (!group || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
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
        image: await resolveGroupImage(ctx.supabase, group.image),
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
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findFirst({
        where: { id: input.groupId, isDeleted: false },
        select: {
          id: true,
          name: true,
          code: true,
          coins: true,
          _count: { select: { participants: true } },
          organizer: { select: { id: true, firstName: true, lastName: true } },
        },
      });
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
    .mutation(async ({ ctx, input }) => {
      const group = await (async () => {
        for (let attempt = 0; attempt < 30; attempt += 1) {
          const code = generateFourDigitCode();
          try {
            return await ctx.db.group.create({
              data: {
                name: input.name,
                description: input.description,
                image: normalizeGroupImageInput(input.image),
                code,
                tripId: input.tripId,
                organizerId: input.organizerId ?? ctx.dbUser.id,
              },
              include: {
                organizer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    authUserId: true,
                  },
                },
              },
            });
          } catch (error: unknown) {
            let prismaCode = "";
            if (
              typeof error === "object" &&
              error !== null &&
              "code" in error
            ) {
              const code = (error as { code?: unknown }).code;
              if (typeof code === "string") {
                prismaCode = code;
              }
            }
            if (prismaCode === "P2002") {
              continue;
            }
            throw error;
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate a unique group code",
        });
      })();

      // Add creator as a member of the group
      await ctx.db.tripParticipant.upsert({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.tripId,
          },
        },
        create: {
          userId: ctx.dbUser.id,
          tripId: input.tripId,
          groupId: group.id,
        },
        update: {
          groupId: group.id,
        },
      });
      await ctx.db.groupJoinRequest.deleteMany({
        where: {
          tripId: input.tripId,
          userId: ctx.dbUser.id,
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        group.organizer?.authUserId,
      ]);

      return {
        ...group,
        image: await resolveGroupImage(ctx.supabase, group.image),
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
    .mutation(async ({ ctx, input }) => {
      const { id, tripId, ...updateData } = input;
      const group = await ctx.db.group.findUnique({ where: { id } });
      if (group?.tripId !== tripId || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const isAdmin = ctx.dbUser.role === "ADMIN";
      const isOrganizer = group.organizerId === ctx.dbUser.id;

      if (!isAdmin && !isOrganizer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only group organizer or admin can update this group",
        });
      }

      if (
        !isAdmin &&
        updateData.organizerId &&
        updateData.organizerId !== group.organizerId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin can change group organizer",
        });
      }

      const updatedGroup = await ctx.db.group.update({
        where: { id },
        data: {
          ...updateData,
          organizerId: isAdmin ? updateData.organizerId : undefined,
          image: normalizeGroupImageInput(input.image),
        },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        updatedGroup.organizer?.authUserId,
      ]);

      return {
        ...updatedGroup,
        image: await resolveGroupImage(ctx.supabase, updatedGroup.image),
        organizer: updatedGroup.organizer
          ? toUserWithEmail(updatedGroup.organizer, emailByAuthUserId)
          : updatedGroup.organizer,
      };
    }),

  // Delete a group
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.id },
        select: { id: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.tripParticipant.updateMany({
          where: { groupId: input.id },
          data: { groupId: null },
        });
        await tx.groupJoinRequest.deleteMany({
          where: { groupId: input.id },
        });
        await tx.group.update({
          where: { id: input.id },
          data: { isDeleted: true },
        });
      });

      return { success: true };
    }),
  deleteMyGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, organizerId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      if (group.organizerId !== ctx.dbUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only group organizer can delete this group",
        });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.tripParticipant.updateMany({
          where: { groupId: input.groupId },
          data: { groupId: null },
        });
        await tx.groupJoinRequest.deleteMany({
          where: { groupId: input.groupId },
        });
        await tx.group.update({
          where: { id: input.groupId },
          data: { isDeleted: true },
        });
      });

      return { success: true };
    }),
  join: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            select: { id: true, userId: true, tripId: true, groupId: true },
          },
        },
      });
      if (!group)
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      if (group.tripId !== input.tripId || group.isDeleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Group not in trip",
        });
      }

      // Check if user is already in the group
      const existingMembership = group.participants.find(
        (member) => member.userId === ctx.dbUser.id,
      );

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Użytkownik już należy do tej grupy",
        });
      }

      const participant = await ctx.db.tripParticipant.upsert({
        where: {
          userId_tripId: { userId: ctx.dbUser.id, tripId: input.tripId },
        },
        create: {
          userId: ctx.dbUser.id,
          tripId: input.tripId,
          groupId: input.id,
        },
        update: { groupId: input.id },
      });
      await ctx.db.groupJoinRequest.deleteMany({
        where: {
          tripId: input.tripId,
          userId: ctx.dbUser.id,
        },
      });
      return participant;
    }),
  requestToJoin: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, tripId: true, organizerId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: group.tripId,
          },
        },
        select: { groupId: true },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only trip participants can request joining a group",
        });
      }

      if (participant.groupId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already in a group",
        });
      }

      const existingRequest = await ctx.db.groupJoinRequest.findUnique({
        where: {
          tripId_userId: {
            tripId: group.tripId,
            userId: ctx.dbUser.id,
          },
        },
      });

      if (existingRequest) {
        if (existingRequest.groupId === group.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Join request for this group is already pending",
          });
        }

        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending request for another group",
        });
      }

      return await ctx.db.groupJoinRequest.create({
        data: {
          groupId: group.id,
          tripId: group.tripId,
          userId: ctx.dbUser.id,
        },
      });
    }),
  getMyJoinRequestForGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, tripId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      return await ctx.db.groupJoinRequest.findFirst({
        where: {
          groupId: group.id,
          tripId: group.tripId,
          userId: ctx.dbUser.id,
        },
        orderBy: { createdAt: "desc" },
      });
    }),
  getPendingJoinRequests: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, organizerId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      if (group.organizerId !== ctx.dbUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only group organizer can view join requests",
        });
      }

      const requests = await ctx.db.groupJoinRequest.findMany({
        where: { groupId: group.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
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
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const request = await tx.groupJoinRequest.findUnique({
          where: { id: input.requestId },
          include: {
            group: {
              select: {
                id: true,
                tripId: true,
                organizerId: true,
                isDeleted: true,
              },
            },
          },
        });

        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Join request not found",
          });
        }

        if (request.group.organizerId !== ctx.dbUser.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only group organizer can respond to join requests",
          });
        }

        if (request.group.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        if (input.decision === "REJECT") {
          await tx.groupJoinRequest.delete({ where: { id: request.id } });
          return { status: "REJECTED" as const };
        }

        const participant = await tx.tripParticipant.findUnique({
          where: {
            userId_tripId: {
              userId: request.userId,
              tripId: request.tripId,
            },
          },
          select: { id: true, groupId: true },
        });

        if (!participant) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is not a participant of this trip",
          });
        }

        if (participant.groupId && participant.groupId !== request.groupId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is already in another group",
          });
        }

        await tx.tripParticipant.update({
          where: { id: participant.id },
          data: { groupId: request.groupId },
        });

        await tx.groupJoinRequest.deleteMany({
          where: {
            tripId: request.tripId,
            userId: request.userId,
          },
        });

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
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        include: { participants: true },
      });
      if (!group)
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      if (group.tripId !== input.tripId || group.isDeleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Group not in trip",
        });
      }

      // Check if user is already in the group
      const existingMembership = group.participants.find(
        (member) => member.userId === input.userId,
      );

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Użytkownik już należy do tej grupy",
        });
      }

      const participant = await ctx.db.tripParticipant.upsert({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        create: {
          userId: input.userId,
          tripId: input.tripId,
          groupId: input.groupId,
        },
        update: { groupId: input.groupId },
      });
      await ctx.db.groupJoinRequest.deleteMany({
        where: {
          tripId: input.tripId,
          userId: input.userId,
        },
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
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { organizerId: true, tripId: true, isDeleted: true },
      });

      if (group?.tripId !== input.tripId || group?.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      if (group?.organizerId !== ctx.dbUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the organizer can assign users to this group",
        });
      }

      const uniqueUserIds = Array.from(new Set(input.userIds));

      await ctx.db.$transaction(
        uniqueUserIds.map((userId) =>
          ctx.db.tripParticipant.upsert({
            where: {
              userId_tripId: { userId, tripId: input.tripId },
            },
            create: {
              userId,
              tripId: input.tripId,
              groupId: input.groupId,
            },
            update: { groupId: input.groupId },
          }),
        ),
      );
      await ctx.db.groupJoinRequest.deleteMany({
        where: {
          tripId: input.tripId,
          userId: { in: uniqueUserIds },
        },
      });

      const participants = await ctx.db.tripParticipant.findMany({
        where: {
          tripId: input.tripId,
          userId: { in: uniqueUserIds },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
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
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const participant = await tx.tripParticipant.findUnique({
          where: {
            userId_tripId: { userId: input.userId, tripId: input.tripId },
          },
          select: { id: true, groupId: true, userId: true },
        });

        if (!participant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Participant not found",
          });
        }

        const group = participant.groupId
          ? await tx.group.findUnique({
              where: { id: participant.groupId },
              select: {
                id: true,
                tripId: true,
                organizerId: true,
                isDeleted: true,
              },
            })
          : null;

        if (
          participant.groupId &&
          (!group || group.tripId !== input.tripId || group.isDeleted)
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        const isAdmin = ctx.dbUser.role === "ADMIN";
        const isOrganizer = Boolean(
          group && group.organizerId === ctx.dbUser.id,
        );

        if (!isAdmin && !isOrganizer) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only group organizer or admin can remove members",
          });
        }

        if (!isAdmin && participant.userId === group?.organizerId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Group leader cannot be removed by organizer",
          });
        }

        const updated = await tx.tripParticipant.update({
          where: {
            userId_tripId: { userId: input.userId, tripId: input.tripId },
          },
          data: { groupId: null },
        });

        if (participant.groupId) {
          const membersLeft = await tx.tripParticipant.count({
            where: { tripId: input.tripId, groupId: participant.groupId },
          });
          if (membersLeft === 0) {
            await tx.groupJoinRequest.deleteMany({
              where: { groupId: participant.groupId },
            });
            await tx.group.update({
              where: { id: participant.groupId },
              data: { isDeleted: true },
            });
          } else if (group && participant.userId === group.organizerId) {
            const nextOrganizer = await tx.tripParticipant.findFirst({
              where: { tripId: input.tripId, groupId: participant.groupId },
              orderBy: { createdAt: "asc" },
              select: { userId: true },
            });

            if (nextOrganizer) {
              await tx.group.update({
                where: { id: participant.groupId },
                data: { organizerId: nextOrganizer.userId },
              });
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
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, tripId: true, organizerId: true, isDeleted: true },
      });

      if (!group || group.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const membership = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: group.tripId,
          },
        },
        select: { groupId: true },
      });

      if (membership?.groupId !== group.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const isOrganizer = group.organizerId === ctx.dbUser.id;

      if (!isOrganizer) {
        return await ctx.db.$transaction(async (tx) => {
          await tx.tripParticipant.update({
            where: {
              userId_tripId: {
                userId: ctx.dbUser.id,
                tripId: group.tripId,
              },
            },
            data: { groupId: null },
          });

          const membersLeft = await tx.tripParticipant.count({
            where: { tripId: group.tripId, groupId: group.id },
          });

          if (membersLeft === 0) {
            await tx.groupJoinRequest.deleteMany({
              where: { groupId: group.id },
            });
            await tx.group.update({
              where: { id: group.id },
              data: { isDeleted: true },
            });
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

      const remainingParticipants = await ctx.db.tripParticipant.findMany({
        where: {
          tripId: group.tripId,
          groupId: group.id,
          NOT: { userId: ctx.dbUser.id },
        },
        orderBy: { createdAt: "asc" },
        select: { userId: true },
      });

      const nextOrganizerId = remainingParticipants[0]?.userId ?? null;

      await ctx.db.$transaction(async (tx) => {
        if (nextOrganizerId) {
          await tx.group.update({
            where: { id: group.id },
            data: { organizerId: nextOrganizerId },
          });
        } else {
          await tx.groupJoinRequest.deleteMany({
            where: { groupId: group.id },
          });
          await tx.group.update({
            where: { id: group.id },
            data: { isDeleted: true },
          });
        }

        await tx.tripParticipant.update({
          where: {
            userId_tripId: {
              userId: ctx.dbUser.id,
              tripId: group.tripId,
            },
          },
          data: { groupId: null },
        });
      });

      return {
        left: true,
        reassignedOrganizerId: nextOrganizerId,
        groupDeleted: !nextOrganizerId,
      };
    }),
  addCoins: moderatorProcedure
    .input(
      z.object({ groupId: z.string(), amount: z.number(), tripId: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const previousRankingSnapshot = await captureTripRankingSnapshot(
          tx,
          input.tripId,
        );

        const group = await tx.group.findUnique({
          where: { id: input.groupId },
        });
        if (group?.tripId !== input.tripId || group?.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }
        // Update group coins
        await tx.group.update({
          where: { id: input.groupId },
          data: { coins: { increment: input.amount } },
        });

        // Create transaction record
        const transaction = await tx.coinTransaction.create({
          data: {
            groupId: input.groupId,
            amount: input.amount,
            adminId: ctx.dbUser.id,
          },
          include: {
            group: {
              select: {
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
          createdByAdmin: ctx.dbUser.id,
        });

        return transaction;
      });
    }),
  ranking: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentDate = new Date();
      const data = await ctx.db.group.findMany({
        where: { tripId: input.tripId, isDeleted: false },
        orderBy: { coins: "desc" },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
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
                },
              },
            },
          },
          coinTransactions: {
            include: {
              admin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      // Use optimized batch email lookup
      const emailByAuthUserId = await batchEmailLookup(ctx.supabase, data);

      return {
        data: await Promise.all(
          data.map(async (group) => ({
            ...group,
            image: await resolveGroupImage(ctx.supabase, group.image),
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
