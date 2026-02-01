export interface TripListItem {
  id: string;
  name: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  groups?: unknown[];
}
