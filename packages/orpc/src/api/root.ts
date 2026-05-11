import { createRouterClient } from "@orpc/server";
import { groupRouter } from "./routers/group";
import { userRouter } from "./routers/user";
import { coinRouter } from "./routers/coin";
import { coinTransactionRouter } from "./routers/coinTransaction";
import { notificationRouter } from "./routers/notifications";
import { notificationScheduleRouter } from "./routers/notificationSchedule";
import { notificationDeliveryRouter } from "./routers/notificationDelivery";
import { locationRouter } from "./routers/location";
import { tripRouter } from "./routers/trip";
import { challengeRouter } from "./routers/challenge";
import { challengeSubmissionRouter } from "./routers/challengeSubmission";
import { challengeVoteRouter } from "./routers/challengeVote";
import { submissionReportRouter } from "./routers/submissionReport";
import { notificationSenderRouter } from "./routers/notificationSender";
import { storageRouter } from "./routers/storage";
import { rewardRouter } from "./routers/reward";
import { activityFeedRouter } from "./routers/activityFeed";
import { sponsorRouter } from "./routers/sponsor";
import type { TRPCContext } from "../api/trpc";

export const appRouter = {
  group: groupRouter,
  user: userRouter,
  coin: coinRouter,
  coinTransaction: coinTransactionRouter,
  notifications: notificationRouter,
  notificationSchedule: notificationScheduleRouter,
  notificationDelivery: notificationDeliveryRouter,
  notificationSender: notificationSenderRouter,
  location: locationRouter,
  trip: tripRouter,
  challenge: challengeRouter,
  challengeSubmission: challengeSubmissionRouter,
  challengeVote: challengeVoteRouter,
  submissionReport: submissionReportRouter,
  storage: storageRouter,
  reward: rewardRouter,
  activityFeed: activityFeedRouter,
  sponsor: sponsorRouter,
};

export type AppRouter = typeof appRouter;

export const createCaller = (context: TRPCContext) => createRouterClient(appRouter, { context });
