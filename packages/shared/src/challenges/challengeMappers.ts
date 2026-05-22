export interface DBChallenge {
  id: string;
  name: string;
  submissionType?:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE"
    | null;
  basePoints?: number | null;
  firstPlacePoints?: number | null;
  scoringCategory?: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING" | null;
  description?: string | null;
  image?: string | null;
  status?: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED" | null;
  participantGroupsCount?: number | null;
  myGroupSubmissionStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
}

export interface ChallengeListItem {
  id: string;
  title: string;
  points: number;
  icon: string;
  iconColor: string;
  status: "locked" | "solved" | "submitted" | "rejected" | "visible" | "completed" | "to_solve";
  submissionType: string;
  scoringCategory?: string;
  lifecycleStatus: string;
  description?: string;
  image?: string;
  participantGroupsCount: number;
}

export const mapChallengeToListItem = (
  dbChallenge: DBChallenge,
  iconColor: string,
): ChallengeListItem => {
  const rawStatus = dbChallenge.status ?? "HIDDEN";
  const mySubmissionStatus = dbChallenge.myGroupSubmissionStatus ?? null;

  const status: ChallengeListItem["status"] =
    rawStatus === "HIDDEN" || rawStatus === "CANCELLED"
      ? "locked"
      : mySubmissionStatus === "APPROVED"
        ? "solved"
        : mySubmissionStatus === "PENDING"
          ? "submitted"
          : mySubmissionStatus === "REJECTED"
            ? "rejected"
            : rawStatus === "VOTING_PHASE"
              ? "locked"
              : rawStatus === "COMPLETED"
                ? "completed"
                : rawStatus === "VISIBLE"
                  ? "visible"
                  : "to_solve";

  const basePoints = dbChallenge.basePoints ?? 0;
  const maxPoints =
    dbChallenge.scoringCategory === "UNLIMITED"
      ? basePoints
      : (dbChallenge.firstPlacePoints ?? basePoints);

  return {
    id: dbChallenge.id,
    title: dbChallenge.name,
    points: maxPoints,
    icon: "trophy",
    iconColor,
    status,
    submissionType: dbChallenge.submissionType ?? "IMAGE",
    scoringCategory: dbChallenge.scoringCategory ?? undefined,
    lifecycleStatus: rawStatus,
    description: dbChallenge.description ?? undefined,
    image: dbChallenge.image ?? undefined,
    participantGroupsCount: dbChallenge.participantGroupsCount ?? 0,
  };
};

export const countCompletedChallenges = (challenges: ChallengeListItem[]): number =>
  challenges.filter((c) => c.status === "solved" || c.status === "submitted").length;
