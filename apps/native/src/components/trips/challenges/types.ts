export type ChallengeStatus =
  | "to_solve"
  | "submitted"
  | "solved"
  | "rejected"
  | "completed"
  | "locked";

export type ChallengeSubmissionType =
  | "IMAGE"
  | "MULTI_IMAGE"
  | "VIDEO"
  | "TEXT"
  | "IMAGE_LOCATION"
  | "LOCATION"
  | "QR_CODE";

export type ChallengeScoringCategory =
  | "SPEED"
  | "UNLIMITED"
  | "JUDGED_STAFF"
  | "PEER_VOTING";

export interface ChallengeListItem {
  id: string;
  title: string;
  points: number;
  icon: string;
  iconColor: string;
  status: ChallengeStatus;
  description?: string;
  image?: string;
  participantGroupsCount: number;
  submissionType: ChallengeSubmissionType;
  scoringCategory?: ChallengeScoringCategory;
  lifecycleStatus:
    | "HIDDEN"
    | "VISIBLE"
    | "ACTIVE"
    | "VOTING_PHASE"
    | "COMPLETED"
    | "CANCELLED";
}
