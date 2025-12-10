import { describe, it, expect, vi } from "vitest";
import { createTRPCContext, createTRPCRouter, publicProcedure } from "../api/trpc";

vi.mock("@integral-2025-app/supabase", () => {
  return {
    createSupabaseClient: vi.fn().mockReturnValue({}),
  };
});

describe("tRPC setup", () => {
  describe("createTRPCContext", () => {
    it("should create context with headers", async () => {
      const headers = new Headers();
      headers.set("user-agent", "test");

      const context = await createTRPCContext({
        headers,
        supabaseUrl: "http://localhost:8000",
        supabaseKey: "test-key",
      });

      expect(context).toBeDefined();
      expect(context.headers).toBe(headers);
      expect(context.db).toBeDefined();
      expect(context.supabase).toBeDefined();
    });

    it("should include session in context", async () => {
      const headers = new Headers();
      const context = await createTRPCContext({
        headers,
        supabaseUrl: "http://localhost:8000",
        supabaseKey: "test-key",
      });

      expect(context).toHaveProperty("session");
    });
  });

  describe("createTRPCRouter", () => {
    it("should create a router", () => {
      const router = createTRPCRouter({
        test: publicProcedure.query(() => "test"),
      });

      expect(router).toBeDefined();
      expect(router._def).toBeDefined();
    });

    it("should create nested routers", () => {
      const nestedRouter = createTRPCRouter({
        nested: publicProcedure.query(() => "nested"),
      });

      const mainRouter = createTRPCRouter({
        sub: nestedRouter,
      });

      expect(mainRouter).toBeDefined();
      expect(mainRouter._def.record.sub).toBeDefined();
    });
  });

  describe("publicProcedure", () => {
    it("should be defined", () => {
      expect(publicProcedure).toBeDefined();
    });

    it("should create a procedure", () => {
      const procedure = publicProcedure.query(() => "test");
      expect(procedure).toBeDefined();
    });
  });
});
