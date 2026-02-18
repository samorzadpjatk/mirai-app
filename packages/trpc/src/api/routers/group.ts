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
  }[]
) => {
  // Collect all unique authUserIds
  const allAuthUserIds = new Set<string>();
  
  groups.forEach(group => {
    if (group.organizer?.authUserId) {
      allAuthUserIds.add(group.organizer.authUserId);
    }
    group.participants.forEach(participant => {
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
        where: { tripId: input.tripId },
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

      if (!group) return null;

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        [
          group.organizer?.authUserId,
          ...group.participants.map((participant) => participant.user.authUserId),
        ],
      );

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
        where: { tripId: input.tripId },
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
        where: { tripId: input.tripId },
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
        },
      });

      if (!group) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        [
          group.organizer?.authUserId,
          ...group.participants.map((participant) => participant.user.authUserId),
        ],
      );

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
  getByIdWithOrganizer: moderatorProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findUnique({
        where: { id: input.groupId },
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
            const prismaCode =
              typeof error === "object" && error !== null && "code" in error
                ? String((error as { code?: unknown }).code ?? "")
                : "";
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
  update: adminProcedure
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
      if (group?.tripId !== tripId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }
      const updatedGroup = await ctx.db.group.update({
        where: { id },
        data: {
          ...updateData,
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
      // First, delete all related records
      await ctx.db.tripParticipant.updateMany({
        where: { groupId: input.id },
        data: { groupId: null },
      });

      await ctx.db.coinTransaction.deleteMany({
        where: { groupId: input.id },
      });

      return await ctx.db.group.delete({
        where: { id: input.id },
      });
    }),
  join: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.id },
        include: { participants: { select: { id: true, userId: true, tripId: true, groupId: true } } },
      });
      if (!group)
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      if (group.tripId !== input.tripId) {
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

      return await ctx.db.tripParticipant.upsert({
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

      if (group.tripId !== input.tripId) {
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

      return await ctx.db.tripParticipant.upsert({
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
        select: { organizerId: true, tripId: true },
      });

      if (group?.tripId !== input.tripId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      if (group.organizerId !== ctx.dbUser.id) {
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
  removeUserFromGroup: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tripParticipant.update({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        data: { groupId: null },
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
        select: { id: true, tripId: true, organizerId: true },
      });

      if (!group) {
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

      if (!membership || membership.groupId !== group.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      const isOrganizer = group.organizerId === ctx.dbUser.id;

      if (!isOrganizer) {
        await ctx.db.tripParticipant.update({
          where: {
            userId_tripId: {
              userId: ctx.dbUser.id,
              tripId: group.tripId,
            },
          },
          data: { groupId: null },
        });

        return { left: true, reassignedOrganizerId: null };
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
      };
    }),
  addCoins: moderatorProcedure
    .input(
      z.object({ groupId: z.string(), amount: z.number(), tripId: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
      });
      if (group?.tripId !== input.tripId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }
      // Update group coins
      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { increment: input.amount } },
      });

      // Create transaction record
      const transaction = await ctx.db.coinTransaction.create({
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

      return transaction;
    }),
  ranking: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentDate = new Date();
      const data = await ctx.db.group.findMany({
        where: { tripId: input.tripId },
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
