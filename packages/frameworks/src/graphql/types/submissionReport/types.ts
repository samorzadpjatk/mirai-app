import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { SubmissionReportDTO } from "@mirai-app/use-cases";

/**
 * SubmissionReport Type
 *
 * GraphQL type definition for submission reports.
 */
const SubmissionReportType = builder.objectType("SubmissionReport", {
  description: "A report on a challenge submission",
  fields: (t) => ({
    id: t.exposeID("id"),
    submissionId: t.exposeID("submissionId"),
    reporterId: t.exposeID("reporterId"),
    reason: t.exposeString("reason"),
    description: t.exposeString("description", { nullable: true }),
    status: t.exposeString("status"),
    reviewedById: t.exposeID("reviewedById", { nullable: true }),
    reviewedAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (report: SubmissionReportDTO) => report.reviewedAt,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (report: SubmissionReportDTO) => report.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (report: SubmissionReportDTO) => report.updatedAt,
    }),
  }),
});

/**
 * SubmissionReport Edge Type
 */
const SubmissionReportEdgeType = builder.objectType("SubmissionReportEdge", {
  description: "An edge in a submission report connection",
  fields: (t) => ({
    node: t.field({
      type: SubmissionReportType,
      resolve: (parent: { node: SubmissionReportDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * SubmissionReport Connection Type
 *
 * Relay-compliant connection type for paginated submission reports.
 */
const SubmissionReportConnectionType = builder.objectType(
  "SubmissionReportConnection",
  {
    description: "A connection of submission reports for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [SubmissionReportEdgeType],
        resolve: (parent: {
          edges: Array<{ node: SubmissionReportDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [SubmissionReportType],
        resolve: (parent: { nodes: SubmissionReportDTO[] }) => parent.nodes,
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
        resolve: () => undefined, // Not implemented for performance
      }),
    }),
  },
);

/**
 * Helper to encode submission report cursor
 */
function encodeSubmissionReportCursor(report: SubmissionReportDTO): string {
  return encodeCursor({
    id: report.id,
    createdAt: report.createdAt.toISOString(),
  });
}

/**
 * Helper to build submission report connection response
 */
function buildSubmissionReportConnection(
  items: SubmissionReportDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: SubmissionReportDTO; cursor: string }>;
  nodes: SubmissionReportDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeSubmissionReportCursor(item),
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
  SubmissionReportType,
  SubmissionReportEdgeType,
  SubmissionReportConnectionType,
  encodeSubmissionReportCursor,
  buildSubmissionReportConnection,
};
