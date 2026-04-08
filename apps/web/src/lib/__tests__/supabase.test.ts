import { describe, expect, test } from "bun:test";

describe("supabase.ts with valid environment", () => {
  test("exports supabase client", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase).toBeDefined();
    expect(supabase).not.toBeNull();
  });

  test("supabase client has auth property", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase).toHaveProperty("auth");
    expect(supabase.auth).toBeDefined();
  });

  test("supabase client has from method", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase).toHaveProperty("from");
    expect(typeof supabase.from).toBe("function");
  });

  test("supabase client has storage property", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase).toHaveProperty("storage");
  });

  test("supabase client has channel method", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase).toHaveProperty("channel");
    expect(typeof supabase.channel).toBe("function");
  });

  test("supabase client has removeChannel method", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase).toHaveProperty("removeChannel");
    expect(typeof supabase.removeChannel).toBe("function");
  });

  test("supabase auth has getUser method", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase.auth).toHaveProperty("getUser");
    expect(typeof supabase.auth.getUser).toBe("function");
  });

  test("supabase auth has signOut method", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase.auth).toHaveProperty("signOut");
    expect(typeof supabase.auth.signOut).toBe("function");
  });

  test("supabase auth has onAuthStateChange method", async () => {
    const { supabase } = await import("../supabase");

    expect(supabase.auth).toHaveProperty("onAuthStateChange");
    expect(typeof supabase.auth.onAuthStateChange).toBe("function");
  });
});
