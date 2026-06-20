export interface RetryResult {
  sent: number;
  failed: number;
  total: number;
  success: boolean;
}

export interface NotificationRetryResult extends RetryResult {
  notificationId: string;
  retriedCount: number;
}

export function buildRetryResult(
  retryResult: RetryResult,
  notificationId: string,
  retriedCount: number,
): NotificationRetryResult {
  return {
    notificationId,
    retriedCount,
    sent: retryResult.sent,
    failed: retryResult.failed,
    total: retryResult.total,
    success: retryResult.success,
  };
}
