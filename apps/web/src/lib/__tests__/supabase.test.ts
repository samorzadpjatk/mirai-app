import { describe, expect, test, beforeAll } from "bun:test";

// Set required environment variables BEFORE loading supabase module
// Note: These values must be consistent with other test files due to module caching
process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.PUBLIC_TRPC_API_URL = "http://localhost:3000/api/trpc";
process.env.PUBLIC_TRPC_WS_URL = "ws://localhost:3000/api/trpc";

// Dynamic import after env setup
let supabase: any;

beforeAll(async () => {
  const supabaseModule = await import("../supabase");
  supabase = supabaseModule.supabase;
});

describe("[INTEGRATION] supabase.ts with valid environment", () => {
  test("exports supabase client", async () => {
    expect(supabase).toBeDefined();
    expect(supabase).not.toBeNull();
  });

  test("supabase client has auth property", async () => {
    expect(supabase).toHaveProperty("auth");
    expect(supabase.auth).toBeDefined();
  });

  test("supabase client has from method", async () => {
    expect(supabase).toHaveProperty("from");
    expect(typeof supabase.from).toBe("function");
  });

  test("supabase client has storage property", async () => {
    expect(supabase).toHaveProperty("storage");
  });

  test("supabase client has channel method", async () => {
    expect(supabase).toHaveProperty("channel");
    expect(typeof supabase.channel).toBe("function");
  });

  test("supabase client has removeChannel method", async () => {
    expect(supabase).toHaveProperty("removeChannel");
    expect(typeof supabase.removeChannel).toBe("function");
  });

  test("supabase auth has getUser method", async () => {
    expect(supabase.auth).toHaveProperty("getUser");
    expect(typeof supabase.auth.getUser).toBe("function");
  });

  test("supabase auth has signOut method", async () => {
    expect(supabase.auth).toHaveProperty("signOut");
    expect(typeof supabase.auth.signOut).toBe("function");
  });

  test("supabase auth has onAuthStateChange method", async () => {
    expect(supabase.auth).toHaveProperty("onAuthStateChange");
    expect(typeof supabase.auth.onAuthStateChange).toBe("function");
  });
});
