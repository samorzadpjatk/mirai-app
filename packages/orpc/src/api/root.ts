import { createRouterClient } from "@orpc/server";
import type { RequestContext } from "../api/orpc";
import { activityFeedRouter } from "./routers/activityFeed";
import { challengeRouter } from "./routers/challenge";
import { challengeSubmissionRouter } from "./routers/challengeSubmission";
import { challengeVoteRouter } from "./routers/challengeVote";
import { coinRouter } from "./routers/coin";
import { coinTransactionRouter } from "./routers/coinTransaction";
import { groupRouter } from "./routers/group";
import { locationRouter } from "./routers/location";
import { notificationScheduleRouter } from "./routers/notificationSchedule";
import { notificationRouter } from "./routers/notifications";
import { rewardRouter } from "./routers/reward";
import { sponsorRouter } from "./routers/sponsor";
import { storageRouter } from "./routers/storage";
import { tripRouter } from "./routers/trip";
import { userRouter } from "./routers/user";

export const appRouter = {
  group: groupRouter,
  user: userRouter,
  coin: coinRouter,
  coinTransaction: coinTransactionRouter,
  notifications: notificationRouter,
  notificationSchedule: notificationScheduleRouter,
  location: locationRouter,
  trip: tripRouter,
  challenge: challengeRouter,
  challengeSubmission: challengeSubmissionRouter,
  challengeVote: challengeVoteRouter,
  storage: storageRouter,
  reward: rewardRouter,
  activityFeed: activityFeedRouter,
  sponsor: sponsorRouter,
};

export type AppRouter = typeof appRouter;

export const createCaller = (context: RequestContext) => createRouterClient(appRouter, { context });
