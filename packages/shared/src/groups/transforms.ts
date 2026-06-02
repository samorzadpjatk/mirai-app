import { toUserWithEmail } from "./imageUtils";

export interface ApprovedSubmissionInput {
  id: string;
  imageIds: (string | null)[];
  challenge: { id: string; name: string };
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface ApprovedSubmissionOutput {
  submissionId: string;
  challengeId: string;
  challengeTitle: string;
  imageStoragePath: string;
  approvedAt: Date;
}

export function mapApprovedSubmissions(
  submissions: ApprovedSubmissionInput[],
): ApprovedSubmissionOutput[] {
  return submissions
    .filter((submission) => Boolean(submission.imageIds[0]))
    .map((submission) => ({
      submissionId: submission.id,
      challengeId: submission.challenge.id,
      challengeTitle: submission.challenge.name,
      imageStoragePath: submission.imageIds[0] as string,
      approvedAt: submission.reviewedAt ?? submission.createdAt,
    }));
}

export function buildParticipantCountMap(
  countRows: Array<{ groupId: string | null; count: number }>,
): Map<string | null, number> {
  return new Map(countRows.map((c) => [c.groupId, c.count]));
}

export interface PaginationResult {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function calculatePagination(
  limit: number,
  offset: number,
  total: number,
): PaginationResult {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

export function calculateNextOrganizer(
  remainingParticipants: Array<{ userId: string }>,
): string | null {
  return remainingParticipants[0]?.userId ?? null;
}

export function calculateCoinsAfterTransaction(
  currentCoins: number | null | undefined,
  amount: number,
): number {
  return (currentCoins ?? 0) + amount;
}

export interface LeaveResult {
  left: true;
  reassignedOrganizerId: string | null;
  groupDeleted: boolean;
}

export function buildLeaveResult(
  left: true,
  reassignedOrganizerId: string | null,
  groupDeleted: boolean,
): LeaveResult {
  return {
    left,
    reassignedOrganizerId,
    groupDeleted,
  };
}

export function toGroupDetail<
  TGroup extends { organizer?: any | null; participants: Array<{ user: any } & any> },
>(
  group: TGroup,
  emailMap: Map<string, string | null>,
  imageUrl: string | null | undefined,
  participantCount: number,
  approvedSubmissions: ApprovedSubmissionOutput[],
): Omit<TGroup, "organizer" | "participants" | "image"> & {
  _count: { participants: number };
  image: string | null | undefined;
  organizer: any | null;
  participants: Array<any>;
  approvedSubmissions: ApprovedSubmissionOutput[];
} {
  const { organizer, participants, ...rest } = group;

  return {
    ...rest,
    _count: { participants: participantCount },
    image: imageUrl,
    organizer: organizer ? toUserWithEmail(organizer, emailMap) : null,
    participants: participants.map((p) => ({
      ...p,
      user: toUserWithEmail(p.user, emailMap),
    })),
    approvedSubmissions,
  } as any;
}
