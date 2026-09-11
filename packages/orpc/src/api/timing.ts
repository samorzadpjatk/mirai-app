/**
 * Per-procedure timing for oRPC calls.
 *
 * Nothing on the request path recorded how long a procedure took: Kong only sees
 * Supabase traffic, the reverse proxy lives on a host we cannot read, and
 * `pg_stat_statements` shows database time but not the work around it. A slow
 * screen was therefore impossible to attribute. This logs one line per procedure,
 * which also works inside a batched request, where several procedures share a
 * single HTTP round trip.
 */
interface TimingLogger {
  info: (obj: Record<string, unknown>, msg: string) => void;
}

export interface TimingInterceptorOptions {
  logger: TimingLogger;
  /** Injected so tests can advance time without sleeping. */
  clock?: () => number;
}

interface InterceptorArgs<TResult> {
  path: readonly string[];
  /**
   * oRPC hands middleware a `MiddlewareResult`, not a plain promise, so the
   * result type stays generic and is simply awaited and passed back.
   */
  next: () => TResult;
}

export const createTimingInterceptor = ({
  logger,
  clock = () => Date.now(),
}: TimingInterceptorOptions) => {
  return async <TResult>({ path, next }: InterceptorArgs<TResult>): Promise<Awaited<TResult>> => {
    const procedure = path.length > 0 ? path.join(".") : "<unknown>";
    const startedAt = clock();

    try {
      const result = await next();
      logger.info({ procedure, elapsedMs: clock() - startedAt }, "RPC procedure");
      return result;
    } catch (error) {
      logger.info({ procedure, elapsedMs: clock() - startedAt, failed: true }, "RPC procedure");
      throw error;
    }
  };
};
