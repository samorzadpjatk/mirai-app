import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("superjson", () => ({
  default: {
    serialize: vi.fn((data) => ({ json: data, meta: undefined })),
    deserialize: vi.fn((data) => data.json),
  },
}));

vi.mock("@integral-2025-app/auth");
vi.mock("@integral-2025-app/db");
vi.mock("@integral-2025-app/supabase", () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

import { createTRPCContext } from "../trpc";
import { db } from "@integral-2025-app/db";
import { createSupabaseClient } from "@integral-2025-app/supabase";

const mockCreateSupabaseClient = vi.mocked(createSupabaseClient);

describe("server/api/trpc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTRPCContext", () => {
    it("should create context with accessToken and headers when authenticated", async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn(),
        },
      };
      mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient as any);

      const mockHeaders = new Headers({
        "content-type": "application/json",
        Authorization: "Bearer mock-token",
      });

      const context = await createTRPCContext({
        headers: mockHeaders,
        supabaseUrl: "http://localhost:8000",
        supabaseKey: "test-key",
      });

      expect(context).toEqual({
        db,
        supabase: mockSupabaseClient,
        headers: mockHeaders,
        accessToken: "mock-token",
      });
      expect(mockCreateSupabaseClient).toHaveBeenCalledWith("http://localhost:8000", "test-key");
    });

    it("should create context without accessToken when not authenticated", async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn(),
        },
      };
      mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient as any);

      const mockHeaders = new Headers();

      const context = await createTRPCContext({
        headers: mockHeaders,
        supabaseUrl: "http://localhost:8000",
        supabaseKey: "test-key",
      });

      expect(context.db).toBe(db);
      expect(context.supabase).toBe(mockSupabaseClient);
      expect(context.accessToken).toBeNull();
    });

    it("should read accessToken from connectionParams when headers are missing", async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn(),
        },
      };
      mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient as any);

      const mockHeaders = new Headers();

      const context = await createTRPCContext({
        headers: mockHeaders,
        supabaseUrl: "http://localhost:8000",
        supabaseKey: "test-key",
        connectionParams: {
          authToken: "ws-token",
        },
      });

      expect(context).toEqual({
        db,
        supabase: mockSupabaseClient,
        headers: mockHeaders,
        accessToken: "ws-token",
      });
    });
  });
});
