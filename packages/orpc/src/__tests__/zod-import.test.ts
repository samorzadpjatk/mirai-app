import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("zod import", () => {
  it("should have z.object defined", () => {
    expect(typeof z.object).toBe("function");
  });
});
