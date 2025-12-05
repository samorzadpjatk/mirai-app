import superjson from "superjson";

import { createTRPCContext } from "../trpc";
import { getSession } from "~/server/auth";
import { db } from "@integral-2025-app/db";

jest.spyOn(superjson, "serialize").mockImplementation((data) => ({ json: data, meta: undefined }));
jest.spyOn(superjson, "deserialize").mockImplementation((data) => data.json);
jest.spyOn(superjson, "registerCustom").mockImplementation(jest.fn());

jest.mock("~/server/auth");
jest.mock("@integral-2025-app/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
  },
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe("server/api/trpc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      };
      const mockHeaders = new Headers({ "content-type": "application/json" });

      mockGetSession.mockResolvedValue(mockSession);

      const context = await createTRPCContext({ headers: mockHeaders });

      expect(context).toEqual({
        db,
        session: mockSession,
        headers: mockHeaders,
      });
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it("should create context with null session when not authenticated", async () => {
      const mockHeaders = new Headers();
      mockGetSession.mockResolvedValue(null);

      const context = await createTRPCContext({ headers: mockHeaders });

      expect(context.session).toBeNull();
      expect(context.db).toBe(db);
    });
  });
});
