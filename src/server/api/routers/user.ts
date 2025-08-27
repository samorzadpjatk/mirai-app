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
          groups: { select: { group: { select: { id: true, name: true } } } },
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
        groups: { select: { group: { select: { id: true, name: true } } } },
        organizerGroups: { select: { id: true, name: true } },
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
        organizerGroups: { none: {} }
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
});
