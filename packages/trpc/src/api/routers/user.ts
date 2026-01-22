import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  moderatorProcedure,
  adminProcedure,
} from "../../api/trpc";
const roleSchema = z.enum(["USER", "ADMIN", "MODERATOR", "SERVICE"]);

interface PublicUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: z.infer<typeof roleSchema>;
}

interface TripParticipantWithUser {
  user: PublicUser;
  wristNumber: number | null;
  houseNumber: number | null;
  group: { id: string; name: string } | null;
  tripId: string;
}

const userPublicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
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

export const userRouter = createTRPCRouter({
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
        where: { id: input.id },
      });
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
  getMy: moderatorProcedure
    .input(z.object({ tripId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const baseUser = await ctx.db.user.findUnique({
        where: { id: ctx.dbUser.id },
      });
      if (!baseUser) return null;
      if (!input?.tripId) return baseUser;

      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: { userId: ctx.dbUser.id, tripId: input.tripId },
        },
        include: {
          group: { select: { id: true, name: true } },
          trip: { select: { id: true, name: true } },
        },
      });

      return { ...baseUser, tripContext: participant };
    }),
  getAll: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = (await ctx.db.tripParticipant.findMany({
        where: { tripId: input.tripId },
        include: {
          user: {
            select: userPublicSelect,
          },
          group: { select: { id: true, name: true } },
        },
        orderBy: [
          { user: { firstName: "asc" } },
          { user: { lastName: "asc" } },
        ],
      })) as TripParticipantWithUser[];

      return participants.map((participant) => ({
        ...participant.user,
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

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: userPublicSelect,
      });
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
        select: { userId: true, user: { select: userPublicSelect } },
      });

      if (existingParticipant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Numer opaski ${input.wristNumber} jest już przypisany do użytkownika: ${formatUserFullName(existingParticipant.user)}`,
        });
      }

      return await ctx.db.tripParticipant.upsert({
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
            select: userPublicSelect,
          },
          wristNumber: true,
          tripId: true,
        },
      });
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
      return await ctx.db.tripParticipant.update({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        data: { wristNumber: null },
        select: {
          user: {
            select: userPublicSelect,
          },
          wristNumber: true,
          tripId: true,
        },
      });
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
      return await ctx.db.tripParticipant.upsert({
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
            select: userPublicSelect,
          },
          houseNumber: true,
          tripId: true,
        },
      });
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
      return await ctx.db.tripParticipant.update({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        data: { houseNumber: null },
        select: {
          user: {
            select: userPublicSelect,
          },
          houseNumber: true,
          tripId: true,
        },
      });
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
        if (
          field === "firstName" ||
          field === "lastName" ||
          field === "email"
        ) {
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
            select: userPublicSelect,
          },
          group: { select: { id: true, name: true } },
        },
        orderBy: [
          { user: { firstName: "asc" } },
          { user: { lastName: "asc" } },
          { user: { email: "asc" } },
        ],
        skip,
        take: limit,
      })) as TripParticipantWithUser[];

      const totalPages = Math.ceil(totalCount / limit);

      return {
        users: participants.map((participant) => ({
          ...participant.user,
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
