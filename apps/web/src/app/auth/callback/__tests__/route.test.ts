/**
 * @jest-environment node
 */
import { GET } from "../route";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import { db } from "~/server/db";
import { NextRequest, NextResponse } from "next/server";

jest.mock("~/env", () => ({
  env: {
    ADMIN_ROLE: "admin",
    TECH_ROLE: "tech",
    MODERATOR_ROLE: "moderator",
    SERVICE_ACCOUNT_ROLE: "service-account",
  },
}));

jest.mock("~/lib/supabase/server");
jest.mock("~/server/db", () => ({
  db: {
    user: {
      upsert: jest.fn(),
    },
  },
}));

const mockCreateServerSupabaseClient =
  createServerSupabaseClient as jest.MockedFunction<
    typeof createServerSupabaseClient
  >;
const mockUpsert = db.user.upsert as jest.MockedFunction<typeof db.user.upsert>;

describe("app/auth/callback/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_ROLE = "admin";
    process.env.TECH_ROLE = "tech";
    process.env.MODERATOR_ROLE = "moderator";
    process.env.SERVICE_ACCOUNT_ROLE = "service-account";
  });

  describe("GET", () => {
    it("should redirect to home when no code is provided", async () => {
      const request = new NextRequest("http://localhost:11000/auth/callback");

      const response = await GET(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get("location")).toBe("http://localhost:11000/");
      expect(mockCreateServerSupabaseClient).not.toHaveBeenCalled();
    });

    it("should handle OAuth callback and create new user", async () => {
      const mockSupabaseUser = {
        id: "supabase-123",
        email: "test@example.com",
        user_metadata: {
          name: "Test User",
          avatar_url: "https://example.com/avatar.jpg",
          groups: ["admin", "moderator"],
        },
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      const mockSupabase = {
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);
      mockUpsert.mockResolvedValue({} as any);

      const request = new NextRequest(
        "http://localhost:11000/auth/callback?code=test-code",
      );

      const response = await GET(request);

      expect(mockCreateServerSupabaseClient).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
        "test-code",
      );
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { authUserId: "supabase-123" },
        create: {
          authUserId: "supabase-123",
          email: "test@example.com",
          name: "Test User",
          image: "https://example.com/avatar.jpg",
          emailVerified: new Date("2024-01-01T00:00:00Z"),
          isAdmin: true,
          isModerator: true,
          isServiceAccount: false,
        },
        update: {
          email: "test@example.com",
          name: "Test User",
          image: "https://example.com/avatar.jpg",
          emailVerified: new Date("2024-01-01T00:00:00Z"),
          isAdmin: true,
          isModerator: true,
          isServiceAccount: false,
        },
      });
      expect(response.headers.get("location")).toBe("http://localhost:11000/");
    });

    it("should set isAdmin true when user has TECH_ROLE", async () => {
      const mockSupabaseUser = {
        id: "supabase-tech",
        email: "tech@example.com",
        user_metadata: {
          name: "Tech User",
          groups: ["tech"],
        },
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      const mockSupabase = {
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);
      mockUpsert.mockResolvedValue({} as any);

      const request = new NextRequest(
        "http://localhost:11000/auth/callback?code=tech-code",
      );

      await GET(request);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isAdmin: true,
            isModerator: false,
            isServiceAccount: false,
          }),
          update: expect.objectContaining({
            isAdmin: true,
            isModerator: false,
            isServiceAccount: false,
          }),
        }),
      );
    });

    it("should set isServiceAccount true when user has SERVICE_ACCOUNT_ROLE", async () => {
      const mockSupabaseUser = {
        id: "supabase-service",
        email: "service@example.com",
        user_metadata: {
          name: "Service Account",
          groups: ["service-account"],
        },
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      const mockSupabase = {
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);
      mockUpsert.mockResolvedValue({} as any);

      const request = new NextRequest(
        "http://localhost:11000/auth/callback?code=service-code",
      );

      await GET(request);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isAdmin: false,
            isModerator: false,
            isServiceAccount: true,
          }),
          update: expect.objectContaining({
            isAdmin: false,
            isModerator: false,
            isServiceAccount: true,
          }),
        }),
      );
    });

    it("should handle user with no groups", async () => {
      const mockSupabaseUser = {
        id: "supabase-regular",
        email: "regular@example.com",
        user_metadata: {
          name: "Regular User",
          groups: [],
        },
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      const mockSupabase = {
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);
      mockUpsert.mockResolvedValue({} as any);

      const request = new NextRequest(
        "http://localhost:11000/auth/callback?code=regular-code",
      );

      await GET(request);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isAdmin: false,
            isModerator: false,
            isServiceAccount: false,
          }),
          update: expect.objectContaining({
            isAdmin: false,
            isModerator: false,
            isServiceAccount: false,
          }),
        }),
      );
    });

    it("should handle user with undefined groups", async () => {
      const mockSupabaseUser = {
        id: "supabase-no-groups",
        email: "nogroups@example.com",
        user_metadata: {
          name: "No Groups User",
        },
        email_confirmed_at: null,
      };

      const mockSupabase = {
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);
      mockUpsert.mockResolvedValue({} as any);

      const request = new NextRequest(
        "http://localhost:11000/auth/callback?code=no-groups-code",
      );

      await GET(request);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            emailVerified: null,
            isAdmin: false,
            isModerator: false,
            isServiceAccount: false,
          }),
        }),
      );
    });

    it("should handle Supabase auth error", async () => {
      const mockSupabase = {
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Invalid code" },
          }),
        },
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = new NextRequest(
        "http://localhost:11000/auth/callback?code=invalid-code",
      );

      const response = await GET(request);

      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
        "invalid-code",
      );
      expect(mockUpsert).not.toHaveBeenCalled();
      expect(response.headers.get("location")).toBe("http://localhost:11000/");
    });

    it("should update existing user on login", async () => {
      const mockSupabaseUser = {
        id: "supabase-existing",
        email: "updated@example.com",
        user_metadata: {
          name: "Updated Name",
          avatar_url: "https://example.com/new-avatar.jpg",
          groups: ["moderator"],
        },
        email_confirmed_at: "2024-06-01T00:00:00Z",
      };

      const mockSupabase = {
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);
      mockUpsert.mockResolvedValue({} as any);

      const request = new NextRequest(
        "http://localhost:11000/auth/callback?code=update-code",
      );

      await GET(request);

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { authUserId: "supabase-existing" },
        create: expect.any(Object),
        update: {
          email: "updated@example.com",
          name: "Updated Name",
          image: "https://example.com/new-avatar.jpg",
          emailVerified: new Date("2024-06-01T00:00:00Z"),
          isAdmin: false,
          isModerator: true,
          isServiceAccount: false,
        },
      });
    });
  });
});
