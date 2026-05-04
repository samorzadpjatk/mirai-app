import { describe, it, expect, vi } from "vitest";
import { createSupabaseClient } from "../index";

describe("supabase package exports", () => {
  it("should export createSupabaseClient function", () => {
    expect(typeof createSupabaseClient).toBe("function");
  });
});
