export interface NotificationAuthor {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export interface NotificationItem {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  tripId: string | null;
  title: string;
  body: string;
  url: string;
  createdById: string;
  createdBy?: NotificationAuthor | null;
}

export interface NotificationScheduleItem {
  id: string;
  name: string;
  createdAt: Date | string;
  createdBy?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  isActive: boolean;
  notificationType: string;
  trip?: {
    name?: string | null;
  } | null;
  hour: number;
  minute: number;
  startDate: Date | string;
  endDate: Date | string;
  lastRun?: Date | string | null;
}
