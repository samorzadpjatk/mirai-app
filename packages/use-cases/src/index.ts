// Export all use-cases modules as namespaces
export * as activityFeed from "./activity-feed";
export * as auth from "./auth";
export * as challenge from "./challenge";
export * as challengeSubmission from "./challenge-submission";
export * as challengeVote from "./challenge-vote";
export * as coin from "./coin";
export * as group from "./group";
export * as location from "./location";
export * as notification from "./notification";
export * as reward from "./reward";
export * as sponsor from "./sponsor";
export * as storage from "./storage";
export * as submissionReport from "./submission-report";
export * as trip from "./trip";
export * as user from "./user";

// Export shared service ports
export {
  AuthPortTag,
  StoragePortTag,
  EventBusTag,
  EmailPortTag,
} from "./shared/ports";

// Export new AuthN and AuthZ port tags
export { AuthNPortTag, AuthZPortTag } from "./auth/ports";
