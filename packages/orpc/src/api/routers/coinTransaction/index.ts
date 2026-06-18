import { z } from "zod";
import { createORPCRouter, moderatorProcedure, protectedProcedure } from "../../orpc";
import {
  getAdditionalInsights,
  getAll,
  getCoinTransactions,
  getMostActiveAdminStats,
  getQuickStats,
  getStatistics,
} from "./queries";

const handleGetStatistics = async ({
  context,
  input,
}: {
  context: Parameters<typeof getStatistics>[0];
  input: Parameters<typeof getStatistics>[1];
}) => getStatistics(context, input);

const handleGetMostActiveAdminStats = async ({
  context,
  input,
}: {
  context: Parameters<typeof getMostActiveAdminStats>[0];
  input: Parameters<typeof getMostActiveAdminStats>[1];
}) => getMostActiveAdminStats(context, input);

const handleGetAll = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAll>[0];
  input: Parameters<typeof getAll>[1];
}) => getAll(context, input);

const handleGetQuickStats = async ({
  context,
  input,
}: {
  context: Parameters<typeof getQuickStats>[0];
  input: Parameters<typeof getQuickStats>[1];
}) => getQuickStats(context, input);

const handleGetAdditionalInsights = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAdditionalInsights>[0];
  input: Parameters<typeof getAdditionalInsights>[1];
}) => getAdditionalInsights(context, input);

const handleGetCoinTransactions = async ({
  context,
  input,
}: {
  context: Parameters<typeof getCoinTransactions>[0];
  input: Parameters<typeof getCoinTransactions>[1];
}) => getCoinTransactions(context, input);

export const coinTransactionRouter = createORPCRouter({
  getStatistics: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetStatistics),

  getMostActiveAdminStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetMostActiveAdminStats),

  getAll: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .handler(handleGetAll),

  getQuickStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetQuickStats),

  getAdditionalInsights: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetAdditionalInsights),

  getCoinTransactions: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .handler(handleGetCoinTransactions),
});
