import { z } from "zod";
import { TRPCError } from "../../api/trpc";
import {
  createORPCRouter,
  moderatorProcedure,
  adminProcedure,
  protectedProcedure,
  publicProcedure,
} from "../../api/trpc";
import {
  buildAuthEmailLookup,
  buildAuthUserSummaryLookup,
  resolveAuthEmail,
} from "../../utils/authEmails";
import type { SupabaseUser } from "@mirai-app/supabase";
const roleSchema = z.enum(["USER", "ADMIN", "MODERATOR", "SERVICE"]);
const nameSchema = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters")
  .max(100, "Must be at most 100 characters")
  .refine((value) => !/\d/.test(value), "Cannot contain digits");

interface PublicUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: z.infer<typeof roleSchema>;
  bannedUntil?: string | null;
  banReason?: string | null;
  isBanned?: boolean;
}

const userWithAuthSelect = {
  id: true,
  authUserId: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

const formatUserFullName = (user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) => {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;
  if (user?.firstName) return user.firstName;
  if (user?.lastName) return user.lastName;
  return user?.email ?? "Unknown user";
};

interface SupabaseAdminMetadata {
  ban_reason?: string | null;
  role?: string | null;
  [key: string]: unknown;
}

interface SupabaseAdminUser extends SupabaseUser {
  banned_until?: string;
  app_metadata: SupabaseUser["app_metadata"] & SupabaseAdminMetadata;
}

const toPublicUser = (
  user: {
    id: string;
    authUserId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: z.infer<typeof roleSchema>;
  },
  emailByAuthUserId: Map<string, string | null>,
): PublicUser => ({
  id: user.id,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null,
  role: user.role,
  email: resolveAuthEmail(emailByAuthUserId, user.authUserId),
});

const toPublicUserWithAuthSummary = (
  user: {
    id: string;
    authUserId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: z.infer<typeof roleSchema>;
  },
  authByAuthUserId: Map<
    string,
    { email: string | null; bannedUntil: string | null; banReason: string | null; isBanned: boolean }
  >,
): PublicUser => {
  const summary = user.authUserId
    ? authByAuthUserId.get(user.authUserId) ?? null
    : null;
  return {
    id: user.id,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    role: user.role,
    email: summary?.email ?? null,
    bannedUntil: summary?.bannedUntil ?? null,
    banReason: summary?.banReason ?? null,
    isBanned: summary?.isBanned ?? false,
  };
};

export const userRouter = createORPCRouter({
  getBanStatus: publicProcedure.handler(async ({ context }) => {
    if (!context.accessToken) {
      return { banned: false, bannedUntil: null, reason: null };
    }

    const { data, error } = await context.supabase.auth.getUser(context.accessToken);
    if (error || !data.user) {
      return { banned: false, bannedUntil: null, reason: null };
    }

    const adminLookup = await context.supabase.auth.admin.getUserById(data.user.id);
    if (adminLookup.error) {
      console.warn(
        `[Auth] Failed to check ban status for ${data.user.id}: ${adminLookup.error.message}`,
      );
      return { banned: false, bannedUntil: null, reason: null };
    }

    const adminUser = adminLookup.data.user as SupabaseAdminUser | null;
    const bannedUntilRaw = adminUser?.banned_until ?? null;
    const reasonRaw = adminUser?.app_metadata?.ban_reason ?? null;

    if (!bannedUntilRaw) {
      return { banned: false, bannedUntil: null, reason: null };
    }

    const bannedUntil = new Date(bannedUntilRaw);
    if (Number.isNaN(bannedUntil.getTime()) || bannedUntil.getTime() <= Date.now()) {
      return { banned: false, bannedUntil: null, reason: null };
    }

    return {
      banned: true,
      bannedUntil: bannedUntil.toISOString(),
      reason: reasonRaw ?? "Temporary ban",
    };
  }),
  getBanStatusByEmail: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email("Invalid email"),
      }),
    )
    .handler(async ({ context, input }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const perPage = 1000;
      let page = 1;
      let authUserId: string | null = null;

      while (true) {
        const { data, error } = await context.supabase.auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        const found = data?.users?.find(
          (user) => user.email?.toLowerCase() === normalizedEmail,
        );

        if (found?.id) {
          authUserId = found.id;
          break;
        }

        if (!data || data.users.length < perPage) {
          break;
        }

        page += 1;
      }

      if (!authUserId) {
        return { exists: false, banned: false, bannedUntil: null, reason: null };
      }

      const lookup = await context.supabase.auth.admin.getUserById(authUserId);
      if (lookup.error || !lookup.data.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: lookup.error?.message ?? "Failed to fetch auth user",
        });
      }

      const adminUser = lookup.data.user as SupabaseAdminUser | null;
      const bannedUntilRaw = adminUser?.banned_until ?? null;
      const reasonRaw = adminUser?.app_metadata?.ban_reason ?? null;

      if (!bannedUntilRaw) {
        return { exists: true, banned: false, bannedUntil: null, reason: null };
      }

      const bannedUntil = new Date(bannedUntilRaw);
      if (Number.isNaN(bannedUntil.getTime()) || bannedUntil.getTime() <= Date.now()) {
        return { exists: true, banned: false, bannedUntil: null, reason: null };
      }

      return {
        exists: true,
        banned: true,
        bannedUntil: bannedUntil.toISOString(),
        reason: reasonRaw ?? "Temporary ban",
      };
    }),
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const dbUser = await context.db.user.findUnique({
        where: { id: input.id },
      });

      if (!dbUser) return null;

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        dbUser.authUserId,
      ]);

      return {
        ...dbUser,
        email: resolveAuthEmail(emailByAuthUserId, dbUser.authUserId),
      };
    }),
  getTripParticipant: moderatorProcedure
    .input(z.object({ userId: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      return context.db.tripParticipant.findUnique({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        select: {
          userId: true,
          tripId: true,
          wristNumber: true,
          houseNumber: true,
        },
      });
    }),
  getByIdWithGroup: moderatorProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      return await context.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          trips: {
            where: { tripId: input.tripId },
            include: {
              group: { select: { id: true, name: true } },
              trip: { select: { id: true, name: true } },
            },
          },
          organizerGroup: { select: { id: true, name: true } },
        },
      });
    }),
  getMyWithGroup: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      return await context.db.user.findUnique({
        where: { id: context.dbUser.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          trips: {
            where: { tripId: input.tripId },
            include: {
              group: { select: { id: true, name: true } },
              trip: { select: { id: true, name: true } },
            },
          },
          organizerGroup: { select: { id: true, name: true } },
        },
      });
    }),
  getMy: protectedProcedure
    .handler(async ({ context }) => {
      const baseUser = await context.db.user.findUnique({
        where: { id: context.dbUser.id },
      });
      if (!baseUser) return null;

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        baseUser.authUserId,
      ]);

      const hydratedUser = {
        ...baseUser,
        email: resolveAuthEmail(emailByAuthUserId, baseUser.authUserId),
      };

      return hydratedUser;
    }),
  updateAvatar: protectedProcedure
    .input(z.object({ hasAvatar: z.boolean() }))
    .handler(async ({ context, input }) => {
      const updatedUser = await context.db.user.update({
        where: { id: context.dbUser.id },
        data: { hasAvatar: input.hasAvatar },
        select: { hasAvatar: true },
      });

      return updatedUser;
    }),
  updateMyProfile: protectedProcedure
    .input(
      z.object({
        firstName: nameSchema,
        lastName: nameSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.user.update({
        where: { id: context.dbUser.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });
    }),
  getAll: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const participants = (await context.db.tripParticipant.findMany({
        where: { tripId: input.tripId },
        include: {
          user: {
            select: userWithAuthSelect,
          },
          group: { select: { id: true, name: true } },
        },
        orderBy: [
          { user: { firstName: "asc" } },
          { user: { lastName: "asc" } },
        ],
      }));

      const emailByAuthUserId = await buildAuthEmailLookup(
        context.supabase,
        participants.map((participant) => participant.user.authUserId),
      );

      return participants.map((participant) => ({
        ...toPublicUser(participant.user, emailByAuthUserId),
        wristNumber: participant.wristNumber,
        houseNumber: participant.houseNumber,
        group: participant.group,
        tripId: participant.tripId,
      }));
    }),
  getAllAdminsNames: moderatorProcedure.handler(async ({ context }) => {
    return await context.db.user.findMany({
      where: { role: roleSchema.enum.ADMIN },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  }),
  // Update user role
  updateUserAdminStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: roleSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      // Prevent admin from removing their own admin status
      if (
        input.userId === context.dbUser.id &&
        input.role !== roleSchema.enum.ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie możesz usunąć swoich uprawnień administratora",
        });
      }

      const updatedUser = await context.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: userWithAuthSelect,
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        updatedUser.authUserId,
      ]);

      return toPublicUser(updatedUser, emailByAuthUserId);
    }),
  createUser: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        firstName: z.string().trim().min(1, "Imię jest wymagane"),
        lastName: z.string().trim().min(1, "Nazwisko jest wymagane"),
        email: z.string().trim().email("Nieprawidłowy adres email"),
      }),
    )
    .handler(async ({ context, input }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const email = input.email.trim().toLowerCase();

      const { data, error } = await context.supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { firstName, lastName },
        app_metadata: { role: roleSchema.enum.USER },
      });

      if (error || !data?.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message ?? "Failed to create auth user",
        });
      }

      const authUserId = data.user.id;

      const result = await context.db.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { authUserId },
          select: userWithAuthSelect,
        });

        const dbUser =
          existingUser ??
          (await tx.user.create({
            data: {
              authUserId,
              firstName,
              lastName,
              role: roleSchema.enum.USER,
            },
            select: userWithAuthSelect,
          }));

        const participant = await tx.tripParticipant.upsert({
          where: {
            userId_tripId: { userId: dbUser.id, tripId: input.tripId },
          },
          update: {},
          create: {
            userId: dbUser.id,
            tripId: input.tripId,
          },
          select: {
            user: {
              select: userWithAuthSelect,
            },
            wristNumber: true,
            houseNumber: true,
            group: { select: { id: true, name: true } },
            tripId: true,
          },
        });

        return { participant, dbUser };
      });

      const emailByAuthUserId = new Map([
        [authUserId, data.user.email ?? email],
      ]);

      return {
        ...toPublicUser(result.participant.user, emailByAuthUserId),
        wristNumber: result.participant.wristNumber,
        houseNumber: result.participant.houseNumber,
        group: result.participant.group,
        tripId: result.participant.tripId,
      };
    }),
  updateName: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        firstName: z.string().trim().min(1, "Imię jest wymagane"),
        lastName: z.string().trim().min(1, "Nazwisko jest wymagane"),
      }),
    )
    .handler(async ({ context, input }) => {
      const updatedUser = await context.db.user.update({
        where: { id: input.userId },
        data: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
        },
        select: userWithAuthSelect,
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        updatedUser.authUserId,
      ]);

      return toPublicUser(updatedUser, emailByAuthUserId);
    }),
  banUserUntil: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        bannedUntilMs: z.number(),
        reason: z.string().trim().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const user = await context.db.user.findUnique({
        where: { id: input.userId },
        select: { authUserId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const bannedUntil = new Date(input.bannedUntilMs);

      if (Number.isNaN(bannedUntil.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid ban date",
        });
      }

      const diffMs = bannedUntil.getTime() - Date.now();
      if (diffMs <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ban date must be in the future",
        });
      }

      const diffMinutes = Math.ceil(diffMs / 60000);
      const banDuration = `${diffMinutes}m`;

      const adminUser = await context.supabase.auth.admin.getUserById(
        user.authUserId,
      );

      if (adminUser.error || !adminUser.data.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: adminUser.error?.message ?? "Failed to fetch auth user",
        });
      }

      const existingMetadata =
        (adminUser.data.user as SupabaseAdminUser | null)?.app_metadata ?? {};
      const reason = input.reason?.trim();
      const nextMetadata = {
        ...existingMetadata,
        ban_reason: reason && reason.length > 0 ? reason : null,
      };

      const { error } = await context.supabase.auth.admin.updateUserById(
        user.authUserId,
        { ban_duration: banDuration, app_metadata: nextMetadata },
      );

      if (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }

      return { bannedUntil: bannedUntil.toISOString() };
    }),
  deleteUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const user = await context.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, authUserId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const result = await context.db.$transaction(async (tx) => {
        const participant = await tx.tripParticipant.findUnique({
          where: {
            userId_tripId: { userId: input.userId, tripId: input.tripId },
          },
          select: { id: true },
        });

        if (!participant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User is not assigned to this trip",
          });
        }

        await tx.tripParticipant.delete({
          where: {
            userId_tripId: { userId: input.userId, tripId: input.tripId },
          },
        });

        const remainingTrips = await tx.tripParticipant.count({
          where: { userId: input.userId },
        });

        if (remainingTrips === 0) {
          await tx.user.delete({ where: { id: input.userId } });
        }

        return { remainingTrips };
      });

      if (result.remainingTrips === 0) {
        const { error } = await context.supabase.auth.admin.deleteUser(
          user.authUserId,
        );
        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
      }

      return { deletedFromSystem: result.remainingTrips === 0 };
    }),

  // Update user wrist number
  updateWristNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
        wristNumber: z
          .string()
          .min(1, "Numer opaski nie może być pusty")
          .max(20, "Numer opaski nie może być dłuższy niż 20 znaków"),
      }),
    )
    .handler(async ({ context, input }) => {
      // Check if wrist number is already taken by another user
      const existingParticipant = await context.db.tripParticipant.findFirst({
        where: {
          tripId: input.tripId,
          wristNumber: input.wristNumber,
          NOT: { userId: input.userId },
        },
        select: { userId: true, user: { select: userWithAuthSelect } },
      });

      if (existingParticipant) {
        const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
          existingParticipant.user.authUserId,
        ]);
        throw new TRPCError({
          code: "CONFLICT",
          message: `Numer opaski ${input.wristNumber} jest już przypisany do użytkownika: ${formatUserFullName(
            toPublicUser(existingParticipant.user, emailByAuthUserId),
          )}`,
        });
      }

      const participant = await context.db.tripParticipant.upsert({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        update: { wristNumber: input.wristNumber },
        create: {
          userId: input.userId,
          tripId: input.tripId,
          wristNumber: input.wristNumber,
        },
        select: {
          user: {
            select: userWithAuthSelect,
          },
          wristNumber: true,
          tripId: true,
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        participant.user.authUserId,
      ]);

      return {
        ...participant,
        user: toPublicUser(participant.user, emailByAuthUserId),
      };
    }),

  // Remove wrist number from user
  removeWristNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const participant = await context.db.tripParticipant.update({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        data: { wristNumber: null },
        select: {
          user: {
            select: userWithAuthSelect,
          },
          wristNumber: true,
          tripId: true,
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        participant.user.authUserId,
      ]);

      return {
        ...participant,
        user: toPublicUser(participant.user, emailByAuthUserId),
      };
    }),

  // Update user house number
  updateHouseNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
        houseNumber: z
          .string()
          .min(1, "Numer domu nie może być pusty")
          .max(20, "Numer domu nie może być dłuższy niż 20 znaków"),
      }),
    )
    .handler(async ({ context, input }) => {
      const participant = await context.db.tripParticipant.upsert({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        update: { houseNumber: input.houseNumber },
        create: {
          userId: input.userId,
          tripId: input.tripId,
          houseNumber: input.houseNumber,
        },
        select: {
          user: {
            select: userWithAuthSelect,
          },
          houseNumber: true,
          tripId: true,
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        participant.user.authUserId,
      ]);

      return {
        ...participant,
        user: toPublicUser(participant.user, emailByAuthUserId),
      };
    }),

  // Remove house number from user
  removeHouseNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const participant = await context.db.tripParticipant.update({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        data: { houseNumber: null },
        select: {
          user: {
            select: userWithAuthSelect,
          },
          houseNumber: true,
          tripId: true,
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        participant.user.authUserId,
      ]);

      return {
        ...participant,
        user: toPublicUser(participant.user, emailByAuthUserId),
      };
    }),

  // Search users with pagination
  searchWithPagination: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        field: z.enum([
          "firstName",
          "lastName",
          "email",
          "wristNumber",
          "houseNumber",
          "groupName",
        ]),
        searchTerm: z.string().optional(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(20),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { searchTerm, field, tripId } = input;
      const fallbackLimit = input.limit ?? 20;
      const limit = input.pagination?.limit ?? fallbackLimit;
      const page = input.page ?? 1;
      const offset = input.pagination?.offset ?? (page - 1) * limit;
      const currentPage = Math.floor(offset / limit) + 1;

      const toPagination = (total: number) => {
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = offset + limit < total;
        return {
          total,
          totalCount: total,
          limit,
          offset,
          hasMore: hasNextPage,
          hasNextPage,
          currentPage,
          totalPages,
          hasPreviousPage: currentPage > 1,
        };
      };

      if (field === "email") {
        const participants = (await context.db.tripParticipant.findMany({
          where: { tripId },
          include: {
            user: {
              select: userWithAuthSelect,
            },
            group: { select: { id: true, name: true } },
          },
          orderBy: [
            { user: { firstName: "asc" } },
            { user: { lastName: "asc" } },
          ],
        }));

        const authSummaryById = await buildAuthUserSummaryLookup(
          context.supabase,
          participants.map((participant) => participant.user.authUserId),
        );

        const normalizedSearch = searchTerm?.toLowerCase();
        const filtered = participants.filter((participant) => {
          if (!normalizedSearch) return true;
          const email =
            authSummaryById.get(participant.user.authUserId)?.email ?? null;
          return email?.toLowerCase().includes(normalizedSearch) ?? false;
        });

        const sorted = filtered.sort((a, b) => {
          const aUser = toPublicUserWithAuthSummary(a.user, authSummaryById);
          const bUser = toPublicUserWithAuthSummary(b.user, authSummaryById);
          const firstNameCompare = (aUser.firstName ?? "").localeCompare(
            bUser.firstName ?? "",
          );
          if (firstNameCompare !== 0) return firstNameCompare;

          const lastNameCompare = (aUser.lastName ?? "").localeCompare(
            bUser.lastName ?? "",
          );
          if (lastNameCompare !== 0) return lastNameCompare;

          return (aUser.email ?? "").localeCompare(bUser.email ?? "");
        });

        const paged = sorted.slice(offset, offset + limit);
        const total = filtered.length;

        return {
          users: paged.map((participant) => ({
            ...toPublicUserWithAuthSummary(participant.user, authSummaryById),
            wristNumber: participant.wristNumber,
            houseNumber: participant.houseNumber,
            group: participant.group,
            tripId: participant.tripId,
          })),
          pagination: toPagination(total),
        };
      }

      const searchConditions = (() => {
        if (!searchTerm) {
          return undefined;
        }
        if (field === "groupName") {
          return {
            group: {
              name: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
          };
        }
        if (field === "firstName" || field === "lastName") {
          return {
            user: {
              [field]: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
          };
        }
        return {
          [field]: {
            contains: searchTerm,
            mode: "insensitive" as const,
          },
        };
      })();

      const where = {
        tripId,
        ...(searchConditions ? { AND: searchConditions } : {}),
      } as const;

      const total = await context.db.tripParticipant.count({
        where,
      });

      const participants = (await context.db.tripParticipant.findMany({
        where,
        include: {
          user: {
            select: userWithAuthSelect,
          },
          group: { select: { id: true, name: true } },
        },
        orderBy: [
          { user: { firstName: "asc" } },
          { user: { lastName: "asc" } },
        ],
        skip: offset,
        take: limit,
      }));

      const authSummaryById = await buildAuthUserSummaryLookup(
        context.supabase,
        participants.map((participant) => participant.user.authUserId),
      );

      return {
        users: participants.map((participant) => ({
          ...toPublicUserWithAuthSummary(participant.user, authSummaryById),
          wristNumber: participant.wristNumber,
          houseNumber: participant.houseNumber,
          group: participant.group,
          tripId: participant.tripId,
        })),
        pagination: toPagination(total),
      };
    }),
});
