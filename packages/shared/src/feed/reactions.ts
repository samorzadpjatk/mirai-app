export interface ReactionSummary {
  total: number;
  counts: {
    heart: number;
    fire: number;
    clap: number;
    star: number;
  };
  myReactions: string[];
}

export const emptyReactionCounts = () => ({
  heart: 0,
  fire: 0,
  clap: 0,
  star: 0,
});

export const emptyReactionSummary = (): ReactionSummary => ({
  total: 0,
  counts: emptyReactionCounts(),
  myReactions: [],
});

export const toggleHeartSummary = (
  summary: (Partial<ReactionSummary> & { total: number }) | undefined,
): ReactionSummary => {
  const normalized = summary ?? emptyReactionSummary();
  const counts = normalized.counts ?? emptyReactionCounts();
  const myReactionsList = normalized.myReactions ?? [];
  const myReactions = new Set(myReactionsList);
  const hadHeart = myReactions.has("heart");

  if (hadHeart) {
    myReactions.delete("heart");
  } else {
    myReactions.add("heart");
  }

  return {
    ...normalized,
    total: Math.max(0, normalized.total + (hadHeart ? -1 : 1)),
    counts: {
      ...counts,
      heart: Math.max(0, counts.heart + (hadHeart ? -1 : 1)),
    },
    myReactions: Array.from(myReactions),
  };
};
