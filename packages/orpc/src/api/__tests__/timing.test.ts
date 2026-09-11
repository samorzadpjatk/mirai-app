import { describe, expect, it, vi } from "vitest";
import { createTimingInterceptor } from "../timing";

const collectingLogger = () => {
  const lines: Record<string, unknown>[] = [];
  return {
    logger: { info: (obj: Record<string, unknown>, msg: string) => lines.push({ ...obj, msg }) },
    lines,
  };
};

describe("createTimingInterceptor", () => {
  it("reports how long a procedure took, named by its path", async () => {
    const { logger, lines } = collectingLogger();
    let now = 1000;
    const interceptor = createTimingInterceptor({ logger, clock: () => now });

    await interceptor({
      path: ["community", "getCommunityFull"],
      next: async () => {
        now += 2500;
        return "result";
      },
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      procedure: "community.getCommunityFull",
      elapsedMs: 2500,
      msg: "RPC procedure",
    });
  });

  it("passes the handler result through untouched", async () => {
    const { logger } = collectingLogger();
    const interceptor = createTimingInterceptor({ logger, clock: () => 0 });

    const result = await interceptor({ path: ["user", "getMy"], next: async () => ({ id: "u1" }) });

    expect(result).toEqual({ id: "u1" });
  });

  it("still reports the duration when the procedure throws", async () => {
    const { logger, lines } = collectingLogger();
    let now = 0;
    const interceptor = createTimingInterceptor({ logger, clock: () => now });
    const boom = new Error("boom");

    await expect(
      interceptor({
        path: ["home", "getHomeFull"],
        next: async () => {
          now += 700;
          throw boom;
        },
      }),
    ).rejects.toBe(boom);

    expect(lines[0]).toMatchObject({
      procedure: "home.getHomeFull",
      elapsedMs: 700,
      failed: true,
    });
  });

  it("does not crash on an empty path", async () => {
    const { logger, lines } = collectingLogger();
    const interceptor = createTimingInterceptor({ logger, clock: () => 0 });

    await interceptor({ path: [], next: async () => null });

    expect(lines[0]).toMatchObject({ procedure: "<unknown>" });
  });
});
