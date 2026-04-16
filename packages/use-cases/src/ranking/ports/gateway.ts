/**
 * Rank snapshot capturing group rankings at a point in time
 */
export type RankSnapshot = Map<
  string,
  {
    rank: number;
    coins: number;
    name: string;
    image: string | null;
  }
>;
