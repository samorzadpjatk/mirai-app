export type ChallengeStatus =
  | "to_solve"
  | "submitted"
  | "solved"
  | "rejected"
  | "locked";

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
  lifecycleStatus:
    | "HIDDEN"
    | "VISIBLE"
    | "ACTIVE"
    | "VOTING_PHASE"
    | "COMPLETED"
    | "CANCELLED";
}
