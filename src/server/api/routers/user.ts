import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        group: true,
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
