export {
  createORPCContext,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
  serviceAccountProcedure,
  mobileAppProcedure,
  type RequestContext,
} from "./api/orpc";

export { appRouter, createCaller, type AppRouter } from "./api/root";
export { serviceRouter, createServiceCaller, type ServiceRouter } from "./api/service-root";
export { logger } from "./utils/logger";
export {
  DEFAULT_PEER_VOTING_DURATION_HOURS,
  formatSubmissionDeadline,
  resolvePeerVotingDurationHours,
  resolvePodiumPoints,
  createChallengeCompletionWithWinnersById,
  createChallengeStatusActivityById,
  createChallengeStatusActivityFromTransition,
  promoteVisibleChallengesToActiveWithFeed,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  finalizeVotingChallengesToCompletedWithFeed,
  captureTripRankingSnapshot,
  createRankChangeActivities,
} from "./utils/activityFeed";

export type {
  Activity,
  ActivityType,
  BaseActivity,
  CustomActivity,
  UserPostActivity,
  SubmissionActivity,
  ChallengeEventActivity,
  RankChangeActivity,
  ReactionsSummary,
  AdminSnippet,
  GroupSnippet,
  ChallengeSnippet,
  SubmissionSnippet,
  RawActivityWithRelations,
} from "./api/routers/activityFeed/types";
