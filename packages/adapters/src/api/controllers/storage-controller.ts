/**
 * Storage Controller
 *
 * tRPC-ready controller wrapping StorageController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { StorageController } from "../../controllers/storage-controller";
import { requireAuth } from "../controller-helpers";

export const storageController = {
  createUploadUrl: publicProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        upsert: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      await requireAuth(ctx.headers, ctx.di);

      const controller = new StorageController(ctx.supabase);
      const result = await controller.createUploadUrl({
        storagePath: input.storagePath,
        upsert: input.upsert,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  createDownloadUrl: publicProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        expiresInSeconds: z
          .number()
          .int()
          .min(60)
          .max(60 * 60)
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require authentication
      await requireAuth(ctx.headers, ctx.di);

      const controller = new StorageController(ctx.supabase);
      const result = await controller.createDownloadUrl({
        storagePath: input.storagePath,
        expiresInSeconds: input.expiresInSeconds,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.code ?? "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  createPublicUrl: publicProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require authentication
      await requireAuth(ctx.headers, ctx.di);

      const controller = new StorageController(ctx.supabase);
      const result = await controller.createPublicUrl({
        storagePath: input.storagePath,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
