/**
 * DTO Dependency Injection Tags
 *
 * This module provides Effect Context.Tags for DTO-related services.
 * These tags enable dependency injection of DTO mappers, validators,
 * and transformation services throughout the application.
 *
 * ## Usage
 *
 * ### In use cases or controllers:
 * ```typescript
 * import { UserDTOTag } from "@mirai-app/use-cases";
 *
 * const program = Effect.gen(function* () {
 *   const userDTOService = yield* UserDTOTag;
 *   const dto = userDTOService.fromDomain(user);
 * });
 * ```
 *
 * ### In tests:
 * ```typescript
 * import { Layer } from "effect";
 * import { UserDTOTag } from "@mirai-app/use-cases";
 *
 * const mockUserDTOService = {
 *   fromDomain: (user) => user,
 *   toDomain: (dto) => dto,
 * };
 *
 * const testLayer = Layer.succeed(UserDTOTag, mockUserDTOService);
 * ```
 */

import { Context } from "effect";
import type {
  UserDTO,
  ActivityFeedDTO,
  ActivityReactionDTO,
  ChallengeDTO,
  ChallengeSubmissionDTO,
  ChallengeVoteDTO,
  EventDTO,
  EventParticipantDTO,
  GroupDTO,
  GroupMemberDTO,
  LocationDTO,
  LocationSharingDTO,
  NotificationDTO,
  NotificationDeliveryDTO,
  NotificationScheduleDTO,
  RewardDTO,
  RewardPurchaseDTO,
  SponsorDTO,
  TripDTO,
  TripParticipantDTO,
  SubmissionReportDTO,
} from "../dto";

// Import domain types for transformation signatures
import type {
  User,
  ActivityFeed,
  ActivityReaction,
  Challenge,
  ChallengeSubmission,
  ChallengeVote,
  Event,
  Group,
  Location,
  Notification,
  NotificationDelivery,
  NotificationSchedule,
  Reward,
  RewardPurchase,
  Sponsor,
  Trip,
  SubmissionReport,
} from "@mirai-app/domain";

/**
 * User DTO Service Interface
 *
 * Provides transformation between User domain entities and UserDTOs.
 */
export interface UserDTOService {
  /** Convert a domain User to a UserDTO */
  fromDomain(user: User): UserDTO;
  /** Convert a UserDTO to domain User (partial, for updates) */
  toDomain(dto: Partial<UserDTO>): Partial<User>;
}

/**
 * Activity Feed DTO Service Interface
 */
export interface ActivityFeedDTOService {
  fromDomain(activity: ActivityFeed): ActivityFeedDTO;
  fromDomainList(activities: ActivityFeed[]): ActivityFeedDTO[];
  fromReactionDomain(reaction: ActivityReaction): ActivityReactionDTO;
}

/**
 * Challenge DTO Service Interface
 */
export interface ChallengeDTOService {
  fromDomain(challenge: Challenge): ChallengeDTO;
  fromDomainList(challenges: Challenge[]): ChallengeDTO[];
  fromSubmissionDomain(submission: ChallengeSubmission): ChallengeSubmissionDTO;
  fromVoteDomain(vote: ChallengeVote): ChallengeVoteDTO;
}

/**
 * Event DTO Service Interface
 */
export interface EventDTOService {
  fromDomain(event: Event): EventDTO;
  fromDomainList(events: Event[]): EventDTO[];
}

/**
 * Group DTO Service Interface
 */
export interface GroupDTOService {
  fromDomain(group: Group): GroupDTO;
  fromDomainList(groups: Group[]): GroupDTO[];
}

/**
 * Location DTO Service Interface
 */
export interface LocationDTOService {
  fromDomain(location: Location): LocationDTO;
  fromDomainList(locations: Location[]): LocationDTO[];
}

/**
 * Notification DTO Service Interface
 */
export interface NotificationDTOService {
  fromDomain(notification: Notification): NotificationDTO;
  fromDomainList(notifications: Notification[]): NotificationDTO[];
  fromDeliveryDomain(delivery: NotificationDelivery): NotificationDeliveryDTO;
  fromScheduleDomain(schedule: NotificationSchedule): NotificationScheduleDTO;
}

/**
 * Reward DTO Service Interface
 */
export interface RewardDTOService {
  fromDomain(reward: Reward): RewardDTO;
  fromDomainList(rewards: Reward[]): RewardDTO[];
  fromPurchaseDomain(purchase: RewardPurchase): RewardPurchaseDTO;
}

/**
 * Sponsor DTO Service Interface
 */
export interface SponsorDTOService {
  fromDomain(sponsor: Sponsor): SponsorDTO;
  fromDomainList(sponsors: Sponsor[]): SponsorDTO[];
}

/**
 * Trip DTO Service Interface
 */
export interface TripDTOService {
  fromDomain(trip: Trip): TripDTO;
  fromDomainList(trips: Trip[]): TripDTO[];
}

/**
 * Submission Report DTO Service Interface
 */
export interface SubmissionReportDTOService {
  fromDomain(report: SubmissionReport): SubmissionReportDTO;
  fromDomainList(reports: SubmissionReport[]): SubmissionReportDTO[];
}

// =============================================================================
// Effect Context.Tags for DTO Services
// =============================================================================

/**
 * User DTO Service Context.Tag
 *
 * Use this tag to access the UserDTOService in Effect programs:
 * ```typescript
 * const userDTOService = yield* UserDTOTag;
 * ```
 */
export class UserDTOTag extends Context.Tag("UserDTOService")<
  UserDTOTag,
  UserDTOService
>() {}

/**
 * Activity Feed DTO Service Context.Tag
 */
export class ActivityFeedDTOTag extends Context.Tag("ActivityFeedDTOService")<
  ActivityFeedDTOTag,
  ActivityFeedDTOService
>() {}

/**
 * Challenge DTO Service Context.Tag
 */
export class ChallengeDTOTag extends Context.Tag("ChallengeDTOService")<
  ChallengeDTOTag,
  ChallengeDTOService
>() {}

/**
 * Event DTO Service Context.Tag
 */
export class EventDTOTag extends Context.Tag("EventDTOService")<
  EventDTOTag,
  EventDTOService
>() {}

/**
 * Group DTO Service Context.Tag
 */
export class GroupDTOTag extends Context.Tag("GroupDTOService")<
  GroupDTOTag,
  GroupDTOService
>() {}

/**
 * Location DTO Service Context.Tag
 */
export class LocationDTOTag extends Context.Tag("LocationDTOService")<
  LocationDTOTag,
  LocationDTOService
>() {}

/**
 * Notification DTO Service Context.Tag
 */
export class NotificationDTOTag extends Context.Tag("NotificationDTOService")<
  NotificationDTOTag,
  NotificationDTOService
>() {}

/**
 * Reward DTO Service Context.Tag
 */
export class RewardDTOTag extends Context.Tag("RewardDTOService")<
  RewardDTOTag,
  RewardDTOService
>() {}

/**
 * Sponsor DTO Service Context.Tag
 */
export class SponsorDTOTag extends Context.Tag("SponsorDTOService")<
  SponsorDTOTag,
  SponsorDTOService
>() {}

/**
 * Trip DTO Service Context.Tag
 */
export class TripDTOTag extends Context.Tag("TripDTOService")<
  TripDTOTag,
  TripDTOService
>() {}

/**
 * Submission Report DTO Service Context.Tag
 */
export class SubmissionReportDTOTag extends Context.Tag(
  "SubmissionReportDTOService",
)<SubmissionReportDTOTag, SubmissionReportDTOService>() {}
