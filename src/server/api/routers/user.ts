import { z } from "zod";
import {
  createTRPCRouter,
  moderatorProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
        where: { id: input.id },
      });
    }),
  getByIdWithGroup: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          group: { select: { id: true, name: true } },
        },
      });
    }),
  getMy: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    });
  }),
  getAll: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        wristNumber: true,
        group: { select: { id: true, name: true } },
        organizerGroup: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  }),
  getAllAdminsNames: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  }),
  getAllAdminsNamesWithoutGroups: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      where: {
        isAdmin: true,
        organizerGroup: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  }),
  // Update user admin status
  updateUserAdminStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent admin from removing their own admin status
      if (input.userId === ctx.session.user.id && !input.isAdmin) {
        throw new Error("Nie możesz usunąć swoich uprawnień administratora");
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { isAdmin: input.isAdmin },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
        },
      });
    }),

  // Update user wrist number
  updateWristNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        wristNumber: z
          .string()
          .min(1, "Numer opaski nie może być pusty")
          .max(20, "Numer opaski nie może być dłuższy niż 20 znaków"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if wrist number is already taken by another user
      const existingUser = await ctx.db.user.findUnique({
        where: { wristNumber: input.wristNumber },
        select: { id: true, name: true },
      });

      if (existingUser && existingUser.id !== input.userId) {
        throw new Error(
          `Numer opaski ${input.wristNumber} jest już przypisany do użytkownika: ${existingUser.name}`,
        );
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { wristNumber: input.wristNumber },
        select: {
          id: true,
          name: true,
          email: true,
          wristNumber: true,
          isAdmin: true,
        },
      });
    }),

  // Remove wrist number from user
  removeWristNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { wristNumber: null },
        select: {
          id: true,
          name: true,
          email: true,
          wristNumber: true,
          isAdmin: true,
        },
      });
    }),

  // Update user house number
  updateHouseNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        houseNumber: z
          .string()
          .min(1, "Numer domu nie może być pusty")
          .max(20, "Numer domu nie może być dłuższy niż 20 znaków"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if house number is already taken by another user
      const existingUser = await ctx.db.user.findUnique({
        where: { houseNumber: input.houseNumber },
        select: { id: true, name: true },
      });

      if (existingUser && existingUser.id !== input.userId) {
        throw new Error(
          `Numer domu ${input.houseNumber} jest już przypisany do użytkownika: ${existingUser.name}`,
        );
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { houseNumber: input.houseNumber },
        select: {
          id: true,
          name: true,
          email: true,
          houseNumber: true,
          isAdmin: true,
        },
      });
    }),

  // Remove house number from user
  removeHouseNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { houseNumber: null },
        select: {
          id: true,
          name: true,
          email: true,
          houseNumber: true,
          isAdmin: true,
        },
      });
    }),

  // Search users with pagination
  searchWithPagination: moderatorProcedure
    .input(
      z.object({
        field: z.enum([
          "name",
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
      const { searchTerm, page, limit, field } = input;
      const skip = (page - 1) * limit;

      // Build search conditions
      let searchConditions;
      if (field !== "groupName") {
        searchConditions = searchTerm
          ? {
              OR: [
                {
                  [field]: {
                    contains: searchTerm,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {};
      } else {
        searchConditions = searchTerm
          ? {
              OR: [
                {
                  group: {
                    name: {
                      contains: searchTerm,
                      mode: "insensitive" as const,
                    },
                  },
                },
                {
                  organizerGroup: {
                    name: {
                      contains: searchTerm,
                      mode: "insensitive" as const,
                    },
                  },
                },
              ],
            }
          : {};
      }

      // Get total count for pagination
      const totalCount = await ctx.db.user.count({
        where: searchConditions,
      });

      // Get paginated results
      const users = await ctx.db.user.findMany({
        where: searchConditions,
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          houseNumber: true,
          wristNumber: true,
          group: { select: { id: true, name: true } },
          organizerGroup: { select: { id: true, name: true } },
        },
        orderBy: [{ name: "asc" }, { email: "asc" }],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        users,
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
