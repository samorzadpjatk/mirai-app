import { z } from "zod";
import {
  adminProcedure,
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../trpc";
import {
  deleteNotification,
  retryNotification,
  sendCoinAddedToGroup,
  sendCoinRemovedFromGroup,
  sendCustomToGroup,
  sendNewMemberToGroup,
  sendRankingUpdateToGroups,
  sendToAll,
  sendToGroup,
  subscribe,
  unsubscribe,
  unsubscribeAll,
} from "./mutations";
import { getAll, getAllMy, getSubscriptionStatus } from "./queries";

const handleSubscribe = async ({
  context,
  input,
}: {
  context: Parameters<typeof subscribe>[0];
  input: Parameters<typeof subscribe>[1];
}) => subscribe(context, input);

const handleUnsubscribe = async ({
  context,
  input,
}: {
  context: Parameters<typeof unsubscribe>[0];
  input: Parameters<typeof unsubscribe>[1];
}) => unsubscribe(context, input);

const handleUnsubscribeAll = async ({
  context,
}: {
  context: Parameters<typeof unsubscribeAll>[0];
}) => unsubscribeAll(context);

const handleGetSubscriptionStatus = async ({
  context,
}: {
  context: Parameters<typeof getSubscriptionStatus>[0];
}) => getSubscriptionStatus(context);

const handleGetAllMy = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAllMy>[0];
  input: Parameters<typeof getAllMy>[1];
}) => getAllMy(context, input);

const handleGetAll = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAll>[0];
  input: Parameters<typeof getAll>[1];
}) => getAll(context, input);

const handleSendToGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof sendToGroup>[0];
  input: Parameters<typeof sendToGroup>[1];
}) => sendToGroup(context, input);

const handleSendToAll = async ({
  context,
  input,
}: {
  context: Parameters<typeof sendToAll>[0];
  input: Parameters<typeof sendToAll>[1];
}) => sendToAll(context, input);

const handleSendRankingUpdateToGroups = async ({
  context,
  input,
}: {
  context: Parameters<typeof sendRankingUpdateToGroups>[0];
  input: Parameters<typeof sendRankingUpdateToGroups>[1];
}) => sendRankingUpdateToGroups(context, input);

const handleSendCoinAddedToGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof sendCoinAddedToGroup>[0];
  input: Parameters<typeof sendCoinAddedToGroup>[1];
}) => sendCoinAddedToGroup(context, input);

const handleSendCoinRemovedFromGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof sendCoinRemovedFromGroup>[0];
  input: Parameters<typeof sendCoinRemovedFromGroup>[1];
}) => sendCoinRemovedFromGroup(context, input);

const handleSendNewMemberToGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof sendNewMemberToGroup>[0];
  input: Parameters<typeof sendNewMemberToGroup>[1];
}) => sendNewMemberToGroup(context, input);

const handleSendCustomToGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof sendCustomToGroup>[0];
  input: Parameters<typeof sendCustomToGroup>[1];
}) => sendCustomToGroup(context, input);

const handleRetryNotification = async ({
  context,
  input,
}: {
  context: Parameters<typeof retryNotification>[0];
  input: Parameters<typeof retryNotification>[1];
}) => retryNotification(context, input);

const handleDeleteNotification = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteNotification>[0];
  input: Parameters<typeof deleteNotification>[1];
}) => deleteNotification(context, input);

export const notificationRouter = createORPCRouter({
  subscribe: protectedProcedure.input(z.object({ token: z.string() })).handler(handleSubscribe),

  unsubscribe: protectedProcedure.input(z.object({ token: z.string() })).handler(handleUnsubscribe),

  unsubscribeAll: protectedProcedure.handler(handleUnsubscribeAll),

  getSubscriptionStatus: protectedProcedure.handler(handleGetSubscriptionStatus),

  getAllMy: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .handler(handleGetAllMy),

  getAll: adminProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .handler(handleGetAll),

  sendToGroup: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .handler(handleSendToGroup),

  sendToAll: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .handler(handleSendToAll),

  sendRankingUpdateToGroups: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleSendRankingUpdateToGroups),

  sendCoinAddedToGroup: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        coins: z.number(),
        reason: z.string().optional(),
      }),
    )
    .handler(handleSendCoinAddedToGroup),

  sendCoinRemovedFromGroup: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        coins: z.number(),
        reason: z.string().optional(),
      }),
    )
    .handler(handleSendCoinRemovedFromGroup),

  sendNewMemberToGroup: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        userId: z.string(),
      }),
    )
    .handler(handleSendNewMemberToGroup),

  sendCustomToGroup: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .handler(handleSendCustomToGroup),

  retryNotification: moderatorProcedure
    .input(z.object({ notificationId: z.string() }))
    .handler(handleRetryNotification),

  delete: adminProcedure
    .input(z.object({ notificationId: z.string() }))
    .handler(handleDeleteNotification),
});
