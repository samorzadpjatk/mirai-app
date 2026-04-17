import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { IRealtimePort } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * Supabase Realtime Gateway
 *
 * Implements IRealtimePort using Supabase Realtime client for real-time operations.
 */
export class SupabaseRealtimeGateway implements IRealtimePort {
  constructor(private readonly supabase: SupabaseClient) {}

  subscribe(
    channel: string,
    callback: (payload: unknown) => void,
  ): Effect.Effect<{ unsubscribe: () => void }, ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const subscription = this.supabase
          .channel(channel)
          .on("broadcast", { event: "*" }, (payload) => callback(payload))
          .subscribe();

        return {
          unsubscribe: () => {
            subscription.unsubscribe();
          },
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseRealtimeGateway.subscribe",
          cause: error,
        }),
    });
  }

  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<void, ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const response = await this.supabase.channel(channel).send({
          type: "broadcast",
          event,
          payload,
        });
        if (response === "error" || response === "timed out") {
          throw new Error(`Broadcast failed: ${response}`);
        }
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseRealtimeGateway.broadcast",
          cause: error,
        }),
    });
  }
}
