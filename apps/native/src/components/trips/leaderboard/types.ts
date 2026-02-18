export interface RankedGroup {
  id: string;
  name: string;
  image?: string | null;
  coins: number;
  memberCount: number;
  rank: number;
  isCurrentUserGroup: boolean;
}
