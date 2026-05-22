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

export const emptyReactionSummary = (): ReactionSummary => ({
  total: 0,
  counts: {
    heart: 0,
    fire: 0,
    clap: 0,
    star: 0,
  },
  myReactions: [],
});

export const toggleHeartSummary = (summary: ReactionSummary | undefined): ReactionSummary => {
  const normalized = summary ?? emptyReactionSummary();
  const myReactions = new Set(normalized.myReactions ?? []);
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
      ...normalized.counts,
      heart: Math.max(0, normalized.counts.heart + (hadHeart ? -1 : 1)),
    },
    myReactions: Array.from(myReactions),
  };
};
