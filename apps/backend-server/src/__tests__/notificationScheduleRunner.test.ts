import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createDbMock = vi.hoisted(() => vi.fn(() => ({ tag: "db" })));
const runDueNotificationSchedulesMock = vi.hoisted(() =>
  vi.fn(async () => ({ evaluated: 0, due: 0, fired: 0, skipped: 0, failed: 0 })),
);
const loggerMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("@mirai-app/db", () => ({
  createDb: createDbMock,
}));

vi.mock("@mirai-app/orpc", () => ({
  logger: loggerMock,
  runDueNotificationSchedules: runDueNotificationSchedulesMock,
}));

const { initNotificationScheduleRunner, readNotificationScheduleRunnerConfig } = await import(
  "../notificationScheduleRunner"
);

describe("readNotificationScheduleRunnerConfig", () => {
  it("uses the shared defaults when nothing is configured", () => {
    expect(readNotificationScheduleRunnerConfig({})).toEqual({
      intervalMinutes: 5,
      graceMinutes: 15,
      enabled: true,
    });
  });

  it("reads overrides from the environment", () => {
    expect(
      readNotificationScheduleRunnerConfig({
        NOTIFICATION_SCHEDULER_INTERVAL_MINUTES: "2",
        NOTIFICATION_SCHEDULER_GRACE_MINUTES: "30",
      }),
    ).toMatchObject({ intervalMinutes: 2, graceMinutes: 30 });
  });

  it("falls back to the defaults for values that are not usable intervals", () => {
    expect(
      readNotificationScheduleRunnerConfig({
        NOTIFICATION_SCHEDULER_INTERVAL_MINUTES: "not-a-number",
        NOTIFICATION_SCHEDULER_GRACE_MINUTES: "0",
      }),
    ).toMatchObject({ intervalMinutes: 5, graceMinutes: 15 });
  });

  it("can be turned off explicitly", () => {
    expect(
      readNotificationScheduleRunnerConfig({ NOTIFICATION_SCHEDULER_ENABLED: "false" }).enabled,
    ).toBe(false);
  });
});

describe("initNotificationScheduleRunner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const config = { intervalMinutes: 5, graceMinutes: 15, enabled: true };

  it("returns null and starts nothing when disabled", () => {
    const scheduler = initNotificationScheduleRunner({
      databaseUrl: "postgresql://localhost/test",
      config: { ...config, enabled: false },
    });

    expect(scheduler).toBeNull();
    expect(createDbMock).not.toHaveBeenCalled();
  });

  it("returns null when there is no database URL", () => {
    const scheduler = initNotificationScheduleRunner({ databaseUrl: undefined, config });

    expect(scheduler).toBeNull();
    expect(loggerMock.warn).toHaveBeenCalled();
  });

  it("runs the executor immediately and then on the interval", async () => {
    const db = { tag: "db" } as never;
    const scheduler = initNotificationScheduleRunner({ db, config });

    expect(scheduler?.isActive()).toBe(true);

    await vi.advanceTimersByTimeAsync(0);
    expect(runDueNotificationSchedulesMock).toHaveBeenCalledTimes(1);
    expect(runDueNotificationSchedulesMock).toHaveBeenCalledWith({ db, graceMinutes: 15 });

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(runDueNotificationSchedulesMock).toHaveBeenCalledTimes(2);

    scheduler?.stop();
  });

  it("keeps ticking after a failed run", async () => {
    runDueNotificationSchedulesMock.mockRejectedValueOnce(new Error("database down"));
    const scheduler = initNotificationScheduleRunner({ db: {} as never, config });

    await vi.advanceTimersByTimeAsync(0);
    expect(loggerMock.error).toHaveBeenCalled();
    expect(scheduler?.isActive()).toBe(true);

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(runDueNotificationSchedulesMock).toHaveBeenCalledTimes(2);

    scheduler?.stop();
  });

  it("builds the database connection from the URL when no db is injected", () => {
    const scheduler = initNotificationScheduleRunner({
      databaseUrl: "postgresql://localhost/test",
      config,
    });

    expect(createDbMock).toHaveBeenCalledWith("postgresql://localhost/test");
    scheduler?.stop();
  });
});
