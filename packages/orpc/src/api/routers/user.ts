import { z } from "zod";
import { ORPCError } from "@orpc/server";
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
import { eq, and, count, ilike, asc } from "drizzle-orm";
import { users, tripParticipants, groups } from "@mirai-app/db";
const roleSchema = z.enum(["USER", "ADMIN", "MODERATOR", "SERVICE"]);
const nameSchema = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters")
  .max(100, "Must be at most 100 characters")
  .refine((value) => !/\d/.test(value), "Cannot contain digits");

export interface PublicUser {
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
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: lookup.error?.message ?? "Failed to fetch auth user" });
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
      const dbUser = await context.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
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
      return context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
        columns: {
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
      return await context.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
        with: {
          trips: {
            where: (tp, { eq }) => eq(tp.tripId, input.tripId),
            with: {
              group: { columns: { id: true, name: true } },
              trip: { columns: { id: true, name: true } },
            },
          },
          organizerGroup: { columns: { id: true, name: true } },
        },
      });
    }),
  getMyWithGroup: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      return await context.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, context.dbUser.id),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
        with: {
          trips: {
            where: (tp, { eq }) => eq(tp.tripId, input.tripId),
            with: {
              group: { columns: { id: true, name: true } },
              trip: { columns: { id: true, name: true } },
            },
          },
          organizerGroup: { columns: { id: true, name: true } },
        },
      });
    }),
  getMy: protectedProcedure
    .handler(async ({ context }) => {
      const baseUser = await context.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, context.dbUser.id),
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
      const [updatedUser] = await context.db.update(users).set({
        hasAvatar: input.hasAvatar,
      }).where(eq(users.id, context.dbUser.id)).returning({
        hasAvatar: users.hasAvatar,
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
      const [updatedUser] = await context.db.update(users).set({
        firstName: input.firstName,
        lastName: input.lastName,
      }).where(eq(users.id, context.dbUser.id)).returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      });

      return updatedUser;
    }),
  getAll: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const rows = await context.db.select()
        .from(tripParticipants)
        .innerJoin(users, eq(tripParticipants.userId, users.id))
        .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
        .where(eq(tripParticipants.tripId, input.tripId))
        .orderBy(asc(users.firstName), asc(users.lastName));

      const participants = rows.map((r) => ({
        ...r.trip_participants,
        user: {
          id: r.users.id,
          authUserId: r.users.authUserId,
          firstName: r.users.firstName,
          lastName: r.users.lastName,
          role: r.users.role,
        },
        group: r.groups ? { id: r.groups.id, name: r.groups.name } : null,
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
    return await context.db.query.users.findMany({
      where: (u, { eq }) => eq(u.role, roleSchema.enum.ADMIN),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: (u, { asc }) => [asc(u.firstName), asc(u.lastName)],
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
        throw new ORPCError("FORBIDDEN", { message: "Nie możesz usunąć swoich uprawnień administratora" });
      }

      const [updatedUser] = await context.db.update(users).set({
        role: input.role,
      }).where(eq(users.id, input.userId)).returning({
        id: users.id,
        authUserId: users.authUserId,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

      if (!updatedUser) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update user" });
      }

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
        throw new ORPCError("BAD_REQUEST", { message: error?.message ?? "Failed to create auth user" });
      }

      const authUserId = data.user.id;

      const result = await context.db.transaction(async (tx) => {
        const existingUser = await tx.query.users.findFirst({
          where: (u, { eq }) => eq(u.authUserId, authUserId),
          columns: userWithAuthSelect,
        });

        let dbUser = existingUser;
        if (!dbUser) {
          const [inserted] = await tx.insert(users).values({
            authUserId,
            firstName,
            lastName,
            role: roleSchema.enum.USER,
          }).returning({
            id: users.id,
            authUserId: users.authUserId,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
          });
          if (!inserted) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create user" });
          }
          dbUser = inserted;
        }

        await tx.insert(tripParticipants).values({
          userId: dbUser.id,
          tripId: input.tripId,
        }).onConflictDoUpdate({
          target: [tripParticipants.userId, tripParticipants.tripId],
          set: {},
        }).returning();

        const participant = await tx.query.tripParticipants.findFirst({
          where: (tp, { eq, and }) => and(eq(tp.userId, dbUser.id), eq(tp.tripId, input.tripId)),
          with: {
            user: {
              columns: userWithAuthSelect,
            },
            group: { columns: { id: true, name: true } },
          },
          columns: {
            wristNumber: true,
            houseNumber: true,
            tripId: true,
          },
        });

        if (!participant) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create or update participant" });
        }

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
      const [updatedUser] = await context.db.update(users).set({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      }).where(eq(users.id, input.userId)).returning({
        id: users.id,
        authUserId: users.authUserId,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

      if (!updatedUser) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update user" });
      }

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
      const user = await context.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.userId),
        columns: { authUserId: true },
      });

      if (!user) {
        throw new ORPCError("NOT_FOUND", { message: "User not found" });
      }

      const bannedUntil = new Date(input.bannedUntilMs);

      if (Number.isNaN(bannedUntil.getTime())) {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid ban date" });
      }

      const diffMs = bannedUntil.getTime() - Date.now();
      if (diffMs <= 0) {
        throw new ORPCError("BAD_REQUEST", { message: "Ban date must be in the future" });
      }

      const diffMinutes = Math.ceil(diffMs / 60000);
      const banDuration = `${diffMinutes}m`;

      const adminUser = await context.supabase.auth.admin.getUserById(
        user.authUserId,
      );

      if (adminUser.error || !adminUser.data.user) {
        throw new ORPCError("BAD_REQUEST", { message: adminUser.error?.message ?? "Failed to fetch auth user" });
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
        throw new ORPCError("BAD_REQUEST", { message: error.message });
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
      const user = await context.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.userId),
        columns: { id: true, authUserId: true },
      });

      if (!user) {
        throw new ORPCError("NOT_FOUND", { message: "User not found" });
      }

      const result = await context.db.transaction(async (tx) => {
        const participant = await tx.query.tripParticipants.findFirst({
          where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
          columns: { id: true },
        });

        if (!participant) {
          throw new ORPCError("NOT_FOUND", { message: "User is not assigned to this trip" });
        }

        await tx.delete(tripParticipants).where(
          and(eq(tripParticipants.userId, input.userId), eq(tripParticipants.tripId, input.tripId))
        );

        const [remainingResult] = await tx.select({ count: count() })
          .from(tripParticipants)
          .where(eq(tripParticipants.userId, input.userId));
        const remainingTrips = remainingResult?.count ?? 0;

        if (remainingTrips === 0) {
          await tx.delete(users).where(eq(users.id, input.userId));
        }

        return { remainingTrips };
      });

      if (result.remainingTrips === 0) {
        const { error } = await context.supabase.auth.admin.deleteUser(
          user.authUserId,
        );
        if (error) {
          throw new ORPCError("BAD_REQUEST", { message: error.message });
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
      const existingParticipant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and, ne }) => and(
          eq(tp.tripId, input.tripId),
          eq(tp.wristNumber, input.wristNumber),
          ne(tp.userId, input.userId)
        ),
        with: {
          user: {
            columns: userWithAuthSelect,
          },
        },
        columns: { userId: true },
      });

      if (existingParticipant) {
        const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
          existingParticipant.user.authUserId,
        ]);
        throw new ORPCError("CONFLICT", { message: `Numer opaski ${input.wristNumber} jest już przypisany do użytkownika: ${formatUserFullName(
          toPublicUser(existingParticipant.user, emailByAuthUserId),
        )}` });
      }

      await context.db.insert(tripParticipants).values({
        userId: input.userId,
        tripId: input.tripId,
        wristNumber: input.wristNumber,
      }).onConflictDoUpdate({
        target: [tripParticipants.userId, tripParticipants.tripId],
        set: { wristNumber: input.wristNumber },
      }).returning();

      const participant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
        with: {
          user: {
            columns: userWithAuthSelect,
          },
        },
        columns: {
          wristNumber: true,
          tripId: true,
        },
      });

      if (!participant) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update wrist number" });
      }

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
      await context.db.update(tripParticipants).set({
        wristNumber: null,
      }).where(
        and(eq(tripParticipants.userId, input.userId), eq(tripParticipants.tripId, input.tripId))
      ).returning();

      const participant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
        with: {
          user: {
            columns: userWithAuthSelect,
          },
        },
        columns: {
          wristNumber: true,
          tripId: true,
        },
      });

      if (!participant) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to remove wrist number" });
      }

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
      await context.db.insert(tripParticipants).values({
        userId: input.userId,
        tripId: input.tripId,
        houseNumber: input.houseNumber,
      }).onConflictDoUpdate({
        target: [tripParticipants.userId, tripParticipants.tripId],
        set: { houseNumber: input.houseNumber },
      }).returning();

      const participant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
        with: {
          user: {
            columns: userWithAuthSelect,
          },
        },
        columns: {
          houseNumber: true,
          tripId: true,
        },
      });

      if (!participant) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update house number" });
      }

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
      await context.db.update(tripParticipants).set({
        houseNumber: null,
      }).where(
        and(eq(tripParticipants.userId, input.userId), eq(tripParticipants.tripId, input.tripId))
      ).returning();

      const participant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
        with: {
          user: {
            columns: userWithAuthSelect,
          },
        },
        columns: {
          houseNumber: true,
          tripId: true,
        },
      });

      if (!participant) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to remove house number" });
      }

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
        const participantRows = await context.db.query.tripParticipants.findMany({
          where: (tp, { eq }) => eq(tp.tripId, tripId),
          with: {
            user: {
              columns: userWithAuthSelect,
            },
            group: { columns: { id: true, name: true } },
          },
        });

        const authSummaryById = await buildAuthUserSummaryLookup(
          context.supabase,
          participantRows.map((participant) => participant.user.authUserId),
        );

        const normalizedSearch = searchTerm?.toLowerCase();
        const filtered = participantRows.filter((participant) => {
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

      const buildWhere = () => {
        const base = eq(tripParticipants.tripId, tripId);
        if (!searchTerm) return base;
        if (field === "groupName") {
          return and(base, ilike(groups.name, `%${searchTerm}%`));
        }
        if (field === "firstName") {
          return and(base, ilike(users.firstName, `%${searchTerm}%`));
        }
        if (field === "lastName") {
          return and(base, ilike(users.lastName, `%${searchTerm}%`));
        }
        if (field === "wristNumber") {
          return and(base, ilike(tripParticipants.wristNumber, `%${searchTerm}%`));
        }
        if (field === "houseNumber") {
          return and(base, ilike(tripParticipants.houseNumber, `%${searchTerm}%`));
        }
        return base;
      };

      const where = buildWhere();

      const [rows, totalResult] = await Promise.all([
        context.db.select()
          .from(tripParticipants)
          .innerJoin(users, eq(tripParticipants.userId, users.id))
          .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
          .where(where)
          .orderBy(asc(users.firstName), asc(users.lastName))
          .limit(limit)
          .offset(offset),
        context.db.select({ count: count() })
          .from(tripParticipants)
          .innerJoin(users, eq(tripParticipants.userId, users.id))
          .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
          .where(where),
      ]);

      const total = totalResult[0]?.count ?? 0;

      const participants = rows.map((r) => ({
        ...r.trip_participants,
        user: {
          id: r.users.id,
          authUserId: r.users.authUserId,
          firstName: r.users.firstName,
          lastName: r.users.lastName,
          role: r.users.role,
        },
        group: r.groups ? { id: r.groups.id, name: r.groups.name } : null,
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
