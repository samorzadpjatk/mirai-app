import { locationShares, locations, users } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createMockSupabase } from "../../../../test-helpers";
import type { LocationContext } from "../queries";
import { getFriendsLocationsStream } from "../queries";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

type RealtimeHandler = (payload: {
  eventType: string;
  new?: unknown;
  old?: unknown;
}) => void;

type SubscribeArgs = { table?: string; filter?: string };

/**
 * Fake Supabase Realtime channel that reproduces the real join handshake:
 * `subscribe()` only moves the channel to "joining" and the SUBSCRIBED status
 * arrives on a later tick. Anything that requires "joined" synchronously right
 * after `subscribe()` sees "joining" and bails out.
 */
function createFakeRealtime() {
  let handler: RealtimeHandler | null = null;
  let subscribeArgs: SubscribeArgs = {};
  let subscribed = false;

  const channel = {
    state: "closed" as string,
    on(_event: string, args: SubscribeArgs, cb: RealtimeHandler) {
      subscribeArgs = args;
      handler = cb;
      return channel;
    },
    subscribe(cb: (status: string, err?: Error) => void) {
      channel.state = "joining";
      setTimeout(() => {
        channel.state = "joined";
        subscribed = true;
        cb("SUBSCRIBED");
      }, 0);
      return channel;
    },
  };

  const removeChannel = vi.fn(async () => "ok");

  return {
    channel,
    removeChannel,
    get subscribeArgs() {
      return subscribeArgs;
    },
    get isSubscribed() {
      return subscribed;
    },
    get hasHandler() {
      return handler !== null;
    },
    emit(payload: { eventType: string; new?: unknown; old?: unknown }) {
      handler?.(payload);
    },
    close() {
      channel.state = "closed";
    },
  };
}

function createStreamContext(realtime: ReturnType<typeof createFakeRealtime>): LocationContext {
  const base = createMockSupabase();
  const supabase = {
    ...base,
    channel: () => realtime.channel,
    removeChannel: realtime.removeChannel,
  } as unknown as SupabaseClient;

  return {
    db: testDb.db,
    supabase,
    dbUser: { id: "viewer-1" },
  };
}

async function waitUntil(predicate: () => boolean, timeoutMs = 5000) {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("waitUntil timed out");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

async function seedUser(id: string) {
  await testDb.db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName: "Test",
    lastName: id,
    hasAvatar: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedSharedLocation(locationId: string, ownerId: string, viewerId: string) {
  await testDb.db.insert(locations).values({
    id: locationId,
    userId: ownerId,
    timestamp: new Date("2026-01-01T00:00:00.000Z"),
    isSharingLocation: true,
    latitude: 52.2297,
    longitude: 21.0122,
    accuracy: 0,
  });
  await testDb.db.insert(locationShares).values({ locationId, userId: viewerId });
}

describe("getFriendsLocationsStream (PGLite + fake realtime)", () => {
  it("stays open past the initial snapshot and forwards realtime updates", async () => {
    await seedUser("viewer-1");
    await seedUser("friend-1");
    await seedSharedLocation("loc-1", "friend-1", "viewer-1");

    const realtime = createFakeRealtime();
    const context = createStreamContext(realtime);
    const iterator = getFriendsLocationsStream(context, { connectionId: "conn-1" });

    const snapshot = await iterator.next();
    expect(snapshot.done).toBe(false);
    expect(snapshot.value).toMatchObject({
      type: "upsert",
      location: { user: { id: "friend-1" } },
    });

    // Resume: the generator now wires up the channel and must wait for the join
    // handshake instead of returning immediately.
    const pending = iterator.next();
    await waitUntil(() => realtime.isSubscribed && realtime.hasHandler);

    await testDb.db
      .update(locations)
      .set({ latitude: 10.5, longitude: 20.25, timestamp: new Date("2026-01-02T00:00:00.000Z") })
      .where(eq(locations.userId, "friend-1"));

    realtime.emit({ eventType: "UPDATE", new: { user_id: "friend-1" } });

    const update = await pending;
    expect(update.done).toBe(false);
    expect(update.value).toMatchObject({
      type: "upsert",
      location: { coords: { latitude: 10.5, longitude: 20.25 } },
    });

    realtime.close();
    const end = await iterator.next();
    expect(end.done).toBe(true);
    expect(realtime.removeChannel).toHaveBeenCalledWith(realtime.channel);
  });

  it("subscribes to the drizzle table and filters on user_id", async () => {
    await seedUser("viewer-1");
    await seedUser("friend-1");
    await seedSharedLocation("loc-1", "friend-1", "viewer-1");

    const realtime = createFakeRealtime();
    const context = createStreamContext(realtime);
    const iterator = getFriendsLocationsStream(context, { connectionId: "conn-1" });

    await iterator.next();
    const pending = iterator.next();
    await waitUntil(() => realtime.isSubscribed);

    expect(realtime.subscribeArgs.table).toBe("locations");
    expect(realtime.subscribeArgs.filter).toBe("user_id=in.(friend-1)");

    realtime.close();
    await pending;
    await iterator.return?.(undefined);
  });

  it("emits a delete event when a friend row is removed", async () => {
    await seedUser("viewer-1");
    await seedUser("friend-1");
    await seedSharedLocation("loc-1", "friend-1", "viewer-1");

    const realtime = createFakeRealtime();
    const context = createStreamContext(realtime);
    const iterator = getFriendsLocationsStream(context, { connectionId: "conn-1" });

    await iterator.next();
    const pending = iterator.next();
    await waitUntil(() => realtime.isSubscribed && realtime.hasHandler);

    realtime.emit({ eventType: "DELETE", old: { user_id: "friend-1" }, new: {} });

    const deletion = await pending;
    expect(deletion.value).toMatchObject({ type: "delete", userId: "friend-1" });

    realtime.close();
    await iterator.next();
  });

  it("emits a delete when a friend stops sharing their location", async () => {
    await seedUser("viewer-1");
    await seedUser("friend-1");
    await seedSharedLocation("loc-1", "friend-1", "viewer-1");

    const realtime = createFakeRealtime();
    const context = createStreamContext(realtime);
    const iterator = getFriendsLocationsStream(context, { connectionId: "conn-1" });

    await iterator.next();
    const pending = iterator.next();
    await waitUntil(() => realtime.isSubscribed && realtime.hasHandler);

    await testDb.db
      .update(locations)
      .set({ isSharingLocation: false })
      .where(eq(locations.userId, "friend-1"));
    realtime.emit({ eventType: "UPDATE", new: { user_id: "friend-1" } });

    const event = await pending;
    expect(event.value).toMatchObject({ type: "delete", userId: "friend-1" });

    realtime.close();
    await iterator.next();
  });

  it("ignores realtime rows for users outside the sharing allow-list", async () => {
    await seedUser("viewer-1");
    await seedUser("friend-1");
    await seedUser("stranger-1");
    await seedSharedLocation("loc-1", "friend-1", "viewer-1");
    await testDb.db.insert(locations).values({
      id: "loc-2",
      userId: "stranger-1",
      timestamp: new Date(),
      isSharingLocation: true,
      latitude: 1,
      longitude: 2,
      accuracy: 0,
    });

    const realtime = createFakeRealtime();
    const context = createStreamContext(realtime);
    const iterator = getFriendsLocationsStream(context, { connectionId: "conn-1" });

    await iterator.next();
    const pending = iterator.next();
    await waitUntil(() => realtime.isSubscribed && realtime.hasHandler);

    realtime.emit({ eventType: "UPDATE", new: { user_id: "stranger-1" } });
    realtime.emit({ eventType: "UPDATE", new: { user_id: "friend-1" } });

    const event = await pending;
    expect(event.value).toMatchObject({
      type: "upsert",
      location: { user: { id: "friend-1" } },
    });

    realtime.close();
    await iterator.next();
  });

  it("closes cleanly when the viewer has no friends sharing with them", async () => {
    await seedUser("viewer-1");

    const realtime = createFakeRealtime();
    const context = createStreamContext(realtime);
    const iterator = getFriendsLocationsStream(context, { connectionId: "conn-1" });

    const first = await iterator.next();
    expect(first.done).toBe(true);
  });
});
