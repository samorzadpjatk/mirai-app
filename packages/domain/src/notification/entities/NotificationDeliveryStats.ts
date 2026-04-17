/**
 * NotificationDeliveryStats DTO
 * Statistics about notification delivery performance
 */
export interface NotificationDeliveryStats {
  totalDeliveries: number;
  totalRecipients: number;
  totalSuccess: number;
  totalFailures: number;
  avgSuccessPerDelivery: number;
  avgFailuresPerDelivery: number;
  successRate: number;
  statusBreakdown: Record<string, number>;
}
