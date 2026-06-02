export interface Subscription {
  id: string;
  token: string;
  createdAt: Date;
}

export interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptions: Subscription[];
}

export function mapSubscriptionStatus(
  subscriptions: Subscription[],
): SubscriptionStatus {
  return {
    isSubscribed: subscriptions.length > 0,
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      token: s.token,
      createdAt: s.createdAt,
    })),
  };
}

export interface PaginationBounds {
  totalPages: number;
}

export function buildPaginationBounds(
  count: number,
  pageSize: number,
): PaginationBounds {
  return {
    totalPages: Math.ceil(count / pageSize),
  };
}
