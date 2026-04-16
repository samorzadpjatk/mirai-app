import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type {
  ChallengeDTO,
  ChallengeSubmissionDTO,
  ChallengeVoteDTO,
} from "@mirai-app/use-cases";

/**
 * ChallengeStatus Enum
 *
 * Represents the status of a challenge in its lifecycle.
 */
const ChallengeStatusEnum = builder.enumType("ChallengeStatus", {
  description: "The status of a challenge",
  values: [
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
    "HIDDEN",
    "VISIBLE",
    "VOTING_PHASE",
  ] as const,
});

/**
 * SubmissionType Enum
 *
 * Represents the type of submission accepted for a challenge.
 */
const SubmissionTypeEnum = builder.enumType("SubmissionType", {
  description: "The type of submission accepted for a challenge",
  values: ["PHOTO", "VIDEO", "TEXT"] as const,
});

/**
 * SubmissionStatus Enum
 *
 * Represents the status of a challenge submission.
 */
const SubmissionStatusEnum = builder.enumType("SubmissionStatus", {
  description: "The status of a challenge submission",
  values: ["PENDING", "APPROVED", "REJECTED"] as const,
});

/**
 * Challenge Type
 *
 * GraphQL type definition for challenges.
 */
const ChallengeType = builder.objectType("Challenge", {
  description: "A challenge in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    name: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
    status: t.field({
      type: ChallengeStatusEnum,
      resolve: (challenge: ChallengeDTO) => challenge.status,
    }),
    type: t.field({
      type: SubmissionTypeEnum,
      resolve: (challenge: ChallengeDTO) => challenge.submissionType,
    }),
    startTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (challenge: ChallengeDTO) => challenge.startDate,
    }),
    endTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (challenge: ChallengeDTO) => challenge.endDate,
    }),
    dailyStartTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: () => null,
    }),
    dailyEndTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: () => null,
    }),
    submissionType: t.field({
      type: SubmissionTypeEnum,
      resolve: (challenge: ChallengeDTO) => challenge.submissionType,
    }),
    maxSubmissions: t.field({
      type: "Int",
      nullable: true,
      resolve: () => null,
    }),
    allowVoting: t.field({
      type: "Boolean",
      resolve: (challenge: ChallengeDTO) =>
        challenge.scoringCategory === "PEER_VOTING",
    }),
    votingStartTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: () => null,
    }),
    votingEndTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: () => null,
    }),
    points: t.field({
      type: "Int",
      resolve: (challenge: ChallengeDTO) => challenge.points,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (challenge: ChallengeDTO) => challenge.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (challenge: ChallengeDTO) => challenge.updatedAt,
    }),
  }),
});

/**
 * Challenge Edge Type
 */
const ChallengeEdgeType = builder.objectType("ChallengeEdge", {
  description: "An edge in a challenge connection",
  fields: (t) => ({
    node: t.field({
      type: ChallengeType,
      resolve: (parent: { node: ChallengeDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Challenge Connection Type
 *
 * Relay-compliant connection type for paginated challenges.
 */
const ChallengeConnectionType = builder.objectType("ChallengeConnection", {
  description: "A connection of challenges for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [ChallengeEdgeType],
      resolve: (parent: {
        edges: Array<{ node: ChallengeDTO; cursor: string }>;
      }) => parent.edges,
    }),
    nodes: t.field({
      type: [ChallengeType],
      resolve: (parent: { nodes: ChallengeDTO[] }) => parent.nodes,
    }),
    pageInfo: t.field({
      type: "PageInfo",
      resolve: (parent: {
        pageInfo: {
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor: string | null;
          endCursor: string | null;
        };
      }) => parent.pageInfo,
    }),
    totalCount: t.field({
      type: "Int",
      nullable: true,
      resolve: () => undefined,
    }),
  }),
});

/**
 * ChallengeSubmission Type
 *
 * GraphQL type definition for challenge submissions.
 */
const ChallengeSubmissionType = builder.objectType("ChallengeSubmission", {
  description: "A submission to a challenge",
  fields: (t) => ({
    id: t.exposeID("id"),
    challengeId: t.exposeID("challengeId"),
    groupId: t.exposeID("groupId", { nullable: true }),
    userId: t.exposeID("userId"),
    content: t.exposeString("content", { nullable: true }),
    mediaUrls: t.field({
      type: ["String"],
      resolve: (submission: ChallengeSubmissionDTO) => submission.mediaUrls,
    }),
    status: t.field({
      type: SubmissionStatusEnum,
      resolve: (submission: ChallengeSubmissionDTO) => submission.status,
    }),
    score: t.field({
      type: "Int",
      nullable: true,
      resolve: (submission: ChallengeSubmissionDTO) => submission.score,
    }),
    voteScore: t.field({
      type: "Int",
      resolve: (submission: ChallengeSubmissionDTO) => submission.voteScore,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (submission: ChallengeSubmissionDTO) => submission.submittedAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (submission: ChallengeSubmissionDTO) => submission.updatedAt,
    }),
  }),
});

/**
 * ChallengeSubmission Edge Type
 */
const ChallengeSubmissionEdgeType = builder.objectType(
  "ChallengeSubmissionEdge",
  {
    description: "An edge in a challenge submission connection",
    fields: (t) => ({
      node: t.field({
        type: ChallengeSubmissionType,
        resolve: (parent: { node: ChallengeSubmissionDTO; cursor: string }) =>
          parent.node,
      }),
      cursor: t.exposeString("cursor"),
    }),
  },
);

/**
 * ChallengeSubmission Connection Type
 *
 * Relay-compliant connection type for paginated challenge submissions.
 */
const ChallengeSubmissionConnectionType = builder.objectType(
  "ChallengeSubmissionConnection",
  {
    description: "A connection of challenge submissions for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [ChallengeSubmissionEdgeType],
        resolve: (parent: {
          edges: Array<{ node: ChallengeSubmissionDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [ChallengeSubmissionType],
        resolve: (parent: { nodes: ChallengeSubmissionDTO[] }) => parent.nodes,
      }),
      pageInfo: t.field({
        type: "PageInfo",
        resolve: (parent: {
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string | null;
            endCursor: string | null;
          };
        }) => parent.pageInfo,
      }),
      totalCount: t.field({
        type: "Int",
        nullable: true,
        resolve: () => undefined,
      }),
    }),
  },
);

/**
 * ChallengeVote Type
 *
 * GraphQL type definition for challenge votes.
 */
const ChallengeVoteType = builder.objectType("ChallengeVote", {
  description: "A vote on a challenge submission",
  fields: (t) => ({
    id: t.exposeID("id"),
    challengeId: t.exposeID("challengeId"),
    submissionId: t.exposeID("submissionId"),
    voterId: t.exposeID("voterId"),
    position: t.field({
      type: "Int",
      resolve: (vote: ChallengeVoteDTO) => vote.votePosition,
    }),
    points: t.field({
      type: "Int",
      resolve: (vote: ChallengeVoteDTO) => vote.votePoints,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (vote: ChallengeVoteDTO) => vote.votedAt,
    }),
  }),
});

/**
 * ChallengeVote Edge Type
 */
const ChallengeVoteEdgeType = builder.objectType("ChallengeVoteEdge", {
  description: "An edge in a challenge vote connection",
  fields: (t) => ({
    node: t.field({
      type: ChallengeVoteType,
      resolve: (parent: { node: ChallengeVoteDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * ChallengeVote Connection Type
 *
 * Relay-compliant connection type for paginated challenge votes.
 */
const ChallengeVoteConnectionType = builder.objectType(
  "ChallengeVoteConnection",
  {
    description: "A connection of challenge votes for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [ChallengeVoteEdgeType],
        resolve: (parent: {
          edges: Array<{ node: ChallengeVoteDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [ChallengeVoteType],
        resolve: (parent: { nodes: ChallengeVoteDTO[] }) => parent.nodes,
      }),
      pageInfo: t.field({
        type: "PageInfo",
        resolve: (parent: {
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string | null;
            endCursor: string | null;
          };
        }) => parent.pageInfo,
      }),
      totalCount: t.field({
        type: "Int",
        nullable: true,
        resolve: () => undefined,
      }),
    }),
  },
);

/**
 * Helper to encode challenge cursor
 * Uses createdAt as the primary sort field
 */
function encodeChallengeCursor(challenge: ChallengeDTO): string {
  return encodeCursor({
    id: challenge.id,
    createdAt: challenge.createdAt.toISOString(),
  });
}

/**
 * Helper to encode challenge submission cursor
 * Uses createdAt as the primary sort field
 */
function encodeChallengeSubmissionCursor(
  submission: ChallengeSubmissionDTO,
): string {
  return encodeCursor({
    id: submission.id,
    createdAt: submission.submittedAt.toISOString(),
  });
}

/**
 * Helper to encode challenge vote cursor
 * Uses votedAt as the primary sort field
 */
function encodeChallengeVoteCursor(vote: ChallengeVoteDTO): string {
  return encodeCursor({
    id: vote.id,
    createdAt: vote.votedAt.toISOString(),
  });
}

/**
 * Helper to build challenge connection response
 */
function buildChallengeConnection(
  items: ChallengeDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: ChallengeDTO; cursor: string }>;
  nodes: ChallengeDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeChallengeCursor(item),
  }));

  return {
    edges,
    nodes: items,
    pageInfo: {
      hasNextPage: hasMore,
      hasPreviousPage,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}

/**
 * Helper to build challenge submission connection response
 */
function buildChallengeSubmissionConnection(
  items: ChallengeSubmissionDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: ChallengeSubmissionDTO; cursor: string }>;
  nodes: ChallengeSubmissionDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeChallengeSubmissionCursor(item),
  }));

  return {
    edges,
    nodes: items,
    pageInfo: {
      hasNextPage: hasMore,
      hasPreviousPage,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}

/**
 * Helper to build challenge vote connection response
 */
function buildChallengeVoteConnection(
  items: ChallengeVoteDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: ChallengeVoteDTO; cursor: string }>;
  nodes: ChallengeVoteDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeChallengeVoteCursor(item),
  }));

  return {
    edges,
    nodes: items,
    pageInfo: {
      hasNextPage: hasMore,
      hasPreviousPage,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}

export {
  ChallengeType,
  ChallengeEdgeType,
  ChallengeConnectionType,
  ChallengeStatusEnum,
  SubmissionTypeEnum,
  SubmissionStatusEnum,
  ChallengeSubmissionType,
  ChallengeSubmissionEdgeType,
  ChallengeSubmissionConnectionType,
  ChallengeVoteType,
  ChallengeVoteEdgeType,
  ChallengeVoteConnectionType,
  encodeChallengeCursor,
  encodeChallengeSubmissionCursor,
  encodeChallengeVoteCursor,
  buildChallengeConnection,
  buildChallengeSubmissionConnection,
  buildChallengeVoteConnection,
};
