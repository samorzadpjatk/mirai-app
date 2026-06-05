import type {
  Activity,
  BaseActivity,
  ChallengeEventActivity,
  CustomActivity,
  RankChangeActivity,
  SubmissionActivity,
  UserPostActivity,
} from "@mirai-app/orpc";

const baseActivityDefaults = {
  description: "",
  imageUrl: "",
  isPinned: false,
  isHidden: false,
  hiddenAt: null,
  hiddenReason: "",
  createdByAdmin: "",
  updatedAt: new Date(),
  admin: null,
  hiddenBy: null,
  reactionsSummary: {
    total: 0,
    counts: { heart: 0, fire: 0, clap: 0, star: 0 },
    myReactions: [],
  },
  submissionActivity: null,
  challengeActivity: null,
  rankChangeActivity: null,
  userPost: null,
};

export function createMockCustomActivity(
  overrides: Partial<Omit<CustomActivity, "activityType">> = {},
): CustomActivity {
  return {
    id: "activity-1",
    tripId: "trip-1",
    activityType: "custom",
    title: "Test Activity",
    createdAt: new Date(),
    ...baseActivityDefaults,
    ...overrides,
  } as CustomActivity;
}

export function createMockUserPostActivity(
  overrides: Partial<Omit<UserPostActivity, "activityType" | "userPost">> & {
    userPost?: Partial<UserPostActivity["userPost"]>;
  } = {},
): UserPostActivity {
  const { userPost: userPostOverrides, ...rest } = overrides;
  return {
    id: "activity-1",
    tripId: "trip-1",
    activityType: "user_post",
    title: "Test Post",
    createdAt: new Date(),
    ...baseActivityDefaults,
    ...rest,
    userPost: {
      authorId: "",
      additionalImages: [],
      author: null,
      ...userPostOverrides,
    },
  } as UserPostActivity;
}

export function createMockSubmissionActivity(
  overrides: Partial<Omit<SubmissionActivity, "activityType" | "submissionActivity">> & {
    submissionActivity?: Partial<SubmissionActivity["submissionActivity"]>;
  } = {},
): SubmissionActivity {
  const { submissionActivity: submissionOverrides, ...rest } = overrides;
  return {
    id: "activity-1",
    tripId: "trip-1",
    activityType: "submission",
    title: "Test Submission",
    createdAt: new Date(),
    ...baseActivityDefaults,
    ...rest,
    submissionActivity: {
      submissionId: "",
      challengeId: "",
      groupId: "",
      hasVideo: false,
      isWinner: false,
      ranking: 0,
      pointsAwarded: 0,
      currentGroupRank: null,
      group: null,
      challenge: null,
      submission: null,
      ...submissionOverrides,
    },
  } as SubmissionActivity;
}

export function createMockRankChangeActivity(
  overrides: Partial<Omit<RankChangeActivity, "activityType" | "rankChangeActivity">> & {
    rankChangeActivity?: Partial<RankChangeActivity["rankChangeActivity"]>;
  } = {},
): RankChangeActivity {
  const { rankChangeActivity: rankChangeOverrides, ...rest } = overrides;
  return {
    id: "activity-1",
    tripId: "trip-1",
    activityType: "rank_change",
    title: "Test Rank Change",
    createdAt: new Date(),
    ...baseActivityDefaults,
    ...rest,
    rankChangeActivity: {
      groupId: "",
      newRank: 1,
      totalCoins: 0,
      coinsGained: 0,
      group: null,
      ...rankChangeOverrides,
    },
  } as RankChangeActivity;
}

export type MockActivityInput = Partial<BaseActivity> & {
  activityType?: Activity["activityType"];
  submissionActivity?: Partial<SubmissionActivity["submissionActivity"]> | null;
  rankChangeActivity?: Partial<RankChangeActivity["rankChangeActivity"]> | null;
  challengeActivity?: Partial<ChallengeEventActivity["challengeActivity"]> | null;
  userPost?: Partial<UserPostActivity["userPost"]> | null;
};

export function createMockActivity(overrides: MockActivityInput = {}): Activity {
  const type = overrides.activityType ?? "custom";
  switch (type) {
    case "custom":
      return createMockCustomActivity(overrides as Parameters<typeof createMockCustomActivity>[0]);
    case "user_post":
      return createMockUserPostActivity(
        overrides as Parameters<typeof createMockUserPostActivity>[0],
      );
    case "submission":
      return createMockSubmissionActivity(
        overrides as Parameters<typeof createMockSubmissionActivity>[0],
      );
    case "rank_change":
      return createMockRankChangeActivity(
        overrides as Parameters<typeof createMockRankChangeActivity>[0],
      );
    case "challenge_event":
      return {
        id: "activity-1",
        tripId: "trip-1",
        activityType: "challenge_event",
        title: "Test Challenge",
        createdAt: new Date(),
        ...baseActivityDefaults,
        ...overrides,
        challengeActivity: {
          challengeId: "",
          eventType: "challenge_started",
          endTime: null,
          submissionType: "",
          basePoints: 0,
          submissionCount: 0,
          challenge: null,
          ...(overrides as { challengeActivity?: object }).challengeActivity,
        },
      } as Activity;
    default:
      return createMockCustomActivity(overrides as Parameters<typeof createMockCustomActivity>[0]);
  }
}
