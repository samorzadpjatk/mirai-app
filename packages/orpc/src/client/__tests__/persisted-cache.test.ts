import { QueryClient, dehydrate } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  createPersistedQueryFilter,
  deserializePersistedCache,
  serializePersistedCache,
  trimInfiniteQueryPages,
} from "../persisted-cache";

const snapshotOf = (client: QueryClient) => ({
  timestamp: 1,
  buster: "v1:user-1",
  clientState: dehydrate(client),
});

describe("serializePersistedCache / deserializePersistedCache", () => {
  // `JSON.stringify` would turn these into strings and a restored screen calling
  // `startDate.getTime()` would throw on launch.
  it("should round-trip Dates and other oRPC types exactly", () => {
    const client = new QueryClient();
    const startDate = new Date("2026-07-01T08:00:00.000Z");
    client.setQueryData([["home", "getHomeFull"], { type: "query" }], {
      trip: { id: "t1", startDate, tags: new Set(["a"]), budget: 12n },
    });

    const restored = deserializePersistedCache<ReturnType<typeof snapshotOf>>(
      serializePersistedCache(snapshotOf(client)),
    );

    const data = restored.clientState.queries[0]?.state.data as {
      trip: { startDate: Date; tags: Set<string>; budget: bigint };
    };
    expect(data.trip.startDate).toBeInstanceOf(Date);
    expect(data.trip.startDate.getTime()).toBe(startDate.getTime());
    expect(data.trip.tags).toEqual(new Set(["a"]));
    expect(data.trip.budget).toBe(12n);
    expect(restored.buster).toBe("v1:user-1");
  });

  it("should restore into a fresh client that renders the data", async () => {
    const source = new QueryClient();
    source.setQueryData(["community-feed", "trip-1", 30], {
      pages: [{ activities: [{ id: "a1", createdAt: new Date(0) }] }],
      pageParams: [null],
    });

    const restored = deserializePersistedCache<ReturnType<typeof snapshotOf>>(
      serializePersistedCache(snapshotOf(source)),
    );
    const target = new QueryClient();
    const { hydrate } = await import("@tanstack/react-query");
    hydrate(target, restored.clientState);

    const data = target.getQueryData<{ pages: { activities: { createdAt: Date }[] }[] }>([
      "community-feed",
      "trip-1",
      30,
    ]);
    expect(data?.pages[0]?.activities[0]?.createdAt).toBeInstanceOf(Date);
  });
});

describe("trimInfiniteQueryPages", () => {
  it("should keep only the first page of an infinite query", () => {
    const client = new QueryClient();
    client.setQueryData(["community-feed", "trip-1", 30], {
      pages: [{ n: 1 }, { n: 2 }, { n: 3 }],
      pageParams: [null, "c1", "c2"],
    });

    const trimmed = trimInfiniteQueryPages(snapshotOf(client));

    expect(trimmed.clientState.queries[0]?.state.data).toEqual({
      pages: [{ n: 1 }],
      pageParams: [null],
    });
  });

  it("should leave plain queries untouched", () => {
    const client = new QueryClient();
    client.setQueryData(["cached-image-url", "p", "default", "avatar"], { pages: "not-a-list" });

    const trimmed = trimInfiniteQueryPages(snapshotOf(client));

    expect(trimmed.clientState.queries[0]?.state.data).toEqual({ pages: "not-a-list" });
  });
});

describe("createPersistedQueryFilter", () => {
  const filter = createPersistedQueryFilter(["community-feed", ["home", "getHomeFull"]]);
  const success = { status: "success" } as never;

  it("should accept a plain root and an oRPC procedure path", () => {
    expect(filter({ queryKey: ["community-feed", "trip-1", 30], state: success })).toBe(true);
    expect(
      filter({ queryKey: [["home", "getHomeFull"], { type: "infinite" }], state: success }),
    ).toBe(true);
  });

  it("should reject anything outside the allowlist", () => {
    expect(
      filter({
        queryKey: [["location", "getFriendsLocations"], { type: "query" }],
        state: success,
      }),
    ).toBe(false);
    expect(filter({ queryKey: [["home"], {}], state: success })).toBe(false);
    expect(filter({ queryKey: [["home", "getHomeFull", "x"], {}], state: success })).toBe(false);
  });

  it("should reject queries that have not succeeded", () => {
    expect(
      filter({ queryKey: ["community-feed", "trip-1", 30], state: { status: "error" } as never }),
    ).toBe(false);
    expect(
      filter({ queryKey: ["community-feed", "trip-1", 30], state: { status: "pending" } as never }),
    ).toBe(false);
  });
});
