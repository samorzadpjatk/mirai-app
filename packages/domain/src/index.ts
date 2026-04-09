/**
 * @repo/domain - Domain Layer Exports
 *
 * This package contains pure business logic with ZERO external dependencies.
 * All exports are pure TypeScript/JavaScript - no frameworks, no I/O.
 */

// Utilities (export first as they're used by other modules)
export {
  // Result type and functions
  type Result,
  ok,
  err,
  isSuccess,
  isError,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  map,
  mapError,
  flatMap,
  match,
  all,
  zip2,
  zip3,
  ResultWrapper,
} from "./utils/result";

// Validation utilities
export {
  isValidEmail,
  validateEmail,
  validateNotEmpty,
  validateMinLength,
  validateMaxLength,
  isValidUUID,
  validateUUID,
  isValidURL,
  isFutureDate,
  isPastDate,
  isValidDateRange,
} from "./utils/validation";

// Entities
export * from "./entities/User";
export * from "./entities/Challenge";
export * from "./entities/Notification";
export * from "./entities/NotificationSchedule";
export * from "./entities/Group";
export * from "./entities/Trip";
export * from "./entities/ActivityFeed";
export * from "./entities/ChallengeSubmission";
export * from "./entities/Reward";
export * from "./entities/Location";
export * from "./entities/ChallengeVote";
export * from "./entities/Sponsor";
export * from "./entities/SubmissionReport";

// Value Objects
export * from "./value-objects/UserId";
export * from "./value-objects/ChallengeId";
export * from "./value-objects/NotificationId";
export * from "./value-objects/NotificationScheduleId";
export * from "./value-objects/TripId";
export * from "./value-objects/ActivityId";
export * from "./value-objects/SubmissionId";
export * from "./value-objects/RewardId";
export * from "./value-objects/CoinAmount";
export * from "./value-objects/LocationId";
export * from "./value-objects/ChallengeVoteId";
export * from "./value-objects/VotePosition";
export * from "./value-objects/VoteWeight";
export * from "./value-objects/SponsorId";
export * from "./value-objects/TripSponsorId";
export * from "./value-objects/ReportId";
export * from "./value-objects/ReportReason";
// export * from "./value-objects/Email";
