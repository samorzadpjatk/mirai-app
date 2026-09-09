import { REALTIME_CHANNEL_STATES } from "@mirai-app/supabase";

/**
 * Supabase Realtime listens on the physical Postgres table, so it has to use the
 * Drizzle table (`locations`) with its snake_case column names. The legacy Prisma
 * table ("Location") was dropped by
 * `20260617000000_drop_legacy_prisma_tables.sql`, which is why a subscription
 * bound to it never produced a single event.
 */
export const LOCATION_REALTIME_TABLE = "locations";

/** Physical column backing `locations.userId`. */
const LOCATION_REALTIME_USER_COLUMN = "user_id";

/** How long we wait for the websocket join handshake before giving up. */
const CHANNEL_SUBSCRIBE_TIMEOUT_MS = 10_000;

const SUBSCRIBE_STATUS_SUBSCRIBED = "SUBSCRIBED";
const SUBSCRIBE_FAILURE_STATUSES = new Set(["TIMED_OUT", "CLOSED", "CHANNEL_ERROR"]);

/**
 * Channel states in which no further postgres_changes payload can arrive, so the
 * generator may stop looping and clean up.
 */
const TERMINAL_CHANNEL_STATES = new Set<string>([
  REALTIME_CHANNEL_STATES.closed,
  REALTIME_CHANNEL_STATES.errored,
  REALTIME_CHANNEL_STATES.leaving,
]);

/**
 * Build the Realtime row filter for the friends whose locations may be streamed.
 * Uses the physical column name because the filter is evaluated by Postgres.
 */
export function buildFriendLocationFilter(friendIds: string[]): string {
  return `${LOCATION_REALTIME_USER_COLUMN}=in.(${friendIds.join(",")})`;
}

function readUserId(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const value = (row as { user_id?: unknown }).user_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Realtime payloads carry raw Postgres rows (snake_case), not Drizzle rows, so
 * the owning user has to be read from `user_id`.
 */
export function extractRealtimeUserId(payload: {
  eventType: string;
  new?: unknown;
  old?: unknown;
}): string | null {
  return payload.eventType === "DELETE" ? readUserId(payload.old) : readUserId(payload.new);
}

/**
 * `channel.subscribe()` only moves the channel to "joining" — the join itself is
 * an async websocket handshake. Anything that requires "joined" on its first
 * synchronous evaluation is therefore always false, so the loop guard only stops
 * once the channel is genuinely gone.
 */
export function shouldKeepStreaming(
  channel: { state?: string | null } | null | undefined,
): boolean {
  if (!channel?.state) return false;
  return !TERMINAL_CHANNEL_STATES.has(channel.state);
}

export interface ChannelSubscriptionGate {
  /** Feed every status reported by `channel.subscribe(...)` into the gate. */
  onStatus: (status: string) => void;
  /** Resolves true once SUBSCRIBED arrives, false on failure or timeout. */
  wait: () => Promise<boolean>;
}

/**
 * Awaitable gate around the `subscribe((status) => ...)` callback. Replaces the
 * blind one-second sleep that used to paper over the same race.
 */
export function createChannelSubscriptionGate(
  timeoutMs: number = CHANNEL_SUBSCRIBE_TIMEOUT_MS,
): ChannelSubscriptionGate {
  let settle: (subscribed: boolean) => void = () => undefined;
  const settled = new Promise<boolean>((resolve) => {
    settle = resolve;
  });
  const timer = setTimeout(() => settle(false), timeoutMs);

  return {
    onStatus(status: string) {
      if (status === SUBSCRIBE_STATUS_SUBSCRIBED) {
        settle(true);
        return;
      }
      if (SUBSCRIBE_FAILURE_STATUSES.has(status)) {
        settle(false);
      }
    },
    async wait() {
      const subscribed = await settled;
      clearTimeout(timer);
      return subscribed;
    },
  };
}
