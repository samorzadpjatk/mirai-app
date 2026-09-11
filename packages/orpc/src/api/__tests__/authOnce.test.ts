import { describe, expect, it, vi } from "vitest";
import { resolveAuthOnce } from "../authOnce";

const ctx = (accessToken: string | null = "token-a") =>
  ({ db: {}, supabase: {}, accessToken }) as unknown as Parameters<typeof resolveAuthOnce>[0];

const authResult = { user: { id: "u1" }, dbUser: { id: "u1" } } as never;

describe("resolveAuthOnce", () => {
  it("authenticates once for all procedures sharing a request", async () => {
    const loadAuth = vi.fn(async () => authResult);
    const context = ctx();

    const results = await Promise.all([
      resolveAuthOnce(context, loadAuth),
      resolveAuthOnce(context, loadAuth),
      resolveAuthOnce(context, loadAuth),
    ]);

    expect(loadAuth).toHaveBeenCalledTimes(1);
    expect(results).toEqual([authResult, authResult, authResult]);
  });

  it("authenticates again for a different request", async () => {
    const loadAuth = vi.fn(async () => authResult);

    await resolveAuthOnce(ctx(), loadAuth);
    await resolveAuthOnce(ctx(), loadAuth);

    expect(loadAuth).toHaveBeenCalledTimes(2);
  });

  it("re-authenticates when the same context carries a different token", async () => {
    const loadAuth = vi.fn(async () => authResult);
    const context = ctx("token-a");

    await resolveAuthOnce(context, loadAuth);
    (context as { accessToken: string | null }).accessToken = "token-b";
    await resolveAuthOnce(context, loadAuth);

    expect(loadAuth).toHaveBeenCalledTimes(2);
  });

  it("shares one failure across the request instead of retrying per procedure", async () => {
    const boom = new Error("Unauthorized");
    const loadAuth = vi.fn(async () => {
      throw boom;
    });
    const context = ctx();

    await expect(resolveAuthOnce(context, loadAuth)).rejects.toBe(boom);
    await expect(resolveAuthOnce(context, loadAuth)).rejects.toBe(boom);

    expect(loadAuth).toHaveBeenCalledTimes(1);
  });

  it("treats a missing token as its own cache key", async () => {
    const loadAuth = vi.fn(async () => authResult);
    const context = ctx(null);

    await resolveAuthOnce(context, loadAuth);
    await resolveAuthOnce(context, loadAuth);

    expect(loadAuth).toHaveBeenCalledTimes(1);
  });
});
