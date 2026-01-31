export type ChallengeStatus = "selected" | "incomplete" | "locked";

export interface ChallengeListItem {
  id: string;
  title: string;
  points: number;
  icon: string;
  iconColor: string;
  status: ChallengeStatus;
  description?: string;
  image?: string;
}
