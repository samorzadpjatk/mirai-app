export interface GroupListItem {
  id: string;
  name: string;
  code: string;
  image?: string | null;
  participantCount: number;
  coins?: number;
  organizer?: {
    authUserId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}
