/**
 * Group Controller
 *
 * tRPC-ready controller wrapping GroupController with proper procedure types.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "../trpc";
import { GroupController } from "../../controllers/group-controller";
import { PrismaGroupRepository } from "../../gateways/PrismaGroupRepository";

export const groupController = {
  getAllNames: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const groups = await repo.findByTripId(input.tripId);
      return groups.map((g) => ({ id: g.id, name: g.name }));
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.getByTripId({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return {
        groups: result.data,
        pagination: {
          total: result.data.length,
          limit: input.pagination?.limit ?? 30,
          offset: input.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.getById({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);

      // Generate a unique code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const result = await controller.create({
        tripId: input.tripId,
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
        organizerId: input.organizerId ?? ctx.dbUser.id,
        code,
        coins: 0,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.update({
        groupId: input.id,
        name: input.name,
        description: input.description,
        image: input.image,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.delete({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return { success: true };
    }),

  addCoins: moderatorProcedure
    .input(
      z.object({
        groupId: z.string(),
        amount: z.number().min(1),
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.addCoins({
        groupId: input.groupId,
        amount: input.amount,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  ranking: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const groups = await repo.findByTripId(input.tripId);
      return {
        data: groups.sort((a, b) => b.coins - a.coins),
        currentDate: new Date(),
      };
    }),
};
