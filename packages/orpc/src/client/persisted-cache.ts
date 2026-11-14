import { StandardRPCJsonSerializer } from "@orpc/client/standard";
import type { DehydratedState, Query, QueryKey } from "@tanstack/react-query";

/**
 * Helpers for keeping the query cache on the device between launches.
 *
 * oRPC hands queries real `Date`s (and other non-JSON values), and `JSON.stringify`
 * would turn them into strings that come back as strings: a restored trip whose
 * `startDate.getTime()` throws. Running the snapshot through oRPC's own JSON
 * serializer round-trips those types exactly as the network layer does.
 */

const serializer = new StandardRPCJsonSerializer();

interface PersistedSnapshot {
  clientState: DehydratedState;
}

interface SerializedPayload {
  json: unknown;
  meta: unknown;
  maps: unknown;
}

interface InfiniteDataLike {
  pages: unknown[];
  pageParams: unknown[];
}

function isInfiniteData(value: unknown): value is InfiniteDataLike {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as InfiniteDataLike).pages) &&
    Array.isArray((value as InfiniteDataLike).pageParams)
  );
}

/**
 * Keep only the first page of every infinite query. That is the page a screen shows
 * on launch; restoring ten scrolled feed pages would make every write (and the
 * refetch after restore, which reloads each page) ten times bigger for content
 * nobody is looking at.
 */
export function trimInfiniteQueryPages<T extends PersistedSnapshot>(snapshot: T): T {
  return {
    ...snapshot,
    clientState: {
      ...snapshot.clientState,
      queries: snapshot.clientState.queries.map((query) => {
        const data: unknown = query.state.data;
        if (!isInfiniteData(data) || data.pages.length <= 1) {
          return query;
        }
        return {
          ...query,
          state: {
            ...query.state,
            data: { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) },
          },
        };
      }),
    },
  };
}

export function serializePersistedCache<T extends PersistedSnapshot>(snapshot: T): string {
  const [json, meta, maps] = serializer.serialize(trimInfiniteQueryPages(snapshot));
  const payload: SerializedPayload = { json, meta, maps };
  return JSON.stringify(payload);
}

export function deserializePersistedCache<T>(text: string): T {
  const payload = JSON.parse(text) as SerializedPayload;
  return serializer.deserialize(
    payload.json as never,
    payload.meta as never,
    payload.maps as never,
    () => {
      throw new Error("Persisted query cache unexpectedly references a Blob");
    },
  ) as T;
}

/** A root is a plain key (`"community-feed"`) or an oRPC procedure path. */
export type PersistedQueryRoot = string | readonly string[];

function matchesRoot(head: unknown, root: PersistedQueryRoot): boolean {
  if (typeof root === "string") {
    return head === root;
  }
  return (
    Array.isArray(head) &&
    head.length === root.length &&
    root.every((segment, index) => head[index] === segment)
  );
}

/**
 * Build the predicate deciding which queries are written to disk. Only successful
 * queries under an allowed root are kept: anything else (live locations, admin
 * screens) is neither needed for the first frame nor worth leaving on the device.
 */
export function createPersistedQueryFilter(
  roots: readonly PersistedQueryRoot[],
): (query: Pick<Query, "queryKey" | "state">) => boolean {
  return (query) => {
    if (query.state.status !== "success") {
      return false;
    }
    const head: unknown = (query.queryKey as QueryKey)[0];
    return roots.some((root) => matchesRoot(head, root));
  };
}
