import { builder } from "../builder";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../utils/connections";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { SponsorDTO, TripSponsorDTO } from "@mirai-app/use-cases";

/**
 * Sponsor Type
 *
 * GraphQL type definition for sponsors.
 */
const SponsorType = builder.objectType("Sponsor", {
  description: "A sponsor in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    websiteUrl: t.exposeString("websiteUrl", { nullable: true }),
    contactEmail: t.exposeString("contactEmail", { nullable: true }),
    contactPhone: t.exposeString("contactPhone", { nullable: true }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (sponsor: SponsorDTO) => sponsor.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (sponsor: SponsorDTO) => sponsor.updatedAt,
    }),
  }),
});

/**
 * Trip Sponsor Type
 *
 * GraphQL type definition for sponsors linked to trips.
 */
const TripSponsorType = builder.objectType("TripSponsor", {
  description: "A sponsor linked to a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    sponsorId: t.exposeID("sponsorId"),
    tier: t.exposeString("tier"),
    benefits: t.exposeString("benefits", { nullable: true }),
    displayOrder: t.exposeInt("displayOrder"),
    isActive: t.exposeBoolean("isActive"),
    linkedAt: t.field({
      type: "DateTime",
      resolve: (tripSponsor: TripSponsorDTO) => tripSponsor.linkedAt,
    }),
    linkedById: t.exposeID("linkedById"),
    sponsor: t.field({
      type: SponsorType,
      nullable: true,
      resolve: (tripSponsor: TripSponsorDTO) => tripSponsor.sponsor,
    }),
  }),
});

/**
 * Sponsor Edge Type
 */
const SponsorEdgeType = builder.objectType("SponsorEdge", {
  description: "An edge in a sponsor connection",
  fields: (t) => ({
    node: t.field({
      type: SponsorType,
      resolve: (parent: { node: SponsorDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Trip Sponsor Edge Type
 */
const TripSponsorEdgeType = builder.objectType("TripSponsorEdge", {
  description: "An edge in a trip sponsor connection",
  fields: (t) => ({
    node: t.field({
      type: TripSponsorType,
      resolve: (parent: { node: TripSponsorDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Sponsor Connection Type
 *
 * Relay-compliant connection type for paginated sponsors.
 */
const SponsorConnectionType = builder.objectType("SponsorConnection", {
  description: "A connection of sponsors for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [SponsorEdgeType],
      resolve: (parent: {
        edges: Array<{ node: SponsorDTO; cursor: string }>;
      }) => parent.edges,
    }),
    nodes: t.field({
      type: [SponsorType],
      resolve: (parent: { nodes: SponsorDTO[] }) => parent.nodes,
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
});

/**
 * Trip Sponsor Connection Type
 *
 * Relay-compliant connection type for paginated trip sponsors.
 */
const TripSponsorConnectionType = builder.objectType("TripSponsorConnection", {
  description: "A connection of trip sponsors for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [TripSponsorEdgeType],
      resolve: (parent: {
        edges: Array<{ node: TripSponsorDTO; cursor: string }>;
      }) => parent.edges,
    }),
    nodes: t.field({
      type: [TripSponsorType],
      resolve: (parent: { nodes: TripSponsorDTO[] }) => parent.nodes,
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
});

/**
 * Helper to encode sponsor cursor
 */
function encodeSponsorCursor(sponsor: SponsorDTO): string {
  return encodeCursor({
    id: sponsor.id,
    createdAt: sponsor.createdAt.toISOString(),
  });
}

/**
 * Helper to encode trip sponsor cursor
 */
function encodeTripSponsorCursor(tripSponsor: TripSponsorDTO): string {
  return encodeCursor({
    id: tripSponsor.id,
    createdAt: tripSponsor.linkedAt.toISOString(),
  });
}

/**
 * Helper to build sponsor connection response
 */
function buildSponsorConnection(
  items: SponsorDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: SponsorDTO; cursor: string }>;
  nodes: SponsorDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeSponsorCursor(item),
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
 * Helper to build trip sponsor connection response
 */
function buildTripSponsorConnection(
  items: TripSponsorDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: TripSponsorDTO; cursor: string }>;
  nodes: TripSponsorDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeTripSponsorCursor(item),
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
 * Sponsor Queries
 */
builder.queryFields((t) => ({
  /**
   * Find all active sponsors with cursor-based pagination
   */
  sponsors: t.field({
    type: SponsorConnectionType,
    args: {
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          sponsorController: {
            getActiveConnection: (input: {
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: SponsorDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.sponsorController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getActiveConnection({
        first,
        after: afterCursor,
      });

      return buildSponsorConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Find sponsors for a trip with cursor-based pagination
   */
  sponsorsByTrip: t.field({
    type: TripSponsorConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch sponsors for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        tripId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          sponsorController: {
            getByTripIdConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: TripSponsorDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.sponsorController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTripIdConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildTripSponsorConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));

/**
 * Export sponsor types for use in other modules
 */
export {
  SponsorType,
  TripSponsorType,
  SponsorConnectionType,
  TripSponsorConnectionType,
  SponsorEdgeType,
  TripSponsorEdgeType,
};
