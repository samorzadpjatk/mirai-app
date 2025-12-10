import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTRPCContext } from "../api/trpc";
import { getServerSession } from "@integral-2025-app/auth";
import { db } from "@integral-2025-app/db";
import { supabase } from "@integral-2025-app/supabase";

vi.mock("superjson", () => ({
  default: {
    serialize: vi.fn((data) => ({ json: data, meta: undefined })),
    deserialize: vi.fn((data) => data.json),
  },
}));

vi.mock("@integral-2025-app/auth");
vi.mock("@integral-2025-app/db");
vi.mock("@integral-2025-app/supabase");

const mockGetServerSession = vi.mocked(getServerSession);

describe("server/api/trpc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTRPCContext", () => {
    it("should create context with session and headers", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          authUserId: "supabase-123",
          emailVerified: new Date(),
        },
        authUserId: "supabase-123",
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
      } as any;
      const mockHeaders = new Headers({
        "content-type": "application/json",
        Authorization: "Bearer mock-token",
      });

      mockGetServerSession.mockResolvedValue(mockSession);

      const context = await createTRPCContext({
        headers: mockHeaders,
        supabaseUrl: "http://localhost:8000",
        supabaseKey: "test-key",
      });

      expect(context).toEqual({
        db,
        supabase,
        session: mockSession,
        headers: mockHeaders,
        accessToken: "mock-token",
      });
      expect(mockGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockGetServerSession).toHaveBeenCalledWith(supabase, "mock-token");
    });

    it("should create context with null session when not authenticated", async () => {
      const mockHeaders = new Headers();
      mockGetServerSession.mockResolvedValue(null);

      const context = await createTRPCContext({
        headers: mockHeaders,
        supabaseUrl: "http://localhost:8000",
        supabaseKey: "test-key",
      });

      expect(context.session).toBeNull();
      expect(context.db).toBe(db);
      expect(context.supabase).toBe(supabase);
      expect(context.accessToken).toBeNull();
      expect(mockGetServerSession).not.toHaveBeenCalled();
    });
  });
});
