import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import type {
  Session as ExternalSession,
  SupabaseClient as ExternalSupabaseClient,
  User as ExternalUser,
} from "@supabase/supabase-js";
import type {
  SupabaseClient,
  SupabaseSession,
  SupabaseUser,
} from "~/index";

const createSupabaseClientMock = vi.hoisted(() => vi.fn());

vi.mock("~/client", () => ({
  createSupabaseClient: createSupabaseClientMock,
}));

const importIndex = () => import("~/index");

describe("supabase package entry point", () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseClientMock.mockReset();
  });

  it("re-exports createSupabaseClient from the client module", async () => {
    const { createSupabaseClient } = await importIndex();

    expect(createSupabaseClient).toBe(createSupabaseClientMock);
  });

  it("exposes the expected runtime shape", async () => {
    const exports = await importIndex();
    const runtimeKeys = Object.keys(exports).sort();

    expect(runtimeKeys).toEqual(["createSupabaseClient"]);
  });

  it("re-exports Supabase types", () => {
    expectTypeOf<SupabaseClient>().toEqualTypeOf<ExternalSupabaseClient>();
    expectTypeOf<SupabaseSession>().toEqualTypeOf<ExternalSession>();
    expectTypeOf<SupabaseUser>().toEqualTypeOf<ExternalUser>();
  });
});
