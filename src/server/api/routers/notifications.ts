import { z } from "zod";
import webpush from "web-push";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env";

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export const notificationRouter = createTRPCRouter({
  // Get VAPID public key for client-side subscription
  getVapidPublicKey: publicProcedure.query(() => {
    if (!env.VAPID_PUBLIC_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "VAPID public key not configured",
      });
    }
    return { publicKey: env.VAPID_PUBLIC_KEY };
  }),

  // Subscribe to push notifications
  subscribe: protectedProcedure
    .input(
      z.object({
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Store the subscription in the database
        const subscription = await ctx.db.pushSubscription.upsert({
          where: {
            userId: ctx.session.user.id,
          },
          update: {
            endpoint: input.subscription.endpoint,
            p256dh: input.subscription.keys.p256dh,
            auth: input.subscription.keys.auth,
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            endpoint: input.subscription.endpoint,
            p256dh: input.subscription.keys.p256dh,
            auth: input.subscription.keys.auth,
          },
        });

        return { success: true, subscriptionId: subscription.id };
      } catch (error) {
        console.error("Error saving push subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save push subscription",
        });
      }
    }),

  // Unsubscribe from push notifications
  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.db.pushSubscription.deleteMany({
        where: {
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error removing push subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove push subscription",
      });
    }
  }),

  // Send push notification to a specific user
  sendToUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string().optional(),
        data: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permissions
      if (!ctx.session.user.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to send notifications",
        });
      }

      try {
        // Get user's push subscriptions
        const subscriptions = await ctx.db.pushSubscription.findMany({
          where: {
            userId: input.userId,
          },
        });

        if (subscriptions.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No push subscriptions found for this user",
          });
        }

        const payload = JSON.stringify({
          title: input.title,
          body: input.body,
          url: input.url || "/",
          data: input.data || {},
          timestamp: Date.now(),
        });

        const results = await Promise.allSettled(
          subscriptions.map(async (subscription) => {
            try {
              const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              };

              return await webpush.sendNotification(pushSubscription, payload);
            } catch (error: any) {
              console.error("Error sending notification:", error);
              
              // Remove invalid subscriptions
              if (error.statusCode === 410 || error.statusCode === 404) {
                await ctx.db.pushSubscription.delete({
                  where: { id: subscription.id },
                });
              }
              
              throw error;
            }
          })
        );

        const successful = results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled').length;
        const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').length;

        return {
          success: true,
          sent: successful,
          failed: failed,
          total: subscriptions.length,
        };
      } catch (error) {
        console.error("Error sending push notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send push notification",
        });
      }
    }),

  // Send push notification to all users in a group
  sendToGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string().optional(),
        data: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permissions
      if (!ctx.session.user.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to send notifications",
        });
      }

      try {
        // Get all users in the group
        const groupUsers = await ctx.db.userGroup.findMany({
          where: {
            groupId: input.groupId,
          },
          include: {
            user: {
              include: {
                pushSubscriptions: true,
              },
            },
          },
        });

        const payload = JSON.stringify({
          title: input.title,
          body: input.body,
          url: input.url || "/",
          data: input.data || {},
          timestamp: Date.now(),
        });

        let totalSent = 0;
        let totalFailed = 0;

        for (const groupUser of groupUsers) {
          const subscriptions = groupUser.user.pushSubscriptions;
          
          if (subscriptions.length > 0) {
            const results = await Promise.allSettled(
              subscriptions.map(async (subscription) => {
                try {
                  const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: {
                      p256dh: subscription.p256dh,
                      auth: subscription.auth,
                    },
                  };

                  return await webpush.sendNotification(pushSubscription, payload);
                } catch (error: any) {
                  console.error("Error sending notification:", error);
                  
                  // Remove invalid subscriptions
                  if (error.statusCode === 410 || error.statusCode === 404) {
                    await ctx.db.pushSubscription.delete({
                      where: { id: subscription.id },
                    });
                  }
                  
                  throw error;
                }
              })
            );

            totalSent += results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled').length;
            totalFailed += results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').length;
          }
        }

        return {
          success: true,
          sent: totalSent,
          failed: totalFailed,
          usersInGroup: groupUsers.length,
        };
      } catch (error) {
        console.error("Error sending group push notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send group push notification",
        });
      }
    }),

  // Get user's notification preferences/subscription status
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.pushSubscription.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return {
      isSubscribed: !!subscription,
      subscriptionId: subscription?.id,
      endpoint: subscription?.endpoint,
    };
  }),

  // Send custom notification to all users
  sendCustomToAll: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Tytuł jest wymagany"),
        body: z.string().min(1, "Treść jest wymagana"),
        url: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permissions
      const user = await ctx.db.user.findFirst({
        where: { id: ctx.session.user.id },
      });

      if (!user?.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to send notifications",
        });
      }

      try {
        // Get all push subscriptions from all users
        const allSubscriptions = await ctx.db.pushSubscription.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (allSubscriptions.length === 0) {
          return {
            success: true,
            sent: 0,
            failed: 0,
            totalUsers: 0,
            message: "Brak subskrypcji do wysłania powiadomień",
          };
        }

        const payload = JSON.stringify({
          title: input.title,
          body: input.body,
          url: input.url || "/",
          data: {
            type: "custom_notification",
            customMessage: true,
          },
          timestamp: Date.now(),
        });

        const results = await Promise.allSettled(
          allSubscriptions.map(async (subscription) => {
            try {
              const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              };

              return await webpush.sendNotification(pushSubscription, payload);
            } catch (error: any) {
              console.error("Error sending notification:", error);
              
              // Remove invalid subscriptions
              if (error.statusCode === 410 || error.statusCode === 404) {
                await ctx.db.pushSubscription.delete({
                  where: { id: subscription.id },
                });
              }
              
              throw error;
            }
          })
        );

        const successful = results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled').length;
        const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').length;

        // Get unique user count
        const uniqueUsers = new Set(allSubscriptions.map(s => s.userId)).size;

        return {
          success: true,
          sent: successful,
          failed: failed,
          totalSubscriptions: allSubscriptions.length,
          totalUsers: uniqueUsers,
          message: `Wysłano powiadomienie do ${successful} subskrypcji (${uniqueUsers} użytkowników)`,
        };
      } catch (error) {
        console.error("Error sending custom notification to all users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send custom notification",
        });
      }
    }),
});
