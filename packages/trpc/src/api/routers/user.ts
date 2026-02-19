import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  moderatorProcedure,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";
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

export const userRouter = createTRPCRouter({
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const dbUser = await ctx.db.user.findUnique({
        where: { id: input.id },
      });

      if (!dbUser) return null;

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        dbUser.authUserId,
      ]);

      return {
        ...dbUser,
        email: resolveAuthEmail(emailByAuthUserId, dbUser.authUserId),
      };
    }),
  getByIdWithGroup: moderatorProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
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
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
        where: { id: ctx.dbUser.id },
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
    .query(async ({ ctx }) => {
      const baseUser = await ctx.db.user.findUnique({
        where: { id: ctx.dbUser.id },
      });
      if (!baseUser) return null;

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
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
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.dbUser.id },
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
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: ctx.dbUser.id },
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
    .query(async ({ ctx, input }) => {
      const participants = (await ctx.db.tripParticipant.findMany({
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
        ctx.supabase,
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
  getAllAdminsNames: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
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
    .mutation(async ({ ctx, input }) => {
      // Prevent admin from removing their own admin status
      if (
        input.userId === ctx.dbUser.id &&
        input.role !== roleSchema.enum.ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie możesz usunąć swoich uprawnień administratora",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: userWithAuthSelect,
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        updatedUser.authUserId,
      ]);

      return toPublicUser(updatedUser, emailByAuthUserId);
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
    .mutation(async ({ ctx, input }) => {
      // Check if wrist number is already taken by another user
      const existingParticipant = await ctx.db.tripParticipant.findFirst({
        where: {
          tripId: input.tripId,
          wristNumber: input.wristNumber,
          NOT: { userId: input.userId },
        },
        select: { userId: true, user: { select: userWithAuthSelect } },
      });

      if (existingParticipant) {
        const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
          existingParticipant.user.authUserId,
        ]);
        throw new TRPCError({
          code: "CONFLICT",
          message: `Numer opaski ${input.wristNumber} jest już przypisany do użytkownika: ${formatUserFullName(
            toPublicUser(existingParticipant.user, emailByAuthUserId),
          )}`,
        });
      }

      const participant = await ctx.db.tripParticipant.upsert({
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

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
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
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.db.tripParticipant.update({
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

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
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
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.db.tripParticipant.upsert({
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

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
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
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.db.tripParticipant.update({
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

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
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
        page: z.number().min(1).default(1),
        limit: z.number().min(5).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { searchTerm, page, limit, field, tripId } = input;
      const skip = (page - 1) * limit;

      if (field === "email") {
        const participants = (await ctx.db.tripParticipant.findMany({
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

        const emailByAuthUserId = await buildAuthEmailLookup(
          ctx.supabase,
          participants.map((participant) => participant.user.authUserId),
        );

        const normalizedSearch = searchTerm?.toLowerCase();
        const filtered = participants.filter((participant) => {
          if (!normalizedSearch) return true;
          const email = resolveAuthEmail(
            emailByAuthUserId,
            participant.user.authUserId,
          );
          return email?.toLowerCase().includes(normalizedSearch) ?? false;
        });

        const sorted = filtered.sort((a, b) => {
          const aUser = toPublicUser(a.user, emailByAuthUserId);
          const bUser = toPublicUser(b.user, emailByAuthUserId);
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

        const paged = sorted.slice(skip, skip + limit);
        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / limit);

        return {
          users: paged.map((participant) => ({
            ...toPublicUser(participant.user, emailByAuthUserId),
            wristNumber: participant.wristNumber,
            houseNumber: participant.houseNumber,
            group: participant.group,
            tripId: participant.tripId,
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            limit,
          },
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

      const totalCount = await ctx.db.tripParticipant.count({
        where,
      });

      const participants = (await ctx.db.tripParticipant.findMany({
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
        skip,
        take: limit,
      }));

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        participants.map((participant) => participant.user.authUserId),
      );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        users: participants.map((participant) => ({
          ...toPublicUser(participant.user, emailByAuthUserId),
          wristNumber: participant.wristNumber,
          houseNumber: participant.houseNumber,
          group: participant.group,
          tripId: participant.tripId,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit,
        },
      };
    }),
});
