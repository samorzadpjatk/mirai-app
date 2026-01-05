import { describe, expect, expectTypeOf, it } from "vitest";
import type { SupabaseClientOptions } from "~/types";

describe("SupabaseClientOptions", () => {
  it("treats auth configuration as optional", () => {
    const options: SupabaseClientOptions = {};

    expect(options.auth).toBeUndefined();
  });

  it("accepts synchronous storage adapters", () => {
    const options: SupabaseClientOptions = {
      auth: {
        storage: {
          getItem: () => "value",
          setItem: () => void 0,
          removeItem: () => void 0,
        },
      },
    };

    const storage = options.auth?.storage;
    if (!storage) {
      throw new Error("storage should be defined");
    }

    expect(storage.getItem("key")).toBe("value");
  });

  it("accepts asynchronous storage adapters", async () => {
    const options: SupabaseClientOptions = {
      auth: {
        storage: {
          getItem: () => Promise.resolve("value"),
          setItem: () => Promise.resolve(),
          removeItem: () => Promise.resolve(),
        },
      },
    };

    const storage = options.auth?.storage;
    if (!storage) {
      throw new Error("storage should be defined");
    }

    await expect(storage.getItem("key")).resolves.toBe("value");
  });

  it("exposes optional auth toggles", () => {
    const options: SupabaseClientOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
    };

    expect(options.auth?.autoRefreshToken).toBe(false);
    expect(options.auth?.persistSession).toBe(true);
    expect(options.auth?.detectSessionInUrl).toBe(false);
  });

  it("matches the documented type signature", () => {
    type Storage = NonNullable<
      NonNullable<SupabaseClientOptions["auth"]>["storage"]
    >;

    expectTypeOf<Storage>().toMatchTypeOf<{
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    }>();
  });
});
