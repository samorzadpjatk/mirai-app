import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

// Helper function to check admin privileges
const checkAdminPrivileges = (userGroups: string[] | undefined, isAdmin: boolean) => {
  const adminGroupName = "admin-group-name"; // Change to your actual admin group name
  const hasGroupAccess = Array.isArray(userGroups) && userGroups.includes(adminGroupName);
  
  if (!hasGroupAccess && !isAdmin) {
    throw new Error("Brak uprawnień administratora");
  }
};

export const adminRouter = createTRPCRouter({
  // Get all users with their group memberships
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
    
    return await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        }
      },
      orderBy: { name: "asc" },
    });
  }),

  // Get all groups with detailed information
  getAllGroups: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
    
    return await ctx.db.group.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        coinTransactions: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 transactions
        }
      },
      orderBy: { name: "asc" },
    });
  }),

  // Create a new group (admin version with more control)
  createGroup: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1),
      organizerId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      return await ctx.db.group.create({
        data: {
          name: input.name,
          organizerId: input.organizerId || ctx.session.user.id,
          code,
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
    }),

  // Update group information
  updateGroup: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      organizerId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      const { id, ...updateData } = input;
      return await ctx.db.group.update({
        where: { id },
        data: updateData,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
    }),

  // Delete a group
  deleteGroup: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      // First, delete all related records
      await ctx.db.userGroup.deleteMany({
        where: { groupId: input.id }
      });
      
      await ctx.db.coinTransaction.deleteMany({
        where: { groupId: input.id }
      });
      
      return await ctx.db.group.delete({
        where: { id: input.id }
      });
    }),

  // Assign user to a group
  assignUserToGroup: protectedProcedure
    .input(z.object({
      userId: z.string(),
      groupId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      // Check if user is already in the group
      const existingMembership = await ctx.db.userGroup.findFirst({
        where: {
          userId: input.userId,
          groupId: input.groupId,
        }
      });
      
      if (existingMembership) {
        throw new Error("Użytkownik już należy do tej grupy");
      }
      
      return await ctx.db.userGroup.create({
        data: {
          userId: input.userId,
          groupId: input.groupId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          group: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          }
        }
      });
    }),

  // Remove user from a group
  removeUserFromGroup: protectedProcedure
    .input(z.object({
      userId: z.string(),
      groupId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      return await ctx.db.userGroup.deleteMany({
        where: {
          userId: input.userId,
          groupId: input.groupId,
        }
      });
    }),

  // Add coins to a group (enhanced version)
  addCoins: protectedProcedure
    .input(z.object({ 
      groupId: z.string(), 
      amount: z.number().min(1),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { increment: input.amount } },
      });
      
      return await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: input.amount,
          adminId: ctx.session.user.id,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              coins: true,
            }
          },
          admin: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
    }),

  // Remove coins from a group
  removeCoins: protectedProcedure
    .input(z.object({ 
      groupId: z.string(), 
      amount: z.number().min(1),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      // Check if group has enough coins
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { coins: true }
      });
      
      if (!group || group.coins < input.amount) {
        throw new Error("Grupa nie ma wystarczającej liczby monet");
      }
      
      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { decrement: input.amount } },
      });
      
      return await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: -input.amount, // Negative amount for removal
          adminId: ctx.session.user.id,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              coins: true,
            }
          },
          admin: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
    }),

  // Get coin transaction history
  getCoinTransactions: protectedProcedure
    .input(z.object({
      groupId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
      return await ctx.db.coinTransaction.findMany({
        where: input.groupId ? { groupId: input.groupId } : undefined,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              coins: true,
            }
          },
          admin: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Update user admin status
  updateUserAdminStatus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isAdmin: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkAdminPrivileges(ctx.session.user.groups, ctx.session.user.isAdmin);
      
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
        }
      });
    }),
});
