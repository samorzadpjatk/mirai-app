import type { ChallengeStatus, ScoringCategory } from "@mirai-app/domain";
import type {
  ChallengeGateway,
  ChallengeDTO,
  ChallengeConnectionArgs,
} from "@mirai-app/use-cases";
import {
  DatabaseError,
  type Connection,
  type Edge,
  type PageInfo,
} from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Challenge Gateway for Testing
 *
 * Implements ChallengeGateway port with in-memory storage.
 * Uses ChallengeDTOs instead of domain entities.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryChallengeGateway();
 * gateway.seed([mockChallengeDTO]);
 *
 * const connection = await Effect.runPromise(
 *   gateway.findByTripIdConnection("trip-123", { first: 10 })
 * );
 * expect(connection.nodes).toHaveLength(1);
 *
 * gateway.reset();
 * ```
 */
export class InMemoryChallengeGateway
  extends InMemoryGateway<ChallengeDTO>
  implements ChallengeGateway
{
  create(dto: ChallengeDTO): Effect.Effect<ChallengeDTO, DatabaseError, never> {
    return this.createGeneric(dto);
  }

  findById(
    id: string,
  ): Effect.Effect<ChallengeDTO | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findByTripIdConnection(
    tripId: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const allItems = this.getAllItems().filter((c) => c.tripId === tripId);
      return this.buildConnectionResult(allItems, args);
    });
  }

  findByStatusConnection(
    status: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const allItems = this.getAllItems().filter((c) => c.status === status);
      return this.buildConnectionResult(allItems, args);
    });
  }

  findByTripIdAndStatusConnection(
    tripId: string,
    status: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const allItems = this.getAllItems().filter(
        (c) => c.tripId === tripId && c.status === status,
      );
      return this.buildConnectionResult(allItems, args);
    });
  }

  findBySubmissionTypeConnection(
    _type: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    // Note: ChallengeDTO doesn't have submissionType field
    // Return empty connection
    return Effect.sync(() => this.buildConnectionResult([], args));
  }

  findByScoringCategoryConnection(
    category: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const allItems = this.getAllItems().filter(
        (c) => c.scoringCategory === category,
      );
      return this.buildConnectionResult(allItems, args);
    });
  }

  findActiveConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const allItems = this.getAllItems().filter((c) => c.status === "ACTIVE");
      return this.buildConnectionResult(allItems, args);
    });
  }

  findOpenForSubmissionConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const now = new Date();
      const allItems = this.getAllItems().filter((c) => {
        if (c.status !== "ACTIVE") return false;
        if (c.startDate && c.startDate > now) return false;
        if (c.endDate && c.endDate < now) return false;
        return true;
      });
      return this.buildConnectionResult(allItems, args);
    });
  }

  findRecurringConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    // Note: ChallengeDTO doesn't have isRecurring field
    // Return empty connection
    return Effect.sync(() => this.buildConnectionResult([], args));
  }

  findAllConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const allItems = this.getAllItems();
      return this.buildConnectionResult(allItems, args);
    });
  }

  update(dto: ChallengeDTO): Effect.Effect<ChallengeDTO, DatabaseError, never> {
    return this.updateGeneric(dto);
  }

  updateStatus(
    id: string,
    status: string,
  ): Effect.Effect<ChallengeDTO, DatabaseError, never> {
    const dto = this.storage.get(id);
    if (!dto) {
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: `Challenge with id ${id} not found`,
        }),
      );
    }
    const updated: ChallengeDTO = {
      ...dto,
      status: status as ChallengeStatus,
      updatedAt: new Date(),
    };
    return this.updateGeneric(updated);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id);
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.existsGeneric(id);
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.tripId === tripId).length,
    );
  }

  /**
   * Helper to build a Connection result from items and pagination args
   */
  private buildConnectionResult(
    allItems: ChallengeDTO[],
    args: ChallengeConnectionArgs,
  ): Connection<ChallengeDTO> {
    // Sort by createdAt desc, then id desc
    const sortedItems = [...allItems].sort((a, b) => {
      const dateDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id.localeCompare(a.id);
    });

    // Handle cursor if provided
    let startIndex = 0;
    if (args.after) {
      // Decode cursor if it's a string (base64 encoded), otherwise use as object
      let cursorId: string;
      let cursorCreatedAt: Date;

      if (typeof args.after === "string") {
        // Decode base64 cursor string
        const decoded = Buffer.from(args.after, "base64url").toString("utf-8");
        const cursorData = JSON.parse(decoded);
        cursorId = cursorData.id;
        cursorCreatedAt = new Date(cursorData.createdAt);
      } else {
        // Use object format directly
        cursorId = args.after.id;
        cursorCreatedAt = new Date(args.after.createdAt);
      }

      // Find position after cursor
      const cursorIndex = sortedItems.findIndex(
        (item) =>
          item.id === cursorId &&
          item.createdAt.getTime() === cursorCreatedAt.getTime(),
      );
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    // Get limit
    const limit = this.getPaginationLimit(args.first);

    // Get page items - take limit + 1 to detect hasNextPage
    const itemsWithExtra = sortedItems.slice(
      startIndex,
      startIndex + limit + 1,
    );
    const hasMore = itemsWithExtra.length > limit;
    const items = itemsWithExtra.slice(0, limit);

    // Build edges with base64-encoded cursor strings
    const edges: Edge<ChallengeDTO>[] = items.map((item) => ({
      node: item,
      cursor: this.encodeCursor(item.id, item.createdAt),
    }));

    // Build pageInfo
    const pageInfo: PageInfo = {
      hasNextPage: hasMore,
      hasPreviousPage: startIndex > 0,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    };

    return {
      edges,
      nodes: items,
      pageInfo,
    };
  }

  /**
   * Encode cursor from id and createdAt to base64 string
   */
  private encodeCursor(id: string, createdAt: Date): string {
    const data = { id, createdAt: createdAt.toISOString() };
    return Buffer.from(JSON.stringify(data)).toString("base64url");
  }

  /**
   * Get pagination limit with defaults and max
   */
  private getPaginationLimit(first?: number | null): number {
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 20;
    if (first === undefined || first === null) return DEFAULT_LIMIT;
    return Math.min(Math.max(1, first), MAX_LIMIT);
  }
}
