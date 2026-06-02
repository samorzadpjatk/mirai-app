export interface DeliveryStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  partial: number;
  successRate: number;
}

export function buildDeliveryStats(
  deliveries: Array<{ status: string }>,
): DeliveryStats {
  const total = deliveries.length;
  const successful = deliveries.filter((d) => d.status === "success").length;
  const failed = deliveries.filter((d) => d.status === "failure").length;
  const pending = deliveries.filter((d) => d.status === "pending").length;
  const partial = deliveries.filter((d) => d.status === "partial_failure").length;

  return {
    total,
    successful,
    failed,
    pending,
    partial,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
  };
}
