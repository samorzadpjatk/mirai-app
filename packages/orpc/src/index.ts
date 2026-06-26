export {
  adminProcedure,
  createORPCContext,
  mobileAppProcedure,
  moderatorProcedure,
  protectedProcedure,
  publicProcedure,
  type RequestContext,
  serviceAccountProcedure,
} from "./api/orpc";

export { type AppRouter, appRouter, createCaller } from "./api/root";
export type {
  Activity,
  ActivityType,
  AdminSnippet,
  BaseActivity,
  ChallengeEventActivity,
  ChallengeSnippet,
  CustomActivity,
  GroupSnippet,
  RankChangeActivity,
  RawActivityWithRelations,
  ReactionsSummary,
  SubmissionActivity,
  SubmissionSnippet,
  UserPostActivity,
} from "./api/routers/activityFeed/types";
export type {
  TripDetail,
  TripDetailGroup,
  TripDetailParticipant,
  TripDetailSponsor,
  TripDetailTripSponsor,
} from "./api/routers/trip/types";
export { createServiceCaller, type ServiceRouter, serviceRouter } from "./api/service-root";
export {
  captureTripRankingSnapshot,
  createChallengeCompletionWithWinnersById,
  createChallengeStatusActivityById,
  createChallengeStatusActivityFromTransition,
  createRankChangeActivities,
  DEFAULT_PEER_VOTING_DURATION_HOURS,
  finalizeVotingChallengesToCompletedWithFeed,
  formatSubmissionDeadline,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
  resolvePeerVotingDurationHours,
  resolvePodiumPoints,
} from "./utils/activityFeed";
export { logger } from "./utils/logger";
