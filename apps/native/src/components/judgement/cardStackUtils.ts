import { type ReviewStatus } from "~/stores/judgement";

export function canSubmitReject(rejectionReason: string, isReviewing: boolean): boolean {
  return rejectionReason.trim().length > 0 && !isReviewing;
}

export function calculateSwipeToValue(status: ReviewStatus, width: number): number {
  return status === "APPROVED" ? width * 1.2 : -width * 1.2;
}
