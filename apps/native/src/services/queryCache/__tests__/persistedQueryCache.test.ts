import { QueryClient } from "@tanstack/react-query";
import {
  type KeyValueStorage,
  PERSISTED_QUERY_CACHE_KEY,
  PERSISTED_QUERY_GC_TIME_MS,
  createPersistedQueryCacheController,
} from "../persistedQueryCache";

const THROTTLE_MS = 5;

const createMemoryStorage = () => {
  const items = new Map<string, string>();
  const storage: KeyValueStorage = {
    getItem: async (key) => items.get(key) ?? null,
    setItem: async (key, value) => {
      items.set(key, value);
    },
    removeItem: async (key) => {
      items.delete(key);
    },
  };
  return { items, storage };
};

const flush = async (ms = THROTTLE_MS * 6) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const FEED_KEY = ["community-feed", "trip-1", 30];
const LOCATION_KEY = [["location", "getFriendsLocations"], { type: "query" }];

const feedData = (title: string) => ({
  pages: [{ activities: [{ id: "a1", title, createdAt: new Date("2026-11-01T10:00:00Z") }] }],
  pageParams: [null],
});

/** Signs `userId` in on a fresh app launch and returns the restored client. */
const launchAs = async (storage: KeyValueStorage, userId: string | null) => {
  const queryClient = new QueryClient();
  const controller = createPersistedQueryCacheController({
    queryClient,
    storage,
    throttleTime: THROTTLE_MS,
  });
  controller.setUser(userId);
  await flush();
  return { queryClient, controller };
};

describe("createPersistedQueryCacheController", () => {
  it("should show the previous session's feed on the next launch, Dates intact", async () => {
    const { storage } = createMemoryStorage();
    const first = await launchAs(storage, "user-a");
    first.queryClient.setQueryData(FEED_KEY, feedData("Sunset at the pier"));
    await flush();

    const second = await launchAs(storage, "user-a");

    const restored = second.queryClient.getQueryData<ReturnType<typeof feedData>>(FEED_KEY);
    expect(restored?.pages[0]?.activities[0]?.title).toBe("Sunset at the pier");
    expect(restored?.pages[0]?.activities[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("should not write queries outside the allowlist to disk", async () => {
    const { storage, items } = createMemoryStorage();
    const first = await launchAs(storage, "user-a");
    first.queryClient.setQueryData(FEED_KEY, feedData("x"));
    first.queryClient.setQueryData(LOCATION_KEY, [{ userId: "u2", lat: 52.2, lng: 21 }]);
    await flush();

    const snapshot = items.get(PERSISTED_QUERY_CACHE_KEY) ?? "";
    expect(snapshot).toContain("community-feed");
    expect(snapshot).not.toContain("getFriendsLocations");
  });

  it("should never show one user's cache to another", async () => {
    const { storage } = createMemoryStorage();
    const first = await launchAs(storage, "user-a");
    first.queryClient.setQueryData(FEED_KEY, feedData("A's private trip"));
    await flush();

    const second = await launchAs(storage, "user-b");

    expect(second.queryClient.getQueryData(FEED_KEY)).toBeUndefined();
  });

  it("should wipe memory and disk on sign-out", async () => {
    const { storage, items } = createMemoryStorage();
    const { queryClient, controller } = await launchAs(storage, "user-a");
    queryClient.setQueryData(FEED_KEY, feedData("x"));
    await flush();
    expect(items.has(PERSISTED_QUERY_CACHE_KEY)).toBe(true);

    controller.setUser(null);
    await flush();

    expect(queryClient.getQueryData(FEED_KEY)).toBeUndefined();
    expect(items.has(PERSISTED_QUERY_CACHE_KEY)).toBe(false);
  });

  // The persister throttles writes and cannot cancel one already scheduled; it must
  // not resurrect the snapshot after sign-out removed it.
  it("should drop a write that was scheduled before sign-out", async () => {
    const { storage, items } = createMemoryStorage();
    const queryClient = new QueryClient();
    const controller = createPersistedQueryCacheController({
      queryClient,
      storage,
      throttleTime: 50,
    });
    controller.setUser("user-a");
    await flush(10);

    queryClient.setQueryData(FEED_KEY, feedData("first"));
    queryClient.setQueryData(FEED_KEY, feedData("second")); // lands in the throttle window
    controller.setUser(null);
    await flush(150);

    expect(items.has(PERSISTED_QUERY_CACHE_KEY)).toBe(false);
  });

  it("should do nothing when the same user is set again", async () => {
    const { storage } = createMemoryStorage();
    const { queryClient, controller } = await launchAs(storage, "user-a");
    queryClient.setQueryData(FEED_KEY, feedData("kept"));

    controller.setUser("user-a");

    expect(queryClient.getQueryData(FEED_KEY)).toBeDefined();
  });

  it("should keep persisted roots in memory long enough to stay on disk", async () => {
    const { queryClient } = await launchAs(createMemoryStorage().storage, "user-a");

    expect(queryClient.getQueryDefaults(FEED_KEY).gcTime).toBe(PERSISTED_QUERY_GC_TIME_MS);
    expect(
      queryClient.getQueryDefaults([["home", "getHomeFull"], { type: "infinite" }]).gcTime,
    ).toBe(PERSISTED_QUERY_GC_TIME_MS);
    expect(queryClient.getQueryDefaults(LOCATION_KEY).gcTime).toBeUndefined();
  });
});
