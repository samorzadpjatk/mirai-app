export interface GroupListItem {
  id: string;
  name: string;
  code: string;
  image?: string | null;
  updatedAt?: string | number | Date;
  participantCount: number;
}
