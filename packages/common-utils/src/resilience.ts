const getNumericEnvOrDefault = (
  value: string | undefined,
  fallback: number,
): number => {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const defaultMaxRetriesCount = getNumericEnvOrDefault(
  process.env.DEFAULT_MAX_RETRIES_COUNT,
  5,
);
const defaultDelayInMs = getNumericEnvOrDefault(
  process.env.DEFAULT_DELAY_MS,
  1000,
);
const getJitteredDelay = (delay: number) => delay * (0.5 + Math.random());

export async function executeWithRetry<T>(
  toExecute: () => Promise<T>,
  onError?: (err: unknown, retryAttempt: number) => void | Promise<void>,
  isValidResult?: (result: T) => boolean,
  maxRetriesCount?: number,
  delayInMs?: number,
): Promise<T> {
  maxRetriesCount ??= defaultMaxRetriesCount;
  delayInMs ??= defaultDelayInMs;

  const handleDelay = async (retryAttempt: number) => {
    const delay = getJitteredDelay(delayInMs * Math.pow(2, retryAttempt));
    await new Promise((result) => setTimeout(result, delay));
  };

  for (let retryAttempt = 0; retryAttempt < maxRetriesCount; retryAttempt++) {
    try {
      const result = await toExecute();
      if (isValidResult && !isValidResult(result)) {
        await handleDelay(retryAttempt);
        continue;
      }

      return result;
    } catch (err: unknown) {
      await onError?.(err, retryAttempt);
      if (retryAttempt === maxRetriesCount - 1) {
        throw err;
      }

      await handleDelay(retryAttempt);
    }
  }

  throw new Error(
    `None of the ${maxRetriesCount} retry attempts provided a valid result.`,
  );
}
