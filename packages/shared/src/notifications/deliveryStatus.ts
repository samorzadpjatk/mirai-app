export type DeliveryStatus = "success" | "partial_failure" | "failure";

export function buildDeliveryStatus(
  successCount: number,
  failureCount: number,
): DeliveryStatus {
  if (failureCount === 0) return "success";
  if (successCount === 0) return "failure";
  return "partial_failure";
}
